using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly AppDbContext _context;

    public AnnouncementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AnnouncementResponse>> GetAnnouncementsAsync(int page, int pageSize, string? category)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Announcement>()
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

    public async Task<AnnouncementResponse?> GetAnnouncementByIdAsync(Guid id)
    {
        var announcement = await _context.Set<Announcement>()
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
            CreatedByUserName = announcement.CreatedByUser.FullName
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
}
