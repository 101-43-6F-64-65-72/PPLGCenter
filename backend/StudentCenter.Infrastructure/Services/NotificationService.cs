using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using System.Security.Cryptography;

namespace StudentCenter.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IEmailService? _emailService;
    private readonly IConfiguration? _configuration;
    private readonly ILogger<NotificationService>? _logger;

    public NotificationService(
        AppDbContext context,
        IEmailService? emailService = null,
        IConfiguration? configuration = null,
        ILogger<NotificationService>? logger = null)
    {
        _context = context;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    private static NotificationReferenceType ParseReferenceType(string? refType)
    {
        if (string.IsNullOrWhiteSpace(refType))
            return NotificationReferenceType.None;

        if (Enum.TryParse<NotificationReferenceType>(refType, true, out var parsed))
            return parsed;

        return NotificationReferenceType.None;
    }

    private async Task<bool> IsDuplicateWithinCooldownAsync(
        Guid userId, 
        NotificationType type, 
        NotificationReferenceType refType, 
        string? refId, 
        string body)
    {
        var cooldownWindow = DateTime.UtcNow.AddSeconds(-30);
        return await _context.Set<Notification>()
            .AsNoTracking()
            .AnyAsync(n => n.UserId == userId &&
                           n.Type == type &&
                           n.ReferenceType == refType &&
                           n.ReferenceId == refId &&
                           n.Body == body &&
                           n.CreatedAt >= cooldownWindow);
    }

    public async Task CreateAsync(CreateNotificationRequest request)
    {
        var refType = request.ReferenceType != NotificationReferenceType.None 
            ? request.ReferenceType 
            : ParseReferenceType(request.ReferenceType.ToString());

        var userExistsAndActive = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.UserId && u.IsActive);

        if (!userExistsAndActive)
            return;

        if (await IsDuplicateWithinCooldownAsync(request.UserId, request.Type, refType, request.ReferenceId, request.Message))
            return;

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Title = request.Title,
            Body = request.Message,
            Type = request.Type,
            Priority = request.Priority,
            ReferenceId = request.ReferenceId,
            ReferenceType = refType,
            ActionUrl = request.ActionUrl,
            Icon = request.Icon,
            Color = request.Color,
            Metadata = request.Metadata,
            IsRead = false,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<Notification>().Add(notification);
        await _context.SaveChangesAsync();

        // Asynchronously dispatch AI-processed email notification to verified EmailNotif
        await DispatchEmailNotificationIfConfiguredAsync(notification);
    }

    private async Task DispatchEmailNotificationIfConfiguredAsync(Notification notification)
    {
        if (_emailService == null)
            return;

        try
        {
            var recipient = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == notification.UserId && u.IsActive)
                .Select(u => new { u.EmailNotif, u.EmailVerifiedAt, u.FullName })
                .FirstOrDefaultAsync();

            if (recipient == null || string.IsNullOrWhiteSpace(recipient.EmailNotif) || recipient.EmailVerifiedAt == null)
                return;

            var (subject, emailHtml) = GenerateAiStyledNotificationEmail(notification, recipient.FullName);

            await _emailService.SendEmailAsync(
                to: recipient.EmailNotif,
                subject: subject,
                body: emailHtml,
                isHtml: true,
                recipientUserId: notification.UserId);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to dispatch email notification to user '{UserId}'. In-app notification was preserved.", notification.UserId);
        }
    }

    private (string Subject, string EmailHtml) GenerateAiStyledNotificationEmail(Notification notification, string fullName)
    {
        var firstName = fullName?.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? fullName ?? "Sobat";
        var safeFirstName = System.Net.WebUtility.HtmlEncode(firstName);
        var safeTitle = System.Net.WebUtility.HtmlEncode(notification.Title ?? "Notifikasi PPLG Center");
        var safeBody = System.Net.WebUtility.HtmlEncode(notification.Body ?? string.Empty);

        // Classification & peer-voice copywriting without emojis
        string categoryBadge;
        string badgeColor;
        string greeting;
        string actionLabel;

        switch (notification.Type)
        {
            case NotificationType.Assignment:
            case NotificationType.MaterialPublished:
                categoryBadge = "TUGAS & MATERI BARU";
                badgeColor = "#0284c7";
                greeting = $"Yo {safeFirstName}! Ada tugas atau materi belajar baru yang baru saja dirilis:";
                actionLabel = "Buka Tugas di Web";
                break;

            case NotificationType.AssignmentGraded:
            case NotificationType.GradePublished:
            case NotificationType.GradeUpdated:
            case NotificationType.AssessmentPublished:
                categoryBadge = "UPDATE NILAI & HASIL";
                badgeColor = "#16a34a";
                greeting = $"Hai {safeFirstName}! Hasil tugas atau nilai kamu baru saja diperbarui:";
                actionLabel = "Lihat Rekap Nilai";
                break;

            case NotificationType.AttendanceOpened:
            case NotificationType.AttendanceClosed:
                categoryBadge = "PRESENSI & KEHADIRAN";
                badgeColor = "#ca8a04";
                greeting = $"Hey {safeFirstName}! Sesi absensi kehadiran kamu sudah dibuka:";
                actionLabel = "Isi Kehadiran Sekarang";
                break;

            case NotificationType.Announcement:
            case NotificationType.AcademicEvent:
            case NotificationType.ElectionOpen:
            case NotificationType.ElectionClosingSoon:
            case NotificationType.ElectionClosed:
            case NotificationType.ElectionResultPublished:
                categoryBadge = "PENGUMUMAN RESMI";
                badgeColor = "#4f46e5";
                greeting = $"Halo {safeFirstName}! Ada informasi dan pengumuman resmi di PPLG Center:";
                actionLabel = "Baca Pengumuman";
                break;

            case NotificationType.Mention:
                categoryBadge = "SEBUTAN & MENTION";
                badgeColor = "#8b5cf6";
                greeting = $"Hai {safeFirstName}, kamu baru saja disebut (mention) dalam komunitas:";
                actionLabel = "Lihat Mention di Web";
                break;

            case NotificationType.DiscussionReply:
            case NotificationType.PrivateMessage:
            case NotificationType.AnnouncementComment:
            case NotificationType.NewDiscussion:
                categoryBadge = "PESAN & KOMENTAR";
                badgeColor = "#8b5cf6";
                greeting = $"Yo {safeFirstName}! Ada pesan atau tanggapan baru untuk kamu:";
                actionLabel = "Buka Percakapan";
                break;

            case NotificationType.Proposal:
            case NotificationType.ProposalSubmitted:
            case NotificationType.ProposalApproved:
            case NotificationType.ProposalRejected:
            case NotificationType.ProposalRevisionRequested:
            case NotificationType.ExtracurricularRegistrationApproved:
            case NotificationType.ExtracurricularRegistrationRejected:
            case NotificationType.Booking:
                categoryBadge = "STATUS PENGAJUAN";
                badgeColor = "#e11d48";
                greeting = $"Hai {safeFirstName}! Ada pembaruan status pengajuan kamu:";
                actionLabel = "Cek Status Pengajuan";
                break;

            default:
                categoryBadge = "NOTIFIKASI SISTEM";
                badgeColor = "#2c1ee8";
                greeting = $"Halo {safeFirstName}! Ada pembaruan dari sistem PPLG Center:";
                actionLabel = "Buka PPLG Center";
                break;
        }

        var subject = $"[{categoryBadge}] {notification.Title}";

        // Resolve Action URL
        var baseUrl = _configuration?["NEXT_PUBLIC_API_BASE_URL"] 
            ?? _configuration?["CORS__AllowedOrigins"]?.Split(',').FirstOrDefault() 
            ?? "http://localhost:3000";

        var actionUrl = !string.IsNullOrWhiteSpace(notification.ActionUrl)
            ? (notification.ActionUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase) 
                ? notification.ActionUrl 
                : $"{baseUrl.TrimEnd('/')}/{notification.ActionUrl.TrimStart('/')}")
            : $"{baseUrl.TrimEnd('/')}/notifications";

        var emailHtml = $@"
<!DOCTYPE html>
<html lang=""id"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>{safeTitle}</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;"">
  <table role=""presentation"" width=""100%"" cellspacing=""0"" cellpadding=""0"" style=""background-color: #f1f5f9; padding: 40px 16px;"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" width=""100%"" style=""max-width: 520px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.07); text-align: left;"">
          
          <!-- Top Brand Accent Bar -->
          <tr>
            <td style=""height: 6px; background: linear-gradient(90deg, #2c1ee8 0%, #4f46e5 50%, #38bdf8 100%);""></td>
          </tr>

          <!-- Mascot & Header -->
          <tr>
            <td style=""padding: 32px 32px 16px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;"">
              
              <!-- Happy Replyz Mascot SVG -->
              <div style=""display: inline-block; margin-bottom: 14px;"">
                <svg width=""68"" height=""68"" viewBox=""-100 -100 200 200"" fill=""none"" xmlns=""http://www.w3.org/2000/svg"" style=""display: block; margin: 0 auto; filter: drop-shadow(0 8px 16px rgba(44, 30, 232, 0.15));"">
                  <defs>
                    <linearGradient id=""notif-mascot-grad"" x1=""-100"" y1=""-100"" x2=""100"" y2=""100"" gradientUnits=""userSpaceOnUse"">
                      <stop offset=""0%"" stop-color=""#1e1b4b"" />
                      <stop offset=""100%"" stop-color=""#0f172a"" />
                    </linearGradient>
                  </defs>
                  <circle cx=""0"" cy=""0"" r=""96"" fill=""url(#notif-mascot-grad)"" stroke=""#38bdf8"" stroke-width=""5"" />
                  <g fill=""#ffffff"">
                    <g transform=""translate(-30, -6) scale(1.5)"">
                      <path d=""M -13 5 C -13 -8, 13 -8, 13 5 C 8 0, -8 0, -13 5 Z"" />
                    </g>
                    <g transform=""translate(30, -6) scale(1.5)"">
                      <path d=""M -13 5 C -13 -8, 13 -8, 13 5 C 8 0, -8 0, -13 5 Z"" />
                    </g>
                  </g>
                  <circle cx=""-52"" cy=""22"" r=""11"" fill=""#f472b6"" opacity=""0.4"" />
                  <circle cx=""52"" cy=""22"" r=""11"" fill=""#f472b6"" opacity=""0.4"" />
                </svg>
              </div>

              <!-- Category Badge -->
              <div>
                <span style=""display: inline-block; padding: 4px 12px; background-color: rgba(44, 30, 232, 0.08); border: 1px solid rgba(44, 30, 232, 0.2); border-radius: 9999px; color: {badgeColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;"">
                  {categoryBadge}
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style=""padding: 24px 32px 32px 32px;"">
              
              <p style=""margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #0f172a; line-height: 1.5;"">
                {greeting}
              </p>

              <!-- Notification Card -->
              <div style=""background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 20px; margin-bottom: 24px;"">
                <h3 style=""margin: 0 0 8px 0; font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.4;"">
                  {safeTitle}
                </h3>
                <p style=""margin: 0; font-size: 14px; line-height: 1.6; color: #475569;"">
                  {safeBody}
                </p>
              </div>

              <!-- Action Button -->
              <div style=""text-align: center; margin-bottom: 24px;"">
                <a href=""{actionUrl}"" target=""_blank"" style=""display: inline-block; padding: 13px 28px; background-color: #2c1ee8; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 14px; box-shadow: 0 4px 12px rgba(44, 30, 232, 0.25);"">
                  {actionLabel} ➔
                </a>
              </div>

              <p style=""margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;"">
                Notifikasi ini dikirim karena kamu menghubungkan email ini di profil PPLG Center.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;"">
              <p style=""margin: 0; font-size: 11px; color: #94a3b8; font-weight: 500;"">
                Dikirim otomatis oleh <strong>Replyz</strong> (&lt;Replyz@pplgcenter.web.id&gt;) • PPLG Center
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        return (subject, emailHtml);
    }

    public async Task NotifyUserAsync(
        Guid userId, 
        string title, 
        string message, 
        NotificationType type, 
        string? referenceId = null, 
        string? referenceType = null)
    {
        var refEnum = ParseReferenceType(referenceType);
        await NotifyUserAsync(userId, title, message, type, NotificationPriority.Normal, referenceId, refEnum);
    }

    public async Task NotifyUserAsync(
        Guid userId, 
        string title, 
        string body, 
        NotificationType type, 
        NotificationPriority priority, 
        string? referenceId = null, 
        NotificationReferenceType referenceType = NotificationReferenceType.None, 
        string? actionUrl = null, 
        string? icon = null, 
        string? color = null, 
        string? metadata = null)
    {
        var userExistsAndActive = await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == userId && u.IsActive);

        if (!userExistsAndActive)
            return;

        if (await IsDuplicateWithinCooldownAsync(userId, type, referenceType, referenceId, body))
            return;

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Body = body,
            Type = type,
            Priority = priority,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            ActionUrl = actionUrl,
            Icon = icon,
            Color = color,
            Metadata = metadata,
            IsRead = false,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<Notification>().Add(notification);
        await _context.SaveChangesAsync();

        // Dispatch real-time email notification to recipient with verified EmailNotif
        await DispatchEmailNotificationIfConfiguredAsync(notification);
    }

    public async Task NotifyUsersAsync(
        IEnumerable<Guid> userIds, 
        string title, 
        string message, 
        NotificationType type, 
        string? referenceId = null, 
        string? referenceType = null)
    {
        var refEnum = ParseReferenceType(referenceType);
        await NotifyUsersAsync(userIds, title, message, type, NotificationPriority.Normal, referenceId, refEnum);
    }

    public async Task NotifyUsersAsync(
        IEnumerable<Guid> userIds, 
        string title, 
        string body, 
        NotificationType type, 
        NotificationPriority priority, 
        string? referenceId = null, 
        NotificationReferenceType referenceType = NotificationReferenceType.None, 
        string? actionUrl = null, 
        string? icon = null, 
        string? color = null, 
        string? metadata = null)
    {
        var distinctUserIds = userIds.Distinct().ToList();
        if (!distinctUserIds.Any())
            return;

        var activeUserIds = await _context.Users
            .AsNoTracking()
            .Where(u => distinctUserIds.Contains(u.Id) && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        if (!activeUserIds.Any())
            return;

        var notifications = new List<Notification>();
        var now = DateTime.UtcNow;
        var cooldownWindow = now.AddSeconds(-30);

        var duplicateUserIds = await _context.Set<Notification>()
            .AsNoTracking()
            .Where(n => activeUserIds.Contains(n.UserId) &&
                        n.Type == type &&
                        n.ReferenceType == referenceType &&
                        n.ReferenceId == referenceId &&
                        n.Body == body &&
                        n.CreatedAt >= cooldownWindow)
            .Select(n => n.UserId)
            .ToListAsync();

        var duplicateUserSet = new HashSet<Guid>(duplicateUserIds);

        foreach (var userId in activeUserIds)
        {
            if (duplicateUserSet.Contains(userId))
                continue;

            notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Body = body,
                Type = type,
                Priority = priority,
                ReferenceId = referenceId,
                ReferenceType = referenceType,
                ActionUrl = actionUrl,
                Icon = icon,
                Color = color,
                Metadata = metadata,
                IsRead = false,
                IsDeleted = false,
                CreatedAt = now
            });
        }

        if (notifications.Any())
        {
            _context.Set<Notification>().AddRange(notifications);
            await _context.SaveChangesAsync();

            // Dispatch real-time batch email notifications to all recipients with verified EmailNotif
            await DispatchBatchEmailNotificationsIfConfiguredAsync(notifications);
        }
    }

    private async Task DispatchBatchEmailNotificationsIfConfiguredAsync(List<Notification> notifications)
    {
        if (_emailService == null || !notifications.Any())
            return;

        try
        {
            var targetUserIds = notifications.Select(n => n.UserId).Distinct().ToList();

            var recipients = await _context.Users
                .AsNoTracking()
                .Where(u => targetUserIds.Contains(u.Id) && u.IsActive && u.EmailVerifiedAt != null && !string.IsNullOrWhiteSpace(u.EmailNotif))
                .Select(u => new { u.Id, u.EmailNotif, u.FullName })
                .ToDictionaryAsync(u => u.Id);

            if (!recipients.Any())
                return;

            foreach (var notif in notifications)
            {
                if (!recipients.TryGetValue(notif.UserId, out var user) || string.IsNullOrWhiteSpace(user.EmailNotif))
                    continue;

                try
                {
                    var (subject, emailHtml) = GenerateAiStyledNotificationEmail(notif, user.FullName);
                    await _emailService.SendEmailAsync(
                        to: user.EmailNotif,
                        subject: subject,
                        body: emailHtml,
                        isHtml: true,
                        recipientUserId: notif.UserId);
                }
                catch (Exception sendEx)
                {
                    _logger?.LogWarning(sendEx, "Failed to send real-time email notification to '{Email}' for user '{UserId}'.", user.EmailNotif, notif.UserId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to dispatch batch email notifications.");
        }
    }

    public async Task BroadcastAsync(
        string title, 
        string body, 
        NotificationType type = NotificationType.Announcement, 
        string? targetRole = null, 
        NotificationPriority priority = NotificationPriority.Normal, 
        string? actionUrl = null, 
        string? icon = null, 
        string? color = null, 
        string? metadata = null)
    {
        await BroadcastWithSenderAsync(Guid.Empty, "Pengelola Sekolah", title, body, type, targetRole, priority, actionUrl, icon, color, metadata);
    }

    public async Task BroadcastWithSenderAsync(
        Guid senderUserId,
        string senderName,
        string title, 
        string body, 
        NotificationType type, 
        string? targetRole = null, 
        NotificationPriority priority = NotificationPriority.Normal, 
        string? actionUrl = null, 
        string? icon = null, 
        string? color = null, 
        string? metadata = null)
    {
        var query = _context.Users.AsNoTracking().Where(u => u.IsActive);

        if (!string.IsNullOrWhiteSpace(targetRole))
        {
            if (Enum.TryParse<UserRole>(targetRole.Trim(), true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }
            else
            {
                var roleNameUpper = targetRole.Trim().ToUpper();
                if (roleNameUpper == "SISWA" || roleNameUpper == "STUDENT")
                    query = query.Where(u => u.Role == UserRole.Student);
                else if (roleNameUpper == "GURU" || roleNameUpper == "TEACHER")
                    query = query.Where(u => u.Role == UserRole.Teacher);
                else if (roleNameUpper == "ADMIN")
                    query = query.Where(u => u.Role == UserRole.Admin);
            }
        }

        var targetUserIds = await query.Select(u => u.Id).ToListAsync();
        if (!targetUserIds.Any())
            return;

        var broadcastId = Guid.NewGuid().ToString();
        var metadataObj = new
        {
            broadcastId = broadcastId,
            createdByUserId = senderUserId.ToString(),
            createdByName = senderName,
            targetRole = targetRole ?? ""
        };

        var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadataObj);
        await NotifyUsersAsync(targetUserIds, title, body, type, priority, null, NotificationReferenceType.None, actionUrl, icon, color, metadataJson);
    }

    public async Task<List<BroadcastItemResponse>> GetBroadcastListAsync()
    {
        try
        {
            var notifications = await _context.Set<Notification>()
                .AsNoTracking()
                .Where(n => !n.IsDeleted && n.Metadata != null && EF.Functions.Like(n.Metadata, "%broadcastId%"))
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            var broadcastGroups = new Dictionary<string, List<Notification>>();

            foreach (var notif in notifications)
            {
                if (string.IsNullOrWhiteSpace(notif.Metadata)) continue;
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(notif.Metadata);
                    if (doc.RootElement.TryGetProperty("broadcastId", out var bIdElement))
                    {
                        var bId = bIdElement.GetString();
                        if (!string.IsNullOrEmpty(bId))
                        {
                            if (!broadcastGroups.ContainsKey(bId))
                            {
                                broadcastGroups[bId] = new List<Notification>();
                            }
                            broadcastGroups[bId].Add(notif);
                        }
                    }
                }
                catch {}
            }

            var result = new List<BroadcastItemResponse>();

            foreach (var kvp in broadcastGroups)
            {
                var bId = kvp.Key;
                var group = kvp.Value;
                var first = group.First();

                Guid createdByUserId = Guid.Empty;
                string createdByName = "Pengelola Sekolah";
                string targetRole = "";

                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(first.Metadata!);
                    if (doc.RootElement.TryGetProperty("createdByUserId", out var uidElem) && Guid.TryParse(uidElem.GetString(), out var uid))
                    {
                        createdByUserId = uid;
                    }
                    if (doc.RootElement.TryGetProperty("createdByName", out var nameElem))
                    {
                        createdByName = nameElem.GetString() ?? "Pengelola Sekolah";
                    }
                    if (doc.RootElement.TryGetProperty("targetRole", out var roleElem))
                    {
                        targetRole = roleElem.GetString() ?? "";
                    }
                }
                catch {}

                result.Add(new BroadcastItemResponse
                {
                    BroadcastId = bId,
                    Title = first.Title,
                    Body = first.Body,
                    Type = first.Type,
                    Priority = first.Priority,
                    TargetRole = targetRole,
                    ActionUrl = first.ActionUrl,
                    CreatedByUserId = createdByUserId,
                    CreatedByName = createdByName,
                    CreatedAt = first.CreatedAt,
                    RecipientCount = group.Count
                });
            }

            return result.OrderByDescending(b => b.CreatedAt).ToList();
        }
        catch
        {
            return new List<BroadcastItemResponse>();
        }
    }

    public async Task<bool> UpdateBroadcastAsync(string broadcastId, Guid requestingUserId, UpdateBroadcastRequest request)
    {
        var notifications = await _context.Set<Notification>()
            .Where(n => !n.IsDeleted && n.Metadata != null && EF.Functions.Like(n.Metadata, $"%{broadcastId}%"))
            .ToListAsync();

        if (!notifications.Any())
            return false;

        var first = notifications.First();
        Guid createdByUserId = Guid.Empty;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(first.Metadata!);
            if (doc.RootElement.TryGetProperty("createdByUserId", out var uidElem))
            {
                Guid.TryParse(uidElem.GetString(), out createdByUserId);
            }
        }
        catch {}

        if (createdByUserId != Guid.Empty && createdByUserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("Anda hanya dapat mengedit broadcast yang Anda buat sendiri.");
        }

        var now = DateTime.UtcNow;
        foreach (var notif in notifications)
        {
            notif.Title = request.Title;
            notif.Body = request.Body;
            notif.Type = request.Type;
            notif.Priority = request.Priority;
            if (request.ActionUrl != null) notif.ActionUrl = request.ActionUrl;
            notif.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBroadcastAsync(string broadcastId, Guid requestingUserId, bool isAdmin)
    {
        var notifications = await _context.Set<Notification>()
            .Where(n => !n.IsDeleted && n.Metadata != null && EF.Functions.Like(n.Metadata, $"%{broadcastId}%"))
            .ToListAsync();

        if (!notifications.Any())
            return false;

        var first = notifications.First();
        Guid createdByUserId = Guid.Empty;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(first.Metadata!);
            if (doc.RootElement.TryGetProperty("createdByUserId", out var uidElem) && Guid.TryParse(uidElem.GetString(), out var uid))
            {
                createdByUserId = uid;
            }
        }
        catch {}

        if (!isAdmin && createdByUserId != Guid.Empty && createdByUserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("Anda tidak memiliki izin untuk menghapus broadcast ini.");
        }

        var now = DateTime.UtcNow;
        foreach (var notif in notifications)
        {
            notif.IsDeleted = true;
            notif.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(Guid userId, int page, int pageSize)
    {
        return await GetMyNotificationsAsync(userId, new NotificationFilterRequest { Page = page, PageSize = pageSize });
    }

    public async Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(Guid userId, NotificationFilterRequest filter)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var query = _context.Set<Notification>()
            .AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDeleted);

        if (filter.Type.HasValue)
            query = query.Where(n => n.Type == filter.Type.Value);

        if (filter.Priority.HasValue)
            query = query.Where(n => n.Priority == filter.Priority.Value);

        if (filter.IsRead.HasValue)
            query = query.Where(n => n.IsRead == filter.IsRead.Value);

        if (filter.ReferenceType.HasValue)
            query = query.Where(n => n.ReferenceType == filter.ReferenceType.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                UserId = n.UserId,
                Title = n.Title,
                Body = n.Body,
                Type = n.Type,
                Priority = n.Priority,
                ReferenceId = n.ReferenceId,
                ReferenceType = n.ReferenceType,
                ActionUrl = n.ActionUrl,
                Icon = n.Icon,
                Color = n.Color,
                Metadata = n.Metadata,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<NotificationResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<NotificationSummaryResponse> GetSummaryAsync(Guid userId)
    {
        var baseQuery = _context.Set<Notification>()
            .AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsDeleted);

        var totalCount = await baseQuery.CountAsync();
        var unreadCount = await baseQuery.CountAsync(n => !n.IsRead);

        var recentUnread = await baseQuery
            .Where(n => !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .Take(5)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                UserId = n.UserId,
                Title = n.Title,
                Body = n.Body,
                Type = n.Type,
                Priority = n.Priority,
                ReferenceId = n.ReferenceId,
                ReferenceType = n.ReferenceType,
                ActionUrl = n.ActionUrl,
                Icon = n.Icon,
                Color = n.Color,
                Metadata = n.Metadata,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync();

        return new NotificationSummaryResponse
        {
            TotalCount = totalCount,
            UnreadCount = unreadCount,
            RecentUnread = recentUnread
        };
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Set<Notification>()
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead && !n.IsDeleted);
    }

    public async Task<bool> MarkAsReadAsync(Guid id, Guid userId)
    {
        var notification = await _context.Set<Notification>()
            .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);

        if (notification is null)
            return false;

        if (notification.UserId != userId)
            throw new UnauthorizedAccessException("You do not own this notification.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unreadNotifications = await _context.Set<Notification>()
            .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
            .ToListAsync();

        if (!unreadNotifications.Any())
            return;

        var now = DateTime.UtcNow;
        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = now;
            notification.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var notification = await _context.Set<Notification>()
            .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);

        if (notification is null)
            return false;

        if (notification.UserId != userId)
            throw new UnauthorizedAccessException("You do not own this notification.");

        notification.IsDeleted = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }
}
