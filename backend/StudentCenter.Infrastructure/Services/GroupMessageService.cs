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
            .AsNoTracking()
            .Where(m => m.GroupId == groupId);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => MapResponse(m))
            .ToListAsync();

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

        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

        var message = new GroupMessage
        {
            Id = Guid.NewGuid(),
            GroupId = request.GroupId,
            SenderUserId = senderUserId,
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

        var created = await _context.GroupMessages
            .Include(m => m.SenderUser)
            .Include(m => m.RecipientEnvelopes)
            .AsNoTracking()
            .FirstAsync(m => m.Id == message.Id);

        return MapResponse(created);
    }

    private static GroupMessageResponse MapResponse(GroupMessage m) => new()
    {
        Id = m.Id,
        GroupId = m.GroupId,
        SenderUserId = m.SenderUserId,
        SenderName = m.SenderUser?.FullName ?? m.SenderUser?.Username ?? string.Empty,
        EncryptedPayloadBase64 = m.EncryptedPayloadBase64,
        Nonce = m.Nonce,
        SentAt = m.SentAt,
        Envelopes = m.RecipientEnvelopes.Select(e => new RecipientEnvelopeResponse
        {
            RecipientUserId = e.RecipientUserId,
            EncryptedKeyPackage = e.EncryptedKeyPackage
        }).ToList()
    };
}
