using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class MessageService : IMessageService
{
    private readonly AppDbContext _context;
    private readonly ICommunicationAuthorizationService _authService;
    private readonly INotificationService _notificationService;

    public MessageService(
        AppDbContext context,
        ICommunicationAuthorizationService authService,
        INotificationService notificationService)
    {
        _context = context;
        _authService = authService;
        _notificationService = notificationService;
    }

    public async Task<ConversationResponse> GetOrCreateDirectConversationAsync(Guid senderId, Guid recipientId, string? initialMessage = null)
    {
        var canCreate = await _authService.CanCreateDirectConversationAsync(senderId, recipientId);
        if (!canCreate)
            throw new ValidationException("Kebijakan sistem melarang percakapan langsung antar pengguna ini.");

        // Check existing direct conversation between sender and recipient
        var existingConvId = await _context.ConversationMembers
            .Where(cm => cm.UserId == senderId)
            .Select(cm => cm.ConversationId)
            .Intersect(
                _context.ConversationMembers
                    .Where(cm => cm.UserId == recipientId)
                    .Select(cm => cm.ConversationId)
            )
            .FirstOrDefaultAsync();

        if (existingConvId != Guid.Empty)
        {
            var existingConv = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == existingConvId && c.Type == ConversationType.Direct && c.DeletedAt == null);
            if (existingConv != null)
            {
                if (!string.IsNullOrWhiteSpace(initialMessage))
                {
                    await SendMessageAsync(senderId, new SendMessageRequest
                    {
                        ConversationId = existingConv.Id,
                        Text = initialMessage,
                        MessageType = MessageType.Text
                    });
                }
                return await GetConversationByIdAsync(senderId, existingConv.Id);
            }
        }

        // Create new direct conversation
        var conv = new Conversation
        {
            Id = Guid.NewGuid(),
            Type = ConversationType.Direct,
            LastActivityAt = DateTime.UtcNow,
            CreatedByUserId = senderId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var member1 = new ConversationMember
        {
            Id = Guid.NewGuid(),
            ConversationId = conv.Id,
            UserId = senderId,
            JoinedAt = DateTime.UtcNow,
            CreatedByUserId = senderId
        };

        var member2 = new ConversationMember
        {
            Id = Guid.NewGuid(),
            ConversationId = conv.Id,
            UserId = recipientId,
            JoinedAt = DateTime.UtcNow,
            CreatedByUserId = senderId
        };

        _context.Conversations.Add(conv);
        _context.ConversationMembers.AddRange(member1, member2);
        await _context.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(initialMessage))
        {
            await SendMessageAsync(senderId, new SendMessageRequest
            {
                ConversationId = conv.Id,
                Text = initialMessage,
                MessageType = MessageType.Text
            });
        }

        return await GetConversationByIdAsync(senderId, conv.Id);
    }

    public async Task<CursorPagedResult<ConversationResponse>> GetUserConversationsAsync(Guid userId, string? cursor, int limit = 20)
    {
        if (limit < 1) limit = 20;
        if (limit > 50) limit = 50;

        var query = _context.ConversationMembers
            .AsNoTracking()
            .Where(cm => cm.UserId == userId && cm.Conversation.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(cursor) && DateTime.TryParse(cursor, out DateTime cursorDate))
        {
            query = query.Where(cm => cm.Conversation.LastActivityAt < cursorDate);
        }

        var memberConvs = await query
            .Include(cm => cm.Conversation)
                .ThenInclude(c => c.Members)
                    .ThenInclude(m => m.User)
            .Include(cm => cm.Conversation)
                .ThenInclude(c => c.LastMessage)
                    .ThenInclude(m => m!.Sender)
            .OrderByDescending(cm => cm.Conversation.LastActivityAt)
            .Take(limit + 1)
            .ToListAsync();

        bool hasMore = memberConvs.Count > limit;
        if (hasMore) memberConvs.RemoveAt(memberConvs.Count - 1);

        var items = new List<ConversationResponse>();
        foreach (var mc in memberConvs)
        {
            items.Add(await MapConversationResponseAsync(mc.Conversation, userId));
        }

        string? nextCursor = hasMore && memberConvs.Count > 0 ? memberConvs.Last().Conversation.LastActivityAt.ToString("o") : null;

        return new CursorPagedResult<ConversationResponse>
        {
            Items = items,
            NextCursor = nextCursor,
            HasMore = hasMore
        };
    }

    public async Task<ConversationResponse> GetConversationByIdAsync(Guid userId, Guid conversationId)
    {
        var hasAccess = await _authService.CanAccessConversationAsync(userId, conversationId);
        if (!hasAccess) throw new ValidationException("Anda tidak memiliki akses ke percakapan ini.");

        var conv = await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Members)
                .ThenInclude(m => m.User)
            .Include(c => c.LastMessage)
                .ThenInclude(m => m!.Sender)
            .FirstOrDefaultAsync(c => c.Id == conversationId && c.DeletedAt == null);

        if (conv == null) throw new ValidationException("Percakapan tidak ditemukan.");

        return await MapConversationResponseAsync(conv, userId);
    }

    public async Task<MessageResponse> SendMessageAsync(Guid senderId, SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text) && (request.Attachments == null || request.Attachments.Count == 0))
        {
            throw new ValidationException("Pesan tidak boleh kosong.");
        }

        var hasAccess = await _authService.CanAccessConversationAsync(senderId, request.ConversationId);
        if (!hasAccess) throw new ValidationException("Anda tidak memiliki akses ke percakapan ini.");

        var sender = await _context.Users.FindAsync(senderId);
        if (sender == null) throw new ValidationException("User not found.");

        var conv = await _context.Conversations.FirstOrDefaultAsync(c => c.Id == request.ConversationId && c.DeletedAt == null);
        if (conv == null) throw new ValidationException("Percakapan tidak ditemukan.");

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = request.ConversationId,
            SenderId = senderId,
            MessageType = request.MessageType,
            Text = request.Text?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = senderId
        };

        if (request.Attachments != null && request.Attachments.Count > 0)
        {
            foreach (var att in request.Attachments)
            {
                if (att.FileSize > 10 * 1024 * 1024)
                    throw new ValidationException($"Ukuran lampiran '{att.FileName}' melebihi batas 10MB.");

                message.Attachments.Add(new MessageAttachment
                {
                    Id = Guid.NewGuid(),
                    MessageId = message.Id,
                    FileName = att.FileName,
                    ContentType = att.ContentType,
                    FileSize = att.FileSize,
                    StorageProvider = att.StorageProvider ?? "Local",
                    Url = att.Url,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        _context.Messages.Add(message);

        // Update conversation last activity & message reference
        conv.LastMessageId = message.Id;
        conv.LastActivityAt = DateTime.UtcNow;
        conv.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notify recipient members
        var recipients = await _context.ConversationMembers
            .Where(cm => cm.ConversationId == request.ConversationId && cm.UserId != senderId)
            .Select(cm => cm.UserId)
            .ToListAsync();

        foreach (var recipientId in recipients)
        {
            await _notificationService.NotifyUserAsync(
                recipientId,
                $"Pesan Baru dari {sender.FullName}",
                message.Text?.Length > 80 ? message.Text.Substring(0, 80) + "..." : (message.Text ?? "[Lampiran]"),
                NotificationType.PrivateMessage,
                NotificationPriority.Normal,
                message.Id.ToString(),
                NotificationReferenceType.Message
            );
        }

        return MapMessageResponse(message, sender);
    }

    public async Task<CursorPagedResult<MessageResponse>> GetConversationMessagesAsync(Guid userId, Guid conversationId, string? cursor, int limit = 30)
    {
        var hasAccess = await _authService.CanAccessConversationAsync(userId, conversationId);
        if (!hasAccess) throw new ValidationException("Anda tidak memiliki akses ke pesan ini.");

        if (limit < 1) limit = 30;
        if (limit > 100) limit = 100;

        var query = _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Include(m => m.Attachments)
            .Where(m => m.ConversationId == conversationId && m.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(cursor) && DateTime.TryParse(cursor, out DateTime cursorDate))
        {
            query = query.Where(m => m.CreatedAt < cursorDate);
        }

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit + 1)
            .ToListAsync();

        bool hasMore = messages.Count > limit;
        if (hasMore) messages.RemoveAt(messages.Count - 1);

        // Return chronological order for UI display
        messages.Reverse();

        var items = messages.Select(m => MapMessageResponse(m, m.Sender)).ToList();
        string? nextCursor = hasMore && messages.Count > 0 ? messages.First().CreatedAt.ToString("o") : null;

        return new CursorPagedResult<MessageResponse>
        {
            Items = items,
            NextCursor = nextCursor,
            HasMore = hasMore
        };
    }

    public async Task<bool> DeleteMessageAsync(Guid userId, Guid messageId)
    {
        var message = await _context.Messages.FirstOrDefaultAsync(m => m.Id == messageId && m.DeletedAt == null);
        if (message == null) return false;

        if (message.SenderId != userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.Role != UserRole.Admin) throw new ValidationException("Anda tidak dapat menghapus pesan ini.");
        }

        message.DeletedAt = DateTime.UtcNow;
        message.DeletedByUserId = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkConversationAsReadAsync(Guid userId, Guid conversationId)
    {
        var member = await _context.ConversationMembers
            .FirstOrDefaultAsync(cm => cm.ConversationId == conversationId && cm.UserId == userId);

        if (member == null) return false;

        member.LastReadAt = DateTime.UtcNow;
        member.UpdatedByUserId = userId;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetTotalUnreadMessagesCountAsync(Guid userId)
    {
        var memberConvs = await _context.ConversationMembers
            .AsNoTracking()
            .Where(cm => cm.UserId == userId && cm.Conversation.DeletedAt == null)
            .ToListAsync();

        int totalUnread = 0;
        foreach (var mc in memberConvs)
        {
            var unread = await _context.Messages
                .AsNoTracking()
                .Where(m => m.ConversationId == mc.ConversationId && m.SenderId != userId && m.DeletedAt == null)
                .Where(m => mc.LastReadAt == null || m.CreatedAt > mc.LastReadAt.Value)
                .CountAsync();

            totalUnread += unread;
        }

        return totalUnread;
    }

    private async Task<ConversationResponse> MapConversationResponseAsync(Conversation c, Guid currentUserId)
    {
        var member = c.Members.FirstOrDefault(m => m.UserId == currentUserId);
        int unread = await _context.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == c.Id && m.SenderId != currentUserId && m.DeletedAt == null)
            .Where(m => member == null || member.LastReadAt == null || m.CreatedAt > member.LastReadAt.Value)
            .CountAsync();

        return new ConversationResponse
        {
            Id = c.Id,
            Title = c.Title,
            Type = c.Type,
            LastActivityAt = c.LastActivityAt,
            UnreadCount = unread,
            CreatedAt = c.CreatedAt,
            Members = c.Members.Select(m => new ConversationMemberDto
            {
                UserId = m.UserId,
                FullName = m.User?.FullName ?? "User",
                Email = m.User?.Email ?? "",
                Role = m.User?.Role.ToString() ?? "",
                PhotoUrl = m.User?.PhotoUrl,
                JoinedAt = m.JoinedAt,
                LastReadAt = m.LastReadAt
            }).ToList(),
            LastMessage = c.LastMessage != null ? MapMessageResponse(c.LastMessage, c.LastMessage.Sender) : null
        };
    }

    private static MessageResponse MapMessageResponse(Message m, User sender)
    {
        return new MessageResponse
        {
            Id = m.Id,
            ConversationId = m.ConversationId,
            SenderId = m.SenderId,
            SenderName = sender?.FullName ?? "Unknown",
            SenderPhotoUrl = sender?.PhotoUrl,
            MessageType = m.MessageType,
            Text = m.Text,
            ReadAt = m.ReadAt,
            EditedAt = m.EditedAt,
            CreatedAt = m.CreatedAt,
            Attachments = m.Attachments.Select(a => new MessageAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                StorageProvider = a.StorageProvider,
                Url = a.Url
            }).ToList()
        };
    }
}
