using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class NotificationFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public NotificationType? Type { get; set; }
    public NotificationPriority? Priority { get; set; }
    public bool? IsRead { get; set; }
    public NotificationReferenceType? ReferenceType { get; set; }
}

public class NotificationSummaryResponse
{
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
    public List<NotificationResponse> RecentUnread { get; set; } = new();
}

public class BroadcastNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.General;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public string? TargetRole { get; set; }
    public string? ActionUrl { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public string? Metadata { get; set; }
}
