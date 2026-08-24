using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class EmailLog
{
    public Guid Id { get; set; }

    /// <summary>
    /// Optional FK to User recipient if known in the system.
    /// </summary>
    public Guid? RecipientUserId { get; set; }
    public User? RecipientUser { get; set; }

    /// <summary>
    /// Actual destination email address.
    /// </summary>
    public string Recipient { get; set; } = string.Empty;

    /// <summary>
    /// Sender address (e.g. bot@pplgcenter.web.id).
    /// </summary>
    public string Sender { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public string? ProviderResponse { get; set; }

    public EmailStatus Status { get; set; } = EmailStatus.Pending;

    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Optional FK to the User/Admin who triggered this email.
    /// </summary>
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SentAt { get; set; }
}
