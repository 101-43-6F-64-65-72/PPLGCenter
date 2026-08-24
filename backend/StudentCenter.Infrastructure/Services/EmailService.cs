using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class EmailService : IEmailService
{
    private static readonly HttpClient _httpClient = new();
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public EmailConfigStatusResponse GetConfigStatus()
    {
        var resendKey = GetEnvOrConfig("RESEND_API_KEY");
        var smtpHost = GetEnvOrConfig("SMTP_HOST");
        var smtpUser = GetEnvOrConfig("SMTP_USER");
        var fromEmail = GetEnvOrConfig("EMAIL_FROM") ?? "Replyz@pplgcenter.web.id";
        var fromName = GetEnvOrConfig("EMAIL_FROM_NAME") ?? "Replyz";
        var envMode = GetEnvOrConfig("ASPNETCORE_ENVIRONMENT") ?? GetEnvOrConfig("EMAIL_MODE") ?? "Development";

        var isResendAvailable = !string.IsNullOrWhiteSpace(resendKey);
        var isSmtpAvailable = !string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser);

        string configuredProvider;
        if (isResendAvailable)
        {
            configuredProvider = "Resend (API)";
        }
        else if (isSmtpAvailable)
        {
            configuredProvider = "SMTP";
        }
        else
        {
            configuredProvider = "Not Configured";
        }

        return new EmailConfigStatusResponse
        {
            Sender = fromEmail,
            SenderName = fromName,
            ConfiguredProvider = configuredProvider,
            IsResendAvailable = isResendAvailable,
            IsSmtpAvailable = isSmtpAvailable,
            Environment = envMode
        };
    }

    public async Task<SendEmailResult> SendEmailAsync(
        string to,
        string subject,
        string body,
        bool isHtml = true,
        Guid? recipientUserId = null,
        Guid? createdByUserId = null)
    {
        var normalizedTo = to.Trim().ToLowerInvariant();
        var normalizedSubject = subject.Trim();
        var fromEmail = GetEnvOrConfig("EMAIL_FROM") ?? "Replyz@pplgcenter.web.id";
        var fromName = GetEnvOrConfig("EMAIL_FROM_NAME") ?? "Replyz";

        var resendKey = GetEnvOrConfig("RESEND_API_KEY");
        var smtpHost = GetEnvOrConfig("SMTP_HOST");
        var smtpUser = GetEnvOrConfig("SMTP_USER");

        string providerName;
        if (!string.IsNullOrWhiteSpace(resendKey))
        {
            providerName = "Resend";
        }
        else if (!string.IsNullOrWhiteSpace(smtpHost) && !string.IsNullOrWhiteSpace(smtpUser))
        {
            providerName = "SMTP";
        }
        else
        {
            providerName = "None";
        }

        // 1. Create Initial Pending Log in Database
        var emailLog = new EmailLog
        {
            Id = Guid.NewGuid(),
            Recipient = normalizedTo,
            RecipientUserId = recipientUserId,
            Sender = fromEmail,
            Subject = normalizedSubject,
            Message = body.Length > 4900 ? body[..4900] + "... (truncated)" : body,
            Provider = providerName,
            Status = EmailStatus.Pending,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailLogs.Add(emailLog);
        await _context.SaveChangesAsync();

        // 2. Check if provider is configured
        if (providerName == "None")
        {
            var configError = "Email provider is not configured. Please set RESEND_API_KEY or SMTP credentials in environment variables.";
            emailLog.Status = EmailStatus.Failed;
            emailLog.ErrorMessage = configError;
            await _context.SaveChangesAsync();

            return new SendEmailResult
            {
                Success = false,
                EmailLogId = emailLog.Id,
                Provider = "None",
                ErrorMessage = configError
            };
        }

        // 3. Dispatch Email with Explicit Priority
        try
        {
            if (providerName == "Resend")
            {
                var (success, providerResponse, messageId, error) = await SendViaResendAsync(
                    resendKey!, fromEmail, fromName, normalizedTo, normalizedSubject, body, isHtml);

                if (success)
                {
                    emailLog.Status = EmailStatus.Sent;
                    emailLog.SentAt = DateTime.UtcNow;
                    emailLog.ProviderResponse = providerResponse;
                    await _context.SaveChangesAsync();

                    return new SendEmailResult
                    {
                        Success = true,
                        EmailLogId = emailLog.Id,
                        MessageId = messageId,
                        Provider = "Resend",
                        ProviderResponse = providerResponse
                    };
                }
                else
                {
                    emailLog.Status = EmailStatus.Failed;
                    emailLog.ErrorMessage = error;
                    emailLog.ProviderResponse = providerResponse;
                    await _context.SaveChangesAsync();

                    return new SendEmailResult
                    {
                        Success = false,
                        EmailLogId = emailLog.Id,
                        Provider = "Resend",
                        ErrorMessage = error,
                        ProviderResponse = providerResponse
                    };
                }
            }
            else // SMTP
            {
                var (success, providerResponse, error) = await SendViaSmtpAsync(
                    fromEmail, fromName, normalizedTo, normalizedSubject, body, isHtml);

                if (success)
                {
                    emailLog.Status = EmailStatus.Sent;
                    emailLog.SentAt = DateTime.UtcNow;
                    emailLog.ProviderResponse = providerResponse;
                    await _context.SaveChangesAsync();

                    return new SendEmailResult
                    {
                        Success = true,
                        EmailLogId = emailLog.Id,
                        Provider = "SMTP",
                        ProviderResponse = providerResponse
                    };
                }
                else
                {
                    emailLog.Status = EmailStatus.Failed;
                    emailLog.ErrorMessage = error;
                    emailLog.ProviderResponse = providerResponse;
                    await _context.SaveChangesAsync();

                    return new SendEmailResult
                    {
                        Success = false,
                        EmailLogId = emailLog.Id,
                        Provider = "SMTP",
                        ErrorMessage = error,
                        ProviderResponse = providerResponse
                    };
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error dispatching email to {Recipient}", normalizedTo);
            emailLog.Status = EmailStatus.Failed;
            emailLog.ErrorMessage = ex.Message;
            await _context.SaveChangesAsync();

            return new SendEmailResult
            {
                Success = false,
                EmailLogId = emailLog.Id,
                Provider = providerName,
                ErrorMessage = ex.Message
            };
        }
    }

    private async Task<(bool success, string response, string? messageId, string? error)> SendViaResendAsync(
        string apiKey,
        string fromEmail,
        string fromName,
        string to,
        string subject,
        string body,
        bool isHtml)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new Dictionary<string, object>
        {
            ["from"] = string.IsNullOrWhiteSpace(fromName) ? fromEmail : $"{fromName} <{fromEmail}>",
            ["to"] = new[] { to },
            ["subject"] = subject,
            [isHtml ? "html" : "text"] = body
        };

        var json = JsonSerializer.Serialize(payload);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            string? id = null;
            try
            {
                using var doc = JsonDocument.Parse(responseContent);
                if (doc.RootElement.TryGetProperty("id", out var idProp))
                {
                    id = idProp.GetString();
                }
            }
            catch { }

            return (true, responseContent, id, null);
        }
        else
        {
            string errorMessage = $"Resend HTTP {(int)response.StatusCode}: {responseContent}";
            try
            {
                using var doc = JsonDocument.Parse(responseContent);
                if (doc.RootElement.TryGetProperty("message", out var msgProp))
                {
                    errorMessage = msgProp.GetString() ?? errorMessage;
                }
            }
            catch { }

            return (false, responseContent, null, errorMessage);
        }
    }

    private async Task<(bool success, string response, string? error)> SendViaSmtpAsync(
        string fromEmail,
        string fromName,
        string to,
        string subject,
        string body,
        bool isHtml)
    {
        var host = GetEnvOrConfig("SMTP_HOST") ?? string.Empty;
        var portStr = GetEnvOrConfig("SMTP_PORT") ?? "587";
        var user = GetEnvOrConfig("SMTP_USER") ?? string.Empty;
        var pass = GetEnvOrConfig("SMTP_PASS") ?? string.Empty;
        var useSslStr = GetEnvOrConfig("SMTP_USE_SSL") ?? "true";

        if (!int.TryParse(portStr, out var port)) port = 587;
        var useSsl = bool.TryParse(useSslStr, out var b) && b;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(new MailboxAddress(to, to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder();
        if (isHtml)
        {
            bodyBuilder.HtmlBody = body;
        }
        else
        {
            bodyBuilder.TextBody = body;
        }
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            var secureSocketOptions = port == 465 
                ? SecureSocketOptions.SslOnConnect 
                : (useSsl ? SecureSocketOptions.StartTlsWhenAvailable : SecureSocketOptions.Auto);

            await client.ConnectAsync(host, port, secureSocketOptions);

            if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
            {
                await client.AuthenticateAsync(user, pass);
            }

            var response = await client.SendAsync(message);
            await client.DisconnectAsync(true);

            return (true, $"SMTP Send Success: {response}", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP dispatch error for {Recipient}", to);
            return (false, string.Empty, ex.Message);
        }
    }

    public async Task<PagedResult<EmailLogResponse>> GetEmailLogsAsync(int page = 1, int pageSize = 20, string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _context.EmailLogs
            .Include(e => e.RecipientUser)
            .Include(e => e.CreatedByUser)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(e =>
                e.Recipient.ToLower().Contains(s) ||
                e.Subject.ToLower().Contains(s) ||
                e.Sender.ToLower().Contains(s) ||
                e.Provider.ToLower().Contains(s));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EmailLogResponse
            {
                Id = e.Id,
                RecipientUserId = e.RecipientUserId,
                RecipientUserFullName = e.RecipientUser != null ? e.RecipientUser.FullName : null,
                Recipient = e.Recipient,
                Sender = e.Sender,
                Subject = e.Subject,
                Message = e.Message,
                Provider = e.Provider,
                ProviderResponse = e.ProviderResponse,
                Status = e.Status,
                ErrorMessage = e.ErrorMessage,
                CreatedByUserId = e.CreatedByUserId,
                CreatedByUserFullName = e.CreatedByUser != null ? e.CreatedByUser.FullName : null,
                CreatedAt = e.CreatedAt,
                SentAt = e.SentAt
            })
            .ToListAsync();

        return new PagedResult<EmailLogResponse>
        {
            Items = items,
            TotalCount = totalItems,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<EmailLogResponse?> GetEmailLogByIdAsync(Guid id)
    {
        var e = await _context.EmailLogs
            .Include(x => x.RecipientUser)
            .Include(x => x.CreatedByUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (e == null) return null;

        return new EmailLogResponse
        {
            Id = e.Id,
            RecipientUserId = e.RecipientUserId,
            RecipientUserFullName = e.RecipientUser != null ? e.RecipientUser.FullName : null,
            Recipient = e.Recipient,
            Sender = e.Sender,
            Subject = e.Subject,
            Message = e.Message,
            Provider = e.Provider,
            ProviderResponse = e.ProviderResponse,
            Status = e.Status,
            ErrorMessage = e.ErrorMessage,
            CreatedByUserId = e.CreatedByUserId,
            CreatedByUserFullName = e.CreatedByUser != null ? e.CreatedByUser.FullName : null,
            CreatedAt = e.CreatedAt,
            SentAt = e.SentAt
        };
    }

    private string? GetEnvOrConfig(string key)
    {
        return Environment.GetEnvironmentVariable(key) ?? _configuration[key];
    }
}
