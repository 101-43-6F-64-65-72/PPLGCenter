using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Message => Body;
    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; }
    public string? ReferenceId { get; set; }
    public NotificationReferenceType ReferenceType { get; set; }
    public string? ActionUrl { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public string? Metadata { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
