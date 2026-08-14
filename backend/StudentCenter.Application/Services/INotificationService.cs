using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.Services;

public interface INotificationService
{
    Task CreateAsync(CreateNotificationRequest request);
    
    Task NotifyUserAsync(
        Guid userId, 
        string title, 
        string message, 
        NotificationType type, 
        string? referenceId = null, 
        string? referenceType = null);

    Task NotifyUserAsync(
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
        string? metadata = null);

    Task NotifyUsersAsync(
        IEnumerable<Guid> userIds, 
        string title, 
        string message, 
        NotificationType type, 
        string? referenceId = null, 
        string? referenceType = null);

    Task NotifyUsersAsync(
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
        string? metadata = null);

    Task BroadcastAsync(
        string title, 
        string body, 
        NotificationType type, 
        string? targetRole = null, 
        NotificationPriority priority = NotificationPriority.Normal, 
        string? actionUrl = null, 
        string? icon = null, 
        string? color = null, 
        string? metadata = null);

    Task BroadcastWithSenderAsync(
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
        string? metadata = null);

    Task<List<BroadcastItemResponse>> GetBroadcastListAsync();
    Task<bool> UpdateBroadcastAsync(string broadcastId, Guid requestingUserId, UpdateBroadcastRequest request);
    Task<bool> DeleteBroadcastAsync(string broadcastId, Guid requestingUserId, bool isAdmin);

    Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(Guid userId, int page, int pageSize);
    Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(Guid userId, NotificationFilterRequest filter);
    Task<NotificationSummaryResponse> GetSummaryAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<bool> MarkAsReadAsync(Guid id, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
