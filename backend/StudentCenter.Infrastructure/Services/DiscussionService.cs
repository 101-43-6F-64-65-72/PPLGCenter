using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class DiscussionService : IDiscussionService
{
    private readonly AppDbContext _context;
    private readonly ICommunicationAuthorizationService _authService;
    private readonly INotificationService _notificationService;

    public DiscussionService(
        AppDbContext context,
        ICommunicationAuthorizationService authService,
        INotificationService notificationService)
    {
        _context = context;
        _authService = authService;
        _notificationService = notificationService;
    }

    public async Task<DiscussionThreadResponse> CreateThreadAsync(Guid userId, CreateDiscussionThreadRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ValidationException("Judul diskusi wajib diisi.");
        if (string.IsNullOrWhiteSpace(request.Body))
            throw new ValidationException("Isi diskusi wajib diisi.");

        var canPost = await _authService.CanPostDiscussionThreadAsync(userId, request.ClassSubjectId);
        if (!canPost)
            throw new ValidationException("Anda tidak berhak membuat diskusi di kelas ini.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new ValidationException("User not found.");

        var thread = new DiscussionThread
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = request.ClassSubjectId,
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            IsPinned = false,
            IsLocked = false,
            ReplyCount = 0,
            LastReplyAt = null,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.DiscussionThreads.Add(thread);
        await _context.SaveChangesAsync();

        // Notify class students & teacher
        var classSubject = await _context.ClassSubjects
            .Include(cs => cs.Class)
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Subject)
            .FirstOrDefaultAsync(cs => cs.Id == request.ClassSubjectId);

        if (classSubject != null)
        {
            var targetUsers = await _context.Users
                .Where(u => u.IsActive && u.Id != userId && (u.ClassId == classSubject.ClassId || (classSubject.TeacherSubject != null && u.Id == classSubject.TeacherSubject.TeacherId)))
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var targetId in targetUsers)
            {
                await _notificationService.NotifyUserAsync(
                    targetId,
                    $"Diskusi Baru: {thread.Title}",
                    $"{user.FullName} membuka diskusi baru di mata pelajaran {classSubject.TeacherSubject?.Subject?.Name ?? "Kelas"}.",
                    NotificationType.NewDiscussion,
                    NotificationPriority.Normal,
                    thread.Id.ToString(),
                    NotificationReferenceType.DiscussionThread
                );
            }
        }

        return await GetThreadByIdAsync(thread.Id);
    }

    public async Task<CursorPagedResult<DiscussionThreadResponse>> GetClassSubjectThreadsAsync(Guid classSubjectId, string? cursor, int limit = 15)
    {
        if (limit < 1) limit = 15;
        if (limit > 50) limit = 50;

        var query = _context.DiscussionThreads
            .AsNoTracking()
            .Include(t => t.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .Include(t => t.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject)
            .Include(t => t.CreatedByUser)
            .Where(t => t.ClassSubjectId == classSubjectId && t.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(cursor) && DateTime.TryParse(cursor, out DateTime cursorDate))
        {
            query = query.Where(t => t.CreatedAt < cursorDate);
        }

        var threads = await query
            .OrderByDescending(t => t.IsPinned)
            .ThenByDescending(t => t.CreatedAt)
            .Take(limit + 1)
            .ToListAsync();

        bool hasMore = threads.Count > limit;
        if (hasMore) threads.RemoveAt(threads.Count - 1);

        var items = threads.Select(MapThreadResponse).ToList();
        string? nextCursor = hasMore && threads.Count > 0 ? threads.Last().CreatedAt.ToString("o") : null;

        return new CursorPagedResult<DiscussionThreadResponse>
        {
            Items = items,
            NextCursor = nextCursor,
            HasMore = hasMore
        };
    }

    public async Task<DiscussionThreadResponse> GetThreadByIdAsync(Guid threadId)
    {
        var thread = await _context.DiscussionThreads
            .AsNoTracking()
            .Include(t => t.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .Include(t => t.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject)
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t => t.Id == threadId && t.DeletedAt == null);

        if (thread == null) throw new ValidationException("Diskusi tidak ditemukan.");

        return MapThreadResponse(thread);
    }

    public async Task<DiscussionThreadResponse> UpdateThreadAsync(Guid userId, Guid threadId, UpdateDiscussionThreadRequest request)
    {
        var thread = await _context.DiscussionThreads.FirstOrDefaultAsync(t => t.Id == threadId && t.DeletedAt == null);
        if (thread == null) throw new ValidationException("Diskusi tidak ditemukan.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new ValidationException("User not found.");

        if (thread.CreatedByUserId != userId && user.Role != UserRole.Admin && user.Role != UserRole.Teacher)
            throw new ValidationException("Anda tidak berhak mengubah diskusi ini.");

        if (!string.IsNullOrWhiteSpace(request.Title)) thread.Title = request.Title.Trim();
        if (!string.IsNullOrWhiteSpace(request.Body)) thread.Body = request.Body.Trim();

        if (request.IsPinned.HasValue && (user.Role == UserRole.Teacher || user.Role == UserRole.Admin))
            thread.IsPinned = request.IsPinned.Value;

        if (request.IsLocked.HasValue && (user.Role == UserRole.Teacher || user.Role == UserRole.Admin))
            thread.IsLocked = request.IsLocked.Value;

        thread.UpdatedByUserId = userId;
        thread.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetThreadByIdAsync(thread.Id);
    }

    public async Task<bool> DeleteThreadAsync(Guid userId, Guid threadId)
    {
        var thread = await _context.DiscussionThreads.FirstOrDefaultAsync(t => t.Id == threadId && t.DeletedAt == null);
        if (thread == null) return false;

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        if (thread.CreatedByUserId != userId && user.Role != UserRole.Admin && user.Role != UserRole.Teacher)
            throw new ValidationException("Anda tidak berhak menghapus diskusi ini.");

        thread.DeletedAt = DateTime.UtcNow;
        thread.DeletedByUserId = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DiscussionReplyResponse> CreateReplyAsync(Guid userId, CreateDiscussionReplyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Body))
            throw new ValidationException("Isi balasan wajib diisi.");

        var canReply = await _authService.CanReplyDiscussionThreadAsync(userId, request.ThreadId);
        if (!canReply)
            throw new ValidationException("Diskusi telah dikunci atau Anda tidak memiliki akses balasan.");

        var thread = await _context.DiscussionThreads.FirstOrDefaultAsync(t => t.Id == request.ThreadId && t.DeletedAt == null);
        if (thread == null) throw new ValidationException("Diskusi tidak ditemukan.");

        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new ValidationException("User not found.");

        if (request.ParentReplyId.HasValue)
        {
            var parent = await _context.DiscussionReplies.FirstOrDefaultAsync(r => r.Id == request.ParentReplyId.Value && r.DeletedAt == null);
            if (parent == null) throw new ValidationException("Balasan utama yang dituju telah dihapus.");
        }

        var reply = new DiscussionReply
        {
            Id = Guid.NewGuid(),
            ThreadId = request.ThreadId,
            ParentReplyId = request.ParentReplyId,
            Body = request.Body.Trim(),
            AttachmentUrl = request.AttachmentUrl,
            AttachmentFileName = request.AttachmentFileName,
            AttachmentContentType = request.AttachmentContentType,
            AttachmentFileSize = request.AttachmentFileSize,
            StorageProvider = request.StorageProvider ?? "Local",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.DiscussionReplies.Add(reply);

        // Update atomic counters on thread
        thread.ReplyCount += 1;
        thread.LastReplyAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notify thread author
        if (thread.CreatedByUserId != userId)
        {
            await _notificationService.NotifyUserAsync(
                thread.CreatedByUserId,
                $"Balasan Baru di: {thread.Title}",
                $"{user.FullName} membalas diskusi Anda.",
                NotificationType.DiscussionReply,
                NotificationPriority.Normal,
                reply.Id.ToString(),
                NotificationReferenceType.DiscussionReply
            );
        }

        // Process @username mentions
        var mentions = Regex.Matches(request.Body, @"@(\w+)")
            .Select(m => m.Groups[1].Value)
            .Distinct();

        foreach (var username in mentions)
        {
            var mentionedUser = await _context.Users.FirstOrDefaultAsync(u => u.Username != null && u.Username.ToLower() == username.ToLower());
            if (mentionedUser != null && mentionedUser.Id != userId)
            {
                await _notificationService.NotifyUserAsync(
                    mentionedUser.Id,
                    "Anda Dimention!",
                    $"{user.FullName} menyebut Anda dalam diskusi '{thread.Title}'.",
                    NotificationType.Mention,
                    NotificationPriority.High,
                    reply.Id.ToString(),
                    NotificationReferenceType.DiscussionReply
                );
            }
        }

        return MapReplyResponse(reply, user);
    }

    public async Task<List<DiscussionReplyResponse>> GetThreadRepliesAsync(Guid threadId)
    {
        var replies = await _context.DiscussionReplies
            .AsNoTracking()
            .Include(r => r.CreatedByUser)
            .Where(r => r.ThreadId == threadId && r.DeletedAt == null)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        var replyDict = replies.ToDictionary(r => r.Id, r => MapReplyResponse(r, r.CreatedByUser));
        var rootReplies = new List<DiscussionReplyResponse>();

        foreach (var reply in replies)
        {
            var dto = replyDict[reply.Id];
            if (reply.ParentReplyId.HasValue && replyDict.TryGetValue(reply.ParentReplyId.Value, out var parentDto))
            {
                parentDto.ChildReplies.Add(dto);
            }
            else
            {
                rootReplies.Add(dto);
            }
        }

        return rootReplies;
    }

    public async Task<bool> DeleteReplyAsync(Guid userId, Guid replyId)
    {
        var reply = await _context.DiscussionReplies
            .Include(r => r.Thread)
            .FirstOrDefaultAsync(r => r.Id == replyId && r.DeletedAt == null);
        if (reply == null) return false;

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        if (reply.CreatedByUserId != userId && user.Role != UserRole.Admin && user.Role != UserRole.Teacher)
            throw new ValidationException("Anda tidak berhak menghapus balasan ini.");

        reply.DeletedAt = DateTime.UtcNow;
        reply.DeletedByUserId = userId;

        if (reply.Thread != null)
        {
            reply.Thread.ReplyCount = Math.Max(0, reply.Thread.ReplyCount - 1);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DiscussionThreadResponse> TogglePinThreadAsync(Guid userId, Guid threadId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || (user.Role != UserRole.Teacher && user.Role != UserRole.Admin))
            throw new ValidationException("Hanya guru atau admin yang dapat menyematkan (pin) diskusi.");

        var thread = await _context.DiscussionThreads.FirstOrDefaultAsync(t => t.Id == threadId && t.DeletedAt == null);
        if (thread == null) throw new ValidationException("Diskusi tidak ditemukan.");

        thread.IsPinned = !thread.IsPinned;
        thread.UpdatedByUserId = userId;
        thread.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetThreadByIdAsync(thread.Id);
    }

    public async Task<DiscussionThreadResponse> ToggleLockThreadAsync(Guid userId, Guid threadId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || (user.Role != UserRole.Teacher && user.Role != UserRole.Admin))
            throw new ValidationException("Hanya guru atau admin yang dapat mengunci diskusi.");

        var thread = await _context.DiscussionThreads.FirstOrDefaultAsync(t => t.Id == threadId && t.DeletedAt == null);
        if (thread == null) throw new ValidationException("Diskusi tidak ditemukan.");

        thread.IsLocked = !thread.IsLocked;
        thread.UpdatedByUserId = userId;
        thread.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetThreadByIdAsync(thread.Id);
    }

    private static DiscussionThreadResponse MapThreadResponse(DiscussionThread t)
    {
        return new DiscussionThreadResponse
        {
            Id = t.Id,
            ClassSubjectId = t.ClassSubjectId,
            ClassName = t.ClassSubject?.Class?.Name ?? "Kelas",
            SubjectName = t.ClassSubject?.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran",
            CreatedByUserId = t.CreatedByUserId,
            AuthorName = t.CreatedByUser?.FullName ?? "Unknown",
            AuthorPhotoUrl = t.CreatedByUser?.PhotoUrl,
            AuthorRole = t.CreatedByUser?.Role.ToString() ?? "User",
            Title = t.Title,
            Body = t.Body,
            IsPinned = t.IsPinned,
            IsLocked = t.IsLocked,
            ReplyCount = t.ReplyCount,
            LastReplyAt = t.LastReplyAt,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt
        };
    }

    private static DiscussionReplyResponse MapReplyResponse(DiscussionReply r, User author)
    {
        return new DiscussionReplyResponse
        {
            Id = r.Id,
            ThreadId = r.ThreadId,
            ParentReplyId = r.ParentReplyId,
            CreatedByUserId = r.CreatedByUserId,
            AuthorName = author?.FullName ?? "Unknown",
            AuthorPhotoUrl = author?.PhotoUrl,
            AuthorRole = author?.Role.ToString() ?? "User",
            Body = r.Body,
            AttachmentUrl = r.AttachmentUrl,
            AttachmentFileName = r.AttachmentFileName,
            AttachmentContentType = r.AttachmentContentType,
            AttachmentFileSize = r.AttachmentFileSize,
            StorageProvider = r.StorageProvider,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
            ChildReplies = new List<DiscussionReplyResponse>()
        };
    }
}
