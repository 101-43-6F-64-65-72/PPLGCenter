using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;

namespace StudentCenter.Tests;

public class GroupMessageServiceTests
{
    private readonly AppDbContext _context;
    private readonly GroupMessageService _service;

    public GroupMessageServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new GroupMessageService(_context);
    }

    [Fact]
    public async Task GetGroupMessagesAsync_NonMember_ThrowsUnauthorizedAccessException()
    {
        var groupId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var nonMember = new User { Id = userId, FullName = "Student A", Email = "studenta@test.com", Role = UserRole.Student };
        _context.Users.Add(nonMember);
        await _context.SaveChangesAsync();

        Func<Task> act = async () => await _service.GetGroupMessagesAsync(groupId, userId, 1, 20);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task SendMessageAsync_AcceptedMember_SavesMessageAndEnvelopes()
    {
        var groupId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        var sender = new User { Id = senderId, FullName = "Sender Student", Email = "sender@test.com", Role = UserRole.Student };
        var member = new User { Id = memberId, FullName = "Peer Student", Email = "peer@test.com", Role = UserRole.Student };
        _context.Users.AddRange(sender, member);

        var group = new CommunityGroup { Id = groupId, Name = "PPLG Web Dev Group", Description = "Project Study Group", CreatedByUserId = senderId, CreatedAt = DateTime.UtcNow };
        _context.CommunityGroups.Add(group);

        _context.CommunityGroupMembers.AddRange(
            new CommunityGroupMember { Id = Guid.NewGuid(), GroupId = groupId, UserId = senderId, Role = CommunityMemberRole.Admin, Status = CommunityMemberStatus.Accepted, JoinedAt = DateTime.UtcNow },
            new CommunityGroupMember { Id = Guid.NewGuid(), GroupId = groupId, UserId = memberId, Role = CommunityMemberRole.Member, Status = CommunityMemberStatus.Accepted, JoinedAt = DateTime.UtcNow }
        );

        await _context.SaveChangesAsync();

        var request = new SendGroupMessageRequest
        {
            GroupId = groupId,
            EncryptedPayloadBase64 = "BASE64_CIPHERTEXT_PAYLOAD",
            Nonce = "NONCE_12345",
            RecipientEnvelopes = new List<RecipientEnvelopeRequest>
            {
                new RecipientEnvelopeRequest { RecipientUserId = memberId, EncryptedKeyPackage = "ENCRYPTED_KEY_FOR_MEMBER" }
            }
        };

        var response = await _service.SendMessageAsync(request, senderId);

        response.Should().NotBeNull();
        response.GroupId.Should().Be(groupId);
        response.EncryptedPayloadBase64.Should().Be("BASE64_CIPHERTEXT_PAYLOAD");

        var savedMessage = await _context.GroupMessages.Include(m => m.RecipientEnvelopes).FirstOrDefaultAsync(m => m.Id == response.Id);
        savedMessage.Should().NotBeNull();
        savedMessage!.RecipientEnvelopes.Should().HaveCount(1);
    }

    [Fact]
    public async Task ToggleReactionAsync_AcceptedMember_AddsUpdatesAndRemovesReaction()
    {
        var groupId = Guid.NewGuid();
        var senderId = Guid.NewGuid();

        var sender = new User { Id = senderId, FullName = "Sender Student", Email = "sender2@test.com", Role = UserRole.Student };
        _context.Users.Add(sender);

        var group = new CommunityGroup { Id = groupId, Name = "Test Group", Description = "Desc", CreatedByUserId = senderId, CreatedAt = DateTime.UtcNow };
        _context.CommunityGroups.Add(group);

        _context.CommunityGroupMembers.Add(
            new CommunityGroupMember { Id = Guid.NewGuid(), GroupId = groupId, UserId = senderId, Role = CommunityMemberRole.Admin, Status = CommunityMemberStatus.Accepted, JoinedAt = DateTime.UtcNow }
        );

        var message = new GroupMessage
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            SenderUserId = senderId,
            EncryptedPayloadBase64 = "CIPHERTEXT",
            Nonce = "NONCE",
            SentAt = DateTime.UtcNow
        };
        _context.GroupMessages.Add(message);
        await _context.SaveChangesAsync();

        // 1. Add reaction 👍
        var res1 = await _service.ToggleReactionAsync(message.Id, "👍", senderId);
        res1.Reactions.Should().ContainKey("👍").WhoseValue.Should().Be(1);
        res1.UserReaction.Should().Be("👍");

        // 2. Change reaction to ❤️
        var res2 = await _service.ToggleReactionAsync(message.Id, "❤️", senderId);
        res2.Reactions.Should().ContainKey("❤️").WhoseValue.Should().Be(1);
        res2.Reactions.Should().NotContainKey("👍");
        res2.UserReaction.Should().Be("❤️");

        // 3. Toggle off ❤️ (same emoji clicked)
        var res3 = await _service.ToggleReactionAsync(message.Id, "❤️", senderId);
        res3.Reactions.Should().NotContainKey("❤️");
        res3.UserReaction.Should().BeNull();
    }
}

