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

        var query = _context.CommunityGroups
            .Include(g => g.CreatedByUser)
            .Include(g => g.Members)
            .AsNoTracking()
            .AsQueryable();

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
        using var transaction = await _context.Database.BeginTransactionAsync();

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
        var member = new CommunityGroupMember
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            UserId = creatorUserId,
            Role = CommunityMemberRole.Owner,
            Status = CommunityMemberStatus.Accepted,
            JoinedAt = DateTime.UtcNow
        };

        _context.CommunityGroupMembers.Add(member);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return (await GetGroupByIdAsync(group.Id, creatorUserId))!;
    }

    public async Task<bool> JoinGroupRequestAsync(Guid groupId, Guid currentUserId)
    {
        var groupExists = await _context.CommunityGroups.AnyAsync(g => g.Id == groupId);
        if (!groupExists) return false;

        var existingMember = await _context.CommunityGroupMembers
            .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == currentUserId);

        if (existingMember is not null)
            return true; // Already requested or member

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
        // Verify manager privileges (Owner or Admin)
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

        // Prevent non-owners from promoting to Owner
        if (request.Role == CommunityMemberRole.Owner && currentMember?.Role != CommunityMemberRole.Owner && !isGlobalAdmin)
            throw new UnauthorizedAccessException("Only current Owner can transfer group ownership.");

        targetMember.Status = request.Status;
        targetMember.Role = request.Role;

        await _context.SaveChangesAsync();

        var updated = await _context.CommunityGroupMembers
            .Include(m => m.User)
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
        Role = m.Role,
        Status = m.Status,
        JoinedAt = m.JoinedAt
    };
}
