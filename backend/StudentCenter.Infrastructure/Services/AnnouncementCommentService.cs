using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AnnouncementCommentService : IAnnouncementCommentService
{
    private readonly AppDbContext _context;

    public AnnouncementCommentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CommentResponse> AddCommentAsync(Guid announcementId, CommentRequest request, Guid userId)
    {
        var exists = await _context.Set<Announcement>()
            .AsNoTracking()
            .AnyAsync(a => a.Id == announcementId);

        if (!exists)
            throw new KeyNotFoundException("Announcement not found.");

        var comment = new AnnouncementComment
        {
            Id = Guid.NewGuid(),
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            AnnouncementId = announcementId,
            UserId = userId
        };

        _context.Set<AnnouncementComment>().Add(comment);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        return new CommentResponse
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            AnnouncementId = comment.AnnouncementId,
            UserId = comment.UserId,
            UserName = user?.FullName ?? string.Empty
        };
    }

    public async Task<PagedResult<CommentResponse>> GetCommentsAsync(Guid announcementId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<AnnouncementComment>()
            .AsNoTracking()
            .Where(c => c.AnnouncementId == announcementId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CommentResponse
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                AnnouncementId = c.AnnouncementId,
                UserId = c.UserId,
                UserName = c.User.FullName
            })
            .ToListAsync();

        return new PagedResult<CommentResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId, string userRole)
    {
        var comment = await _context.Set<AnnouncementComment>()
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment is null)
            return false;

        if (userRole != "Admin" && comment.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own comments.");

        _context.Set<AnnouncementComment>().Remove(comment);
        await _context.SaveChangesAsync();

        return true;
    }
}
