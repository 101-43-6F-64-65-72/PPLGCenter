using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface INotificationService
{
    Task CreateAsync(CreateNotificationRequest request);
    Task NotifyUserAsync(Guid userId, string title, string message, Domain.Enums.NotificationType type, string? referenceId = null, string? referenceType = null);
    Task NotifyUsersAsync(IEnumerable<Guid> userIds, string title, string message, Domain.Enums.NotificationType type, string? referenceId = null, string? referenceType = null);
    Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(Guid userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<bool> MarkAsReadAsync(Guid id, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
}
