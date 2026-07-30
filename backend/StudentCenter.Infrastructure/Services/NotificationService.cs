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

    public async Task CreateAsync(CreateNotificationRequest request)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            ReferenceId = request.ReferenceId,
            ReferenceType = request.ReferenceType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<Notification>().Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task NotifyUserAsync(Guid userId, string title, string message, NotificationType type, string? referenceId = null, string? referenceType = null)
    {
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<Notification>().Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task NotifyUsersAsync(IEnumerable<Guid> userIds, string title, string message, NotificationType type, string? referenceId = null, string? referenceType = null)
    {
        var notifications = userIds.Select(userId => new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        if (notifications.Any())
        {
            _context.Set<Notification>().AddRange(notifications);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<PagedResult<NotificationResponse>> GetMyNotificationsAsync(Guid userId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Notification>()
            .AsNoTracking()
            .Where(n => n.UserId == userId);

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
                Message = n.Message,
                Type = n.Type,
                ReferenceId = n.ReferenceId,
                ReferenceType = n.ReferenceType,
                IsRead = n.IsRead,
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

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Set<Notification>()
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(Guid id, Guid userId)
    {
        var notification = await _context.Set<Notification>()
            .FirstOrDefaultAsync(n => n.Id == id);

        if (notification is null)
            return false;

        if (notification.UserId != userId)
            throw new UnauthorizedAccessException("You do not own this notification.");

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unreadNotifications = await _context.Set<Notification>()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        if (unreadNotifications.Any())
        {
            await _context.SaveChangesAsync();
        }
    }
}
