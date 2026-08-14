using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class CommunicationAuthorizationService : ICommunicationAuthorizationService
{
    private readonly AppDbContext _context;

    public CommunicationAuthorizationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CanAccessConversationAsync(Guid userId, Guid conversationId)
    {
        return await _context.ConversationMembers
            .AsNoTracking()
            .AnyAsync(cm => cm.ConversationId == conversationId && cm.UserId == userId);
    }

    public async Task<bool> CanCreateDirectConversationAsync(Guid senderId, Guid recipientId)
    {
        if (senderId == recipientId) return false;

        var sender = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == senderId);
        var recipient = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == recipientId);

        if (sender == null || recipient == null || !sender.IsActive || !recipient.IsActive) return false;

        // Admin can chat with everyone
        if (sender.Role == UserRole.Admin || recipient.Role == UserRole.Admin) return true;

        // Teacher <-> Student allowed
        if ((sender.Role == UserRole.Teacher && recipient.Role == UserRole.Student) ||
            (sender.Role == UserRole.Student && recipient.Role == UserRole.Teacher))
        {
            return true;
        }

        // Teacher <-> Teacher allowed
        if (sender.Role == UserRole.Teacher && recipient.Role == UserRole.Teacher)
        {
            return true;
        }

        // Student <-> Student restricted by default
        return false;
    }

    public async Task<bool> CanPostDiscussionThreadAsync(Guid userId, Guid classSubjectId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || !user.IsActive) return false;

        if (user.Role == UserRole.Admin) return true;

        var cs = await _context.ClassSubjects
            .AsNoTracking()
            .Include(c => c.TeacherSubject)
            .FirstOrDefaultAsync(c => c.Id == classSubjectId);

        if (cs == null) return false;

        if (user.Role == UserRole.Teacher)
        {
            return cs.TeacherSubject?.TeacherId == userId;
        }

        if (user.Role == UserRole.Student)
        {
            return user.ClassId.HasValue && user.ClassId == cs.ClassId;
        }

        return false;
    }

    public async Task<bool> CanReplyDiscussionThreadAsync(Guid userId, Guid threadId)
    {
        var thread = await _context.DiscussionThreads
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == threadId && t.DeletedAt == null);

        if (thread == null || thread.IsLocked) return false;

        return await CanPostDiscussionThreadAsync(userId, thread.ClassSubjectId);
    }
}
