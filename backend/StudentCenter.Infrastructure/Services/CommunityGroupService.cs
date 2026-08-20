using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class CommunityGroupService : ICommunityGroupService
{
    private readonly AppDbContext _context;

    public CommunityGroupService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CommunityGroupResponse>> GetGroupsAsync(Guid currentUserId, int page, int pageSize, string? search)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdmin = currentUser != null && currentUser.Role == UserRole.Admin;

        var query = _context.CommunityGroups
            .Include(g => g.CreatedByUser)
            .Include(g => g.Members)
            .AsNoTracking()
            .AsQueryable();

        // Private Group Scoping: Students/Teachers only see groups they created or are members of (Accepted or Pending)
        if (!isAdmin)
        {
            query = query.Where(g => g.CreatedByUserId == currentUserId ||
                                     g.Members.Any(m => m.UserId == currentUserId &&
                                        (m.Status == CommunityMemberStatus.Accepted || m.Status == CommunityMemberStatus.Pending)));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(g => g.Name.ToLower().Contains(s) || (g.Description != null && g.Description.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => MapGroup(g, currentUserId))
            .ToListAsync();

        return new PagedResult<CommunityGroupResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<CommunityGroupResponse?> GetGroupByIdAsync(Guid groupId, Guid currentUserId)
    {
        var group = await _context.CommunityGroups
            .Include(g => g.CreatedByUser)
            .Include(g => g.Members)
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == groupId);

        return group is null ? null : MapGroup(group, currentUserId);
    }

    public async Task<CommunityGroupResponse> CreateGroupAsync(CreateCommunityGroupRequest request, Guid creatorUserId)
    {
        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

        var group = new CommunityGroup
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            AvatarUrl = request.AvatarUrl,
            CreatedByUserId = creatorUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.CommunityGroups.Add(group);

        // Auto-add creator as Group Owner
        var creatorMember = new CommunityGroupMember
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            UserId = creatorUserId,
            Role = CommunityMemberRole.Owner,
            Status = CommunityMemberStatus.Accepted,
            JoinedAt = DateTime.UtcNow
        };

        _context.CommunityGroupMembers.Add(creatorMember);

        // Batch addition of initial members (if specified by creator/teacher/admin)
        if (request.InitialMemberUserIds != null && request.InitialMemberUserIds.Any())
        {
            var uniqueMemberIds = request.InitialMemberUserIds.Where(id => id != creatorUserId).Distinct();
            foreach (var memberId in uniqueMemberIds)
            {
                var userExists = await _context.Users.AnyAsync(u => u.Id == memberId);
                if (userExists)
                {
                    _context.CommunityGroupMembers.Add(new CommunityGroupMember
                    {
                        Id = Guid.NewGuid(),
                        GroupId = group.Id,
                        UserId = memberId,
                        Role = CommunityMemberRole.Member,
                        Status = CommunityMemberStatus.Accepted,
                        JoinedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        if (transaction != null) await transaction.CommitAsync();

        return (await GetGroupByIdAsync(group.Id, creatorUserId))!;
    }

    public async Task<bool> JoinGroupRequestAsync(Guid groupId, Guid currentUserId)
    {
        var groupExists = await _context.CommunityGroups.AnyAsync(g => g.Id == groupId);
        if (!groupExists) return false;

        var existingMember = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == currentUserId);

        if (existingMember is not null)
        {
            if (existingMember.Status == CommunityMemberStatus.Accepted || existingMember.Status == CommunityMemberStatus.Pending)
                return true;

            existingMember.Status = CommunityMemberStatus.Pending;
            existingMember.Role = CommunityMemberRole.Member;
            existingMember.JoinedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        _context.CommunityGroupMembers.Add(new CommunityGroupMember
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            UserId = currentUserId,
            Role = CommunityMemberRole.Member,
            Status = CommunityMemberStatus.Pending,
            JoinedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CommunityMemberResponse>> GetMembersAsync(Guid groupId, Guid currentUserId)
    {
        var isMember = await _context.CommunityGroupMembers
            .AnyAsync(m => m.GroupId == groupId && m.UserId == currentUserId && m.Status == CommunityMemberStatus.Accepted);

        var isGlobalAdmin = await _context.Users.AnyAsync(u => u.Id == currentUserId && u.Role == UserRole.Admin);

        if (!isMember && !isGlobalAdmin)
            throw new UnauthorizedAccessException("Must be an accepted member to view group membership list.");

        var members = await _context.CommunityGroupMembers
            .Include(m => m.User)
                .ThenInclude(u => u!.Class)
            .AsNoTracking()
            .Where(m => m.GroupId == groupId)
            .OrderBy(m => m.Role)
            .ThenBy(m => m.JoinedAt)
            .Select(m => MapMember(m))
            .ToListAsync();

        return members;
    }

    public async Task<CommunityMemberResponse?> ManageMemberAsync(Guid groupId, Guid targetUserId, ManageMemberRequest request, Guid currentUserId)
    {
        var currentMember = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == currentUserId && m.Status == CommunityMemberStatus.Accepted);

        var isGlobalAdmin = await _context.Users.AnyAsync(u => u.Id == currentUserId && u.Role == UserRole.Admin);

        if (currentMember is null && !isGlobalAdmin)
            return null;

        if (!isGlobalAdmin && currentMember?.Role != CommunityMemberRole.Owner && currentMember?.Role != CommunityMemberRole.Admin)
            throw new UnauthorizedAccessException("Only Group Owner or Group Admin can manage members.");

        var targetMember = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == targetUserId);

        if (targetMember is null) return null;

        if (request.Role == CommunityMemberRole.Owner && currentMember?.Role != CommunityMemberRole.Owner && !isGlobalAdmin)
            throw new UnauthorizedAccessException("Only current Owner can transfer group ownership.");

        if (request.Status == CommunityMemberStatus.Declined)
        {
            _context.CommunityGroupMembers.Remove(targetMember);
            await _context.SaveChangesAsync();
            return MapMember(targetMember);
        }

        targetMember.Status = request.Status;
        targetMember.Role = request.Role;

        await _context.SaveChangesAsync();

        var updated = await _context.CommunityGroupMembers
            .Include(m => m.User)
                .ThenInclude(u => u!.Class)
            .AsNoTracking()
            .FirstAsync(m => m.Id == targetMember.Id);

        return MapMember(updated);
    }

    public async Task<bool> LeaveGroupAsync(Guid groupId, Guid currentUserId)
    {
        var member = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == currentUserId);

        if (member is null) return false;

        _context.CommunityGroupMembers.Remove(member);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> InviteMemberAsync(Guid groupId, Guid targetUserId, Guid currentUserId)
    {
        var groupExists = await _context.CommunityGroups.AnyAsync(g => g.Id == groupId);
        if (!groupExists) return false;

        var existingMember = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == targetUserId);

        if (existingMember != null)
        {
            if (existingMember.Status == CommunityMemberStatus.Accepted || existingMember.Status == CommunityMemberStatus.Pending)
                return true;

            existingMember.Status = CommunityMemberStatus.Pending;
            existingMember.Role = CommunityMemberRole.Member;
            existingMember.JoinedAt = DateTime.UtcNow;
        }
        else
        {
            _context.CommunityGroupMembers.Add(new CommunityGroupMember
            {
                Id = Guid.NewGuid(),
                GroupId = groupId,
                UserId = targetUserId,
                Role = CommunityMemberRole.Member,
                Status = CommunityMemberStatus.Pending,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<UserSearchInviteResult>> SearchUsersForInviteAsync(Guid groupId, string query, Guid currentUserId)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            return new List<UserSearchInviteResult>();

        var q = query.Trim().ToLower();

        var existingMembers = await _context.CommunityGroupMembers
            .AsNoTracking()
            .Where(m => m.GroupId == groupId)
            .ToDictionaryAsync(m => m.UserId, m => m.Status);

        var users = await _context.Users
            .Include(u => u.Class)
            .AsNoTracking()
            .Where(u => u.IsActive && u.FullName.ToLower().Contains(q))
            .OrderBy(u => u.FullName)
            .Take(30)
            .ToListAsync();

        return users.Select(u => new UserSearchInviteResult
        {
            UserId = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            Role = u.Role.ToString(),
            ClassName = u.Class?.Name,
            Position = u.Position,
            PhotoUrl = u.PhotoUrl,
            IsAlreadyMemberOrInvited = existingMembers.ContainsKey(u.Id) &&
                (existingMembers[u.Id] == CommunityMemberStatus.Accepted || existingMembers[u.Id] == CommunityMemberStatus.Pending)
        }).ToList();
    }

    public async Task<List<CommunityInvitationResponse>> GetInvitationsAsync(Guid currentUserId)
    {
        var pendingMemberships = await _context.CommunityGroupMembers
            .Include(m => m.Group)
                .ThenInclude(g => g!.CreatedByUser)
            .AsNoTracking()
            .Where(m => m.UserId == currentUserId && m.Status == CommunityMemberStatus.Pending)
            .OrderByDescending(m => m.JoinedAt)
            .ToListAsync();

        return pendingMemberships.Select(m => new CommunityInvitationResponse
        {
            MembershipId = m.Id,
            GroupId = m.GroupId,
            GroupName = m.Group?.Name ?? string.Empty,
            GroupDescription = m.Group?.Description,
            GroupAvatarUrl = m.Group?.AvatarUrl,
            CreatorName = m.Group?.CreatedByUser?.FullName ?? m.Group?.CreatedByUser?.Username ?? "Pengelola",
            InvitedAt = m.JoinedAt
        }).ToList();
    }

    public async Task<bool> RespondToInvitationAsync(Guid membershipId, bool accept, Guid currentUserId)
    {
        var member = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.Id == membershipId && m.UserId == currentUserId);

        if (member is null) return false;

        if (accept)
        {
            member.Status = CommunityMemberStatus.Accepted;
            member.JoinedAt = DateTime.UtcNow;
        }
        else
        {
            _context.CommunityGroupMembers.Remove(member);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CommunityMentionResponse>> GetMentionsAsync(Guid currentUserId)
    {
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (user is null) return new List<CommunityMentionResponse>();

        var myGroupIds = await _context.CommunityGroupMembers
            .AsNoTracking()
            .Where(m => m.UserId == currentUserId && m.Status == CommunityMemberStatus.Accepted)
            .Select(m => m.GroupId)
            .ToListAsync();

        var messages = await _context.GroupMessages
            .Include(m => m.Group)
            .Include(m => m.SenderUser)
            .AsNoTracking()
            .Where(m => myGroupIds.Contains(m.GroupId) && m.SenderUserId != currentUserId)
            .OrderByDescending(m => m.SentAt)
            .Take(25)
            .ToListAsync();

        return messages.Select(m => new CommunityMentionResponse
        {
            Id = m.Id,
            GroupId = m.GroupId,
            GroupName = m.Group?.Name ?? "Grup Komunitas",
            MessageId = m.Id,
            SenderName = m.SenderUser?.FullName ?? m.SenderUser?.Username ?? "Anggota",
            ContentSnippet = "Pesan baru / mention di " + (m.Group?.Name ?? "grup"),
            CreatedAt = m.SentAt,
            IsRead = false
        }).ToList();
    }

    public async Task<bool> DeleteGroupAsync(Guid groupId, Guid currentUserId)
    {
        var group = await _context.CommunityGroups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group is null) return false;

        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);

        var myMembership = group.Members.FirstOrDefault(m => m.UserId == currentUserId && m.Status == CommunityMemberStatus.Accepted);
        bool isOwner = group.CreatedByUserId == currentUserId || (myMembership != null && myMembership.Role == CommunityMemberRole.Owner);

        if (!isAdminOrTeacher && !isOwner)
            throw new UnauthorizedAccessException("Hanya Pembuat Grup, Guru, atau Admin yang dapat menghapus grup komunitas.");

        var members = await _context.CommunityGroupMembers.Where(m => m.GroupId == groupId).ToListAsync();
        _context.CommunityGroupMembers.RemoveRange(members);

        var messages = await _context.GroupMessages.Where(m => m.GroupId == groupId).ToListAsync();
        _context.GroupMessages.RemoveRange(messages);

        _context.CommunityGroups.Remove(group);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CommunityGroupResponse MapGroup(CommunityGroup g, Guid currentUserId)
    {
        var myMembership = g.Members.FirstOrDefault(m => m.UserId == currentUserId);
        return new CommunityGroupResponse
        {
            Id = g.Id,
            Name = g.Name,
            Description = g.Description,
            AvatarUrl = g.AvatarUrl,
            CreatedByUserId = g.CreatedByUserId,
            CreatorName = g.CreatedByUser?.FullName ?? g.CreatedByUser?.Username ?? string.Empty,
            CreatedAt = g.CreatedAt,
            MemberCount = g.Members.Count(m => m.Status == CommunityMemberStatus.Accepted),
            MyRole = myMembership?.Role,
            MyStatus = myMembership?.Status
        };
    }

    private static CommunityMemberResponse MapMember(CommunityGroupMember m) => new()
    {
        Id = m.Id,
        GroupId = m.GroupId,
        UserId = m.UserId,
        UserName = m.User?.FullName ?? m.User?.Username ?? string.Empty,
        UserEmail = m.User?.Email ?? string.Empty,
        UserPhotoUrl = m.User?.PhotoUrl,
        ClassName = m.User?.Class?.Name,
        Position = m.User?.Position,
        Role = m.Role,
        Status = m.Status,
        JoinedAt = m.JoinedAt
    };
}
