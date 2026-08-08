using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
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

        foreach (var userId in activeUserIds)
        {
            if (await IsDuplicateWithinCooldownAsync(userId, type, referenceType, referenceId, body))
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
        }
    }

    public async Task BroadcastAsync(
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
            var roleNameUpper = targetRole.Trim().ToUpper();
            query = query.Where(u => u.Role.ToString().ToUpper() == roleNameUpper);
        }

        var targetUserIds = await query.Select(u => u.Id).ToListAsync();
        await NotifyUsersAsync(targetUserIds, title, body, type, priority, null, NotificationReferenceType.None, actionUrl, icon, color, metadata);
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
