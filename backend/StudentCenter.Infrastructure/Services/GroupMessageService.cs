using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class GroupMessageService : IGroupMessageService
{
    private readonly AppDbContext _context;

    public GroupMessageService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<GroupMessageResponse>> GetGroupMessagesAsync(Guid groupId, Guid currentUserId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        // Verify membership
        var isMember = await _context.CommunityGroupMembers
            .AnyAsync(m => m.GroupId == groupId && m.UserId == currentUserId && m.Status == CommunityMemberStatus.Accepted);

        var isGlobalAdmin = await _context.Users.AnyAsync(u => u.Id == currentUserId && u.Role == UserRole.Admin);

        if (!isMember && !isGlobalAdmin)
            throw new UnauthorizedAccessException("Must be an accepted member of the group to access group chat messages.");

        var query = _context.GroupMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage)
                .ThenInclude(rm => rm!.SenderUser)
            .Include(m => m.DeletedForUsers)
            .AsNoTracking()
            .Where(m => m.GroupId == groupId && !m.DeletedForUsers.Any(d => d.UserId == currentUserId));

        var totalCount = await query.CountAsync();
        var rawItems = await query
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = rawItems.Select(m => MapResponse(m, currentUserId)).ToList();

        return new PagedResult<GroupMessageResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<GroupMessageResponse> SendMessageAsync(SendGroupMessageRequest request, Guid senderUserId)
    {
        // Verify sender membership
        var isMember = await _context.CommunityGroupMembers
            .AnyAsync(m => m.GroupId == request.GroupId && m.UserId == senderUserId && m.Status == CommunityMemberStatus.Accepted);

        if (!isMember)
            throw new UnauthorizedAccessException("Only accepted group members can send group messages.");

        // Fetch active member user IDs in group to validate envelope recipients
        var activeMemberUserIds = await _context.CommunityGroupMembers
            .AsNoTracking()
            .Where(m => m.GroupId == request.GroupId && m.Status == CommunityMemberStatus.Accepted)
            .Select(m => m.UserId)
            .ToListAsync();

        foreach (var envReq in request.RecipientEnvelopes)
        {
            if (!activeMemberUserIds.Contains(envReq.RecipientUserId))
            {
                throw new UnauthorizedAccessException("Salah satu penerima amplop pesan bukan merupakan anggota aktif grup ini.");
            }
        }

        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

        var message = new GroupMessage
        {
            Id = Guid.NewGuid(),
            GroupId = request.GroupId,
            SenderUserId = senderUserId,
            ReplyToMessageId = request.ReplyToMessageId,
            EncryptedPayloadBase64 = request.EncryptedPayloadBase64,
            Nonce = request.Nonce,
            SentAt = DateTime.UtcNow
        };

        _context.GroupMessages.Add(message);

        foreach (var envReq in request.RecipientEnvelopes)
        {
            _context.GroupMessageRecipientEnvelopes.Add(new GroupMessageRecipientEnvelope
            {
                Id = Guid.NewGuid(),
                MessageId = message.Id,
                RecipientUserId = envReq.RecipientUserId,
                EncryptedKeyPackage = envReq.EncryptedKeyPackage
            });
        }

        await _context.SaveChangesAsync();
        if (transaction != null)
        {
            await transaction.CommitAsync();
        }

        // Trigger real-time system notifications for mentioned users
        try
        {
            var rawBytes = Convert.FromBase64String(request.EncryptedPayloadBase64);
            var plainText = System.Text.Encoding.UTF8.GetString(rawBytes);

            if (plainText.Contains("@"))
            {
                var group = await _context.CommunityGroups.AsNoTracking().FirstOrDefaultAsync(g => g.Id == request.GroupId);
                var senderUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == senderUserId);
                var senderName = senderUser?.FullName ?? senderUser?.UserName ?? "Anggota";
                var groupName = group?.Name ?? "Komunitas";

                var acceptedMembers = await _context.CommunityGroupMembers
                    .Include(m => m.User)
                    .AsNoTracking()
                    .Where(m => m.GroupId == request.GroupId && m.Status == CommunityMemberStatus.Accepted && m.UserId != senderUserId)
                    .ToListAsync();

                var notifService = new NotificationService(_context);

                foreach (var member in acceptedMembers)
                {
                    var uName = member.User?.UserName;
                    var fName = member.User?.FullName;

                    bool isMentionedEveryone = plainText.ToLower().Contains("@semua") || plainText.ToLower().Contains("@everyone");
                    bool isMentioned = isMentionedEveryone ||
                                       (!string.IsNullOrEmpty(uName) && plainText.ToLower().Contains($"@{uName.ToLower()}")) ||
                                       (!string.IsNullOrEmpty(fName) && plainText.ToLower().Contains($"@{fName.ToLower()}"));

                    if (isMentioned)
                    {
                        var snippet = plainText.Length > 60 ? plainText.Substring(0, 60) + "..." : plainText;
                        var notifTitle = isMentionedEveryone
                            ? $"{senderName} menyebut @semua di {groupName}"
                            : $"{senderName} menyebut Anda di {groupName}";

                        await notifService.CreateAsync(new CreateNotificationRequest
                        {
                            UserId = member.UserId,
                            Title = notifTitle,
                            Message = $"\"{snippet}\"",
                            Type = NotificationType.Mention,
                            Priority = NotificationPriority.High,
                            ReferenceId = message.Id,
                            ReferenceType = NotificationReferenceType.Message
                        });
                    }
                }

            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Mention Notification Error] {ex.Message}");
        }

        var created = await _context.GroupMessages

            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage)
                .ThenInclude(rm => rm!.SenderUser)
            .AsNoTracking()
            .FirstAsync(m => m.Id == message.Id);

        return MapResponse(created, senderUserId);
    }

    public async Task<GroupMessageResponse> ToggleReactionAsync(Guid messageId, string emoji, Guid userId)
    {
        var message = await _context.GroupMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage)
                .ThenInclude(rm => rm!.SenderUser)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Pesan tidak ditemukan.");

        var isMember = await _context.CommunityGroupMembers
            .AnyAsync(m => m.GroupId == message.GroupId && m.UserId == userId && m.Status == CommunityMemberStatus.Accepted);
        var isGlobalAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin);

        if (!isMember && !isGlobalAdmin)
            throw new UnauthorizedAccessException("Hanya anggota aktif grup yang dapat memberikan reaksi.");

        var existingReaction = await _context.GroupMessageReactions
            .FirstOrDefaultAsync(r => r.MessageId == messageId && r.UserId == userId);

        if (existingReaction != null)
        {
            if (existingReaction.Emoji == emoji)
            {
                _context.GroupMessageReactions.Remove(existingReaction);
            }
            else
            {
                existingReaction.Emoji = emoji;
                existingReaction.CreatedAt = DateTime.UtcNow;
            }
        }
        else
        {
            _context.GroupMessageReactions.Add(new GroupMessageReaction
            {
                Id = Guid.NewGuid(),
                MessageId = messageId,
                UserId = userId,
                Emoji = emoji,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        var updated = await _context.GroupMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage)
                .ThenInclude(rm => rm!.SenderUser)
            .AsNoTracking()
            .FirstAsync(m => m.Id == messageId);

        return MapResponse(updated, userId);
    }

    public async Task<GroupMessageResponse> EditMessageAsync(Guid messageId, EditGroupMessageRequest request, Guid userId)
    {
        var message = await _context.GroupMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage)
                .ThenInclude(rm => rm!.SenderUser)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Pesan tidak ditemukan.");

        if (message.SenderUserId != userId)
            throw new UnauthorizedAccessException("Hanya pengirim yang dapat mengedit pesan ini.");

        if (message.IsDeletedForEveryone)
            throw new InvalidOperationException("Pesan yang telah dihapus untuk semua orang tidak dapat diedit.");

        message.EncryptedPayloadBase64 = request.EncryptedPayloadBase64;
        message.Nonce = request.Nonce;
        message.IsEdited = true;
        message.EditedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updated = await _context.GroupMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .Include(m => m.Reactions)
            .Include(m => m.ReplyToMessage)
                .ThenInclude(rm => rm!.SenderUser)
            .AsNoTracking()
            .FirstAsync(m => m.Id == messageId);

        return MapResponse(updated, userId);
    }

    public async Task<bool> DeleteMessageForEveryoneAsync(Guid messageId, Guid userId)
    {
        var message = await _context.GroupMessages
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Pesan tidak ditemukan.");

        var isSender = message.SenderUserId == userId;
        var groupMember = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == message.GroupId && m.UserId == userId && m.Status == CommunityMemberStatus.Accepted);

        var isGroupAdmin = groupMember != null && (groupMember.Role == CommunityMemberRole.Admin || groupMember.Role == CommunityMemberRole.Owner);
        var isGlobalAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin);

        if (!isSender && !isGroupAdmin && !isGlobalAdmin)
            throw new UnauthorizedAccessException("Hanya pengirim atau admin grup yang dapat menghapus pesan untuk semua orang.");

        message.IsDeletedForEveryone = true;
        message.DeletedForEveryoneAt = DateTime.UtcNow;

        // Encode deleted message marker in base64
        var deletedText = "[Pesan ini telah dihapus]";
        var bytes = System.Text.Encoding.UTF8.GetBytes(deletedText);
        message.EncryptedPayloadBase64 = Convert.ToBase64String(bytes);

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteMessageForMeAsync(Guid messageId, Guid userId)
    {
        var message = await _context.GroupMessages
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
            throw new KeyNotFoundException("Pesan tidak ditemukan.");

        var existing = await _context.GroupMessageDeletedUsers
            .FirstOrDefaultAsync(d => d.MessageId == messageId && d.UserId == userId);

        if (existing == null)
        {
            _context.GroupMessageDeletedUsers.Add(new GroupMessageDeletedUser
            {
                Id = Guid.NewGuid(),
                MessageId = messageId,
                UserId = userId,
                DeletedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        return true;
    }

    private static GroupMessageResponse MapResponse(GroupMessage m, Guid currentUserId)
    {
        var reactionsCount = m.Reactions?
            .GroupBy(r => r.Emoji)
            .ToDictionary(g => g.Key, g => g.Count()) ?? new Dictionary<string, int>();

        var userReaction = m.Reactions?.FirstOrDefault(r => r.UserId == currentUserId)?.Emoji;

        return new GroupMessageResponse
        {
            Id = m.Id,
            GroupId = m.GroupId,
            SenderUserId = m.SenderUserId,
            SenderName = m.SenderUser?.FullName ?? m.SenderUser?.Username ?? string.Empty,
            ReplyToMessageId = m.ReplyToMessageId,
            ReplyToSenderName = m.ReplyToMessage?.SenderUser?.FullName ?? m.ReplyToMessage?.SenderUser?.Username,
            ReplyToEncryptedPayloadBase64 = m.ReplyToMessage?.EncryptedPayloadBase64,
            EncryptedPayloadBase64 = m.EncryptedPayloadBase64,
            Nonce = m.Nonce,
            SentAt = m.SentAt,
            IsEdited = m.IsEdited,
            EditedAt = m.EditedAt,
            IsDeletedForEveryone = m.IsDeletedForEveryone,
            Envelopes = m.RecipientEnvelopes?.Select(e => new RecipientEnvelopeResponse
            {
                RecipientUserId = e.RecipientUserId,
                EncryptedKeyPackage = e.EncryptedKeyPackage
            }).ToList() ?? new(),
            Reactions = reactionsCount,
            UserReaction = userReaction
        };
    }
}
