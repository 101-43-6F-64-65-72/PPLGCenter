using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class PasswordResetRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string ResetTokenHash { get; set; } = string.Empty;
    public PasswordResetStatus Status { get; set; } = PasswordResetStatus.Pending;
    public string? Reason { get; set; }
    public string? AdminNotes { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
