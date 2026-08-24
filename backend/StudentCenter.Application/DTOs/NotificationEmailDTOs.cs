namespace StudentCenter.Application.DTOs;

public class RequestNotificationOtpRequest
{
    public string Email { get; set; } = string.Empty;
}

public class TechStackOptionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // "Frontend" | "Backend" | "DevOps" | "Database"
    public string Color { get; set; } = string.Empty;    // Hex / Tailwind accent
    public string Icon { get; set; } = string.Empty;     // Simple icon identifier
}

public class RequestNotificationOtpResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int CooldownSeconds { get; set; } = 60;
    public DateTime ExpiresAt { get; set; }
    public List<TechStackOptionDto> TechOptions { get; set; } = new();
}

public class VerifyNotificationOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public List<string> TechStack { get; set; } = new();
}

public class VerifyNotificationOtpResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? EmailNotif { get; set; }
    public int? RemainingAttempts { get; set; }
}
