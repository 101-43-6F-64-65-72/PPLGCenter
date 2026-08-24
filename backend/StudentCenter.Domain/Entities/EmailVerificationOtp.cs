namespace StudentCenter.Domain.Entities;

public class EmailVerificationOtp
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string OtpHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int AttemptCount { get; set; } = 0;
    public bool IsUsed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
}
