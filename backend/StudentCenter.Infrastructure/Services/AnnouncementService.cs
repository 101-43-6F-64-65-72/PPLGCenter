using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AnnouncementService> _logger;

    public AnnouncementService(AppDbContext context, INotificationService notificationService, ILogger<AnnouncementService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<PagedResult<AnnouncementResponse>> GetAnnouncementsAsync(int page, int pageSize, string? category)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Announcement>()
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Category == category);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AnnouncementResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Category = a.Category,
                CoverImageUrl = a.CoverImageUrl,
                IsPinned = a.IsPinned,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser.FullName,
                ReactionCount = a.Reactions.Count,
                CommentCount = a.Comments.Count
            })
            .ToListAsync();

        return new PagedResult<AnnouncementResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResult<AnnouncementFeedResponse>> GetFeedAsync(int page, int pageSize, string? category)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Announcement>()
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(a => a.Category == category);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AnnouncementFeedResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Category = a.Category,
                CoverImageUrl = a.CoverImageUrl,
                IsPinned = a.IsPinned,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser.FullName,
                ReactionCount = a.Reactions.Count,
                CommentCount = a.Comments.Count,
                LatestComments = a.Comments
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(3)
                    .Select(c => new CommentResponse
                    {
                        Id = c.Id,
                        Content = c.Content,
                        CreatedAt = c.CreatedAt,
                        AnnouncementId = c.AnnouncementId,
                        UserId = c.UserId,
                        UserName = c.User.FullName
                    })
                    .ToList()
            })
            .ToListAsync();

        return new PagedResult<AnnouncementFeedResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AnnouncementResponse?> GetAnnouncementByIdAsync(Guid id)
    {
        var announcement = await _context.Set<Announcement>()
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null)
            return null;

        return new AnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Content = announcement.Content,
            Category = announcement.Category,
            CoverImageUrl = announcement.CoverImageUrl,
            IsPinned = announcement.IsPinned,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByUserName = announcement.CreatedByUser.FullName,
            ReactionCount = await _context.Set<AnnouncementReaction>().CountAsync(r => r.AnnouncementId == announcement.Id),
            CommentCount = await _context.Set<AnnouncementComment>().CountAsync(c => c.AnnouncementId == announcement.Id)
        };
    }

    public async Task<AnnouncementResponse> CreateAnnouncementAsync(CreateAnnouncementRequest request, Guid userId)
    {
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Content = request.Content,
            Category = request.Category,
            CoverImageUrl = request.CoverImageUrl,
            IsPinned = request.IsPinned,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.Set<Announcement>().Add(announcement);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        var allUserIds = await _context.Set<User>()
            .AsNoTracking()
            .Select(u => u.Id)
            .ToListAsync();

        if (allUserIds.Count > 0)
        {
            await _notificationService.NotifyUsersAsync(
                allUserIds,
                $"Pengumuman: {announcement.Title}",
                announcement.Content.Length > 200 ? announcement.Content.Substring(0, 197) + "..." : announcement.Content,
                NotificationType.Announcement,
                NotificationPriority.Normal,
                announcement.Id.ToString(),
                NotificationReferenceType.Announcement,
                $"/announcements/{announcement.Id}",
                "bullhorn",
                "#3b82f6"
            );
        }

        return new AnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Content = announcement.Content,
            Category = announcement.Category,
            CoverImageUrl = announcement.CoverImageUrl,
            IsPinned = announcement.IsPinned,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? string.Empty
        };
    }

    public async Task<AnnouncementResponse?> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementRequest request)
    {
        var announcement = await _context.Set<Announcement>()
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null)
            return null;

        announcement.Title = request.Title;
        announcement.Content = request.Content;
        announcement.Category = request.Category;
        announcement.CoverImageUrl = request.CoverImageUrl;
        announcement.IsPinned = request.IsPinned;
        announcement.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Content = announcement.Content,
            Category = announcement.Category,
            CoverImageUrl = announcement.CoverImageUrl,
            IsPinned = announcement.IsPinned,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByUserName = announcement.CreatedByUser.FullName
        };
    }

    public async Task<bool> DeleteAnnouncementAsync(Guid id)
    {
        var announcement = await _context.Set<Announcement>()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null)
            return false;

        _context.Set<Announcement>().Remove(announcement);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PagedResult<AnnouncementResponse>> SearchAsync(int page, int pageSize, string? keyword = null, bool? isPinned = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Announcement>()
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var searchTerm = keyword.ToLower();
            query = query.Where(a => a.Title.ToLower().Contains(searchTerm) || a.Content.ToLower().Contains(searchTerm));
        }

        if (isPinned.HasValue)
        {
            query = query.Where(a => a.IsPinned == isPinned.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AnnouncementResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Category = a.Category,
                CoverImageUrl = a.CoverImageUrl,
                IsPinned = a.IsPinned,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser.FullName
            })
            .ToListAsync();

        return new PagedResult<AnnouncementResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
