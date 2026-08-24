using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class SendTestEmailRequest
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? RecipientUserId { get; set; }
}

public class SendEmailResult
{
    public bool Success { get; set; }
    public Guid? EmailLogId { get; set; }
    public string? MessageId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public string? ProviderResponse { get; set; }
}

public class EmailLogResponse
{
    public Guid Id { get; set; }
    public Guid? RecipientUserId { get; set; }
    public string? RecipientUserFullName { get; set; }
    public string Recipient { get; set; } = string.Empty;
    public string Sender { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string? ProviderResponse { get; set; }
    public EmailStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string? CreatedByUserFullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
}

public class EmailConfigStatusResponse
{
    public string Sender { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string ConfiguredProvider { get; set; } = string.Empty;
    public bool IsResendAvailable { get; set; }
    public bool IsSmtpAvailable { get; set; }
    public string Environment { get; set; } = string.Empty;
}
