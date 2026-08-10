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
        await BroadcastWithSenderAsync(Guid.Empty, "Pengelola Sekolah", title, body, type, targetRole, priority, actionUrl, icon, color, metadata);
    }

    public async Task BroadcastWithSenderAsync(
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
        string? metadata = null)
    {
        var query = _context.Users.AsNoTracking().Where(u => u.IsActive);

        if (!string.IsNullOrWhiteSpace(targetRole))
        {
            if (Enum.TryParse<UserRole>(targetRole.Trim(), true, out var parsedRole))
            {
                query = query.Where(u => u.Role == parsedRole);
            }
            else
            {
                var roleNameUpper = targetRole.Trim().ToUpper();
                if (roleNameUpper == "SISWA" || roleNameUpper == "STUDENT")
                    query = query.Where(u => u.Role == UserRole.Student);
                else if (roleNameUpper == "GURU" || roleNameUpper == "TEACHER")
                    query = query.Where(u => u.Role == UserRole.Teacher);
                else if (roleNameUpper == "ADMIN")
                    query = query.Where(u => u.Role == UserRole.Admin);
            }
        }

        var targetUserIds = await query.Select(u => u.Id).ToListAsync();
        if (!targetUserIds.Any())
            return;

        var broadcastId = Guid.NewGuid().ToString();
        var metadataObj = new
        {
            broadcastId = broadcastId,
            createdByUserId = senderUserId.ToString(),
            createdByName = senderName,
            targetRole = targetRole ?? ""
        };

        var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadataObj);
        await NotifyUsersAsync(targetUserIds, title, body, type, priority, null, NotificationReferenceType.None, actionUrl, icon, color, metadataJson);
    }

    public async Task<List<BroadcastItemResponse>> GetBroadcastListAsync()
    {
        var notifications = await _context.Set<Notification>()
            .AsNoTracking()
            .Where(n => !n.IsDeleted && n.Metadata != null && n.Metadata.Contains("broadcastId"))
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        var broadcastGroups = new Dictionary<string, List<Notification>>();

        foreach (var notif in notifications)
        {
            if (string.IsNullOrWhiteSpace(notif.Metadata)) continue;
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(notif.Metadata);
                if (doc.RootElement.TryGetProperty("broadcastId", out var bIdElement))
                {
                    var bId = bIdElement.GetString();
                    if (!string.IsNullOrEmpty(bId))
                    {
                        if (!broadcastGroups.ContainsKey(bId))
                        {
                            broadcastGroups[bId] = new List<Notification>();
                        }
                        broadcastGroups[bId].Add(notif);
                    }
                }
            }
            catch {}
        }

        var result = new List<BroadcastItemResponse>();

        foreach (var kvp in broadcastGroups)
        {
            var bId = kvp.Key;
            var group = kvp.Value;
            var first = group.First();

            Guid createdByUserId = Guid.Empty;
            string createdByName = "Pengelola Sekolah";
            string targetRole = "";

            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(first.Metadata!);
                if (doc.RootElement.TryGetProperty("createdByUserId", out var uidElem) && Guid.TryParse(uidElem.GetString(), out var uid))
                {
                    createdByUserId = uid;
                }
                if (doc.RootElement.TryGetProperty("createdByName", out var nameElem))
                {
                    createdByName = nameElem.GetString() ?? "Pengelola Sekolah";
                }
                if (doc.RootElement.TryGetProperty("targetRole", out var roleElem))
                {
                    targetRole = roleElem.GetString() ?? "";
                }
            }
            catch {}

            result.Add(new BroadcastItemResponse
            {
                BroadcastId = bId,
                Title = first.Title,
                Body = first.Body,
                Type = first.Type,
                Priority = first.Priority,
                TargetRole = targetRole,
                ActionUrl = first.ActionUrl,
                CreatedByUserId = createdByUserId,
                CreatedByName = createdByName,
                CreatedAt = first.CreatedAt,
                RecipientCount = group.Count
            });
        }

        return result.OrderByDescending(b => b.CreatedAt).ToList();
    }

    public async Task<bool> UpdateBroadcastAsync(string broadcastId, Guid requestingUserId, UpdateBroadcastRequest request)
    {
        var notifications = await _context.Set<Notification>()
            .Where(n => !n.IsDeleted && n.Metadata != null && n.Metadata.Contains(broadcastId))
            .ToListAsync();

        if (!notifications.Any())
            return false;

        var first = notifications.First();
        Guid createdByUserId = Guid.Empty;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(first.Metadata!);
            if (doc.RootElement.TryGetProperty("createdByUserId", out var uidElem) && Guid.TryParse(uidElem.GetString(), out var uid))
            {
                createdByUserId = uid;
            }
        }
        catch {}

        if (createdByUserId != Guid.Empty && createdByUserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("Hanya pembuat broadcast yang dapat mengedit broadcast ini.");
        }

        var now = DateTime.UtcNow;
        foreach (var notif in notifications)
        {
            notif.Title = request.Title;
            notif.Body = request.Body;
            notif.Type = request.Type;
            notif.Priority = request.Priority;
            notif.ActionUrl = request.ActionUrl;
            notif.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteBroadcastAsync(string broadcastId, Guid requestingUserId, bool isAdmin)
    {
        var notifications = await _context.Set<Notification>()
            .Where(n => !n.IsDeleted && n.Metadata != null && n.Metadata.Contains(broadcastId))
            .ToListAsync();

        if (!notifications.Any())
            return false;

        var first = notifications.First();
        Guid createdByUserId = Guid.Empty;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(first.Metadata!);
            if (doc.RootElement.TryGetProperty("createdByUserId", out var uidElem) && Guid.TryParse(uidElem.GetString(), out var uid))
            {
                createdByUserId = uid;
            }
        }
        catch {}

        if (!isAdmin && createdByUserId != Guid.Empty && createdByUserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("Anda tidak memiliki izin untuk menghapus broadcast ini.");
        }

        var now = DateTime.UtcNow;
        foreach (var notif in notifications)
        {
            notif.IsDeleted = true;
            notif.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();
        return true;
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
