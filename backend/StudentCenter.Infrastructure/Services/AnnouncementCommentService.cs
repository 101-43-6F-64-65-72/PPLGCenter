using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AnnouncementCommentService : IAnnouncementCommentService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AnnouncementCommentService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<CommentResponse> AddCommentAsync(Guid announcementId, CommentRequest request, Guid userId, Guid? parentCommentId = null)
    {
        var announcement = await _context.Announcements
            .FirstOrDefaultAsync(a => a.Id == announcementId);

        if (announcement == null)
            throw new KeyNotFoundException("Pengumuman tidak ditemukan.");

        if (announcement.IsCommentsLocked)
            throw new ValidationException("Komentar pada pengumuman ini telah dikunci.");

        if (parentCommentId.HasValue)
        {
            var parentExists = await _context.AnnouncementComments.AnyAsync(c => c.Id == parentCommentId.Value && c.DeletedAt == null);
            if (!parentExists)
                throw new ValidationException("Komentar utama yang dituju telah dihapus.");
        }

        var user = await _context.Users.FindAsync(userId);

        var comment = new AnnouncementComment
        {
            Id = Guid.NewGuid(),
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
            AnnouncementId = announcementId,
            UserId = userId,
            ParentCommentId = parentCommentId
        };

        _context.AnnouncementComments.Add(comment);
        await _context.SaveChangesAsync();

        if (announcement.CreatedByUserId != userId)
        {
            await _notificationService.NotifyUserAsync(
                announcement.CreatedByUserId,
                "Komentar Pengumuman Baru",
                $"{user?.FullName ?? "Seseorang"} mengomentari pengumuman Anda '{announcement.Title}'.",
                NotificationType.AnnouncementComment,
                NotificationPriority.Normal,
                announcement.Id.ToString(),
                NotificationReferenceType.Announcement
            );
        }

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

        var query = _context.AnnouncementComments
            .AsNoTracking()
            .Where(c => c.AnnouncementId == announcementId && c.DeletedAt == null);

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
        var comment = await _context.AnnouncementComments.FirstOrDefaultAsync(c => c.Id == commentId && c.DeletedAt == null);
        if (comment == null) return false;

        if (userRole != "Admin" && comment.UserId != userId)
            throw new UnauthorizedAccessException("Anda hanya dapat menghapus komentar milik sendiri.");

        comment.DeletedAt = DateTime.UtcNow;
        comment.DeletedByUserId = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleCommentsLockAsync(Guid announcementId, Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || (user.Role != UserRole.Teacher && user.Role != UserRole.Admin))
            throw new UnauthorizedAccessException("Hanya guru atau admin yang dapat mengunci komentar pengumuman.");

        var announcement = await _context.Announcements.FirstOrDefaultAsync(a => a.Id == announcementId);
        if (announcement == null) return false;

        announcement.IsCommentsLocked = !announcement.IsCommentsLocked;
        announcement.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return announcement.IsCommentsLocked;
    }
}
