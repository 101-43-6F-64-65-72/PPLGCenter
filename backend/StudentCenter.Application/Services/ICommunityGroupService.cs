using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ICommunityGroupService
{
    Task<PagedResult<CommunityGroupResponse>> GetGroupsAsync(Guid currentUserId, int page, int pageSize, string? search);
    Task<CommunityGroupResponse?> GetGroupByIdAsync(Guid groupId, Guid currentUserId);
    Task<CommunityGroupResponse> CreateGroupAsync(CreateCommunityGroupRequest request, Guid creatorUserId);
    Task<bool> JoinGroupRequestAsync(Guid groupId, Guid currentUserId);
    Task<List<CommunityMemberResponse>> GetMembersAsync(Guid groupId, Guid currentUserId);
    Task<CommunityMemberResponse?> ManageMemberAsync(Guid groupId, Guid targetUserId, ManageMemberRequest request, Guid currentUserId);
    Task<bool> LeaveGroupAsync(Guid groupId, Guid currentUserId);
}
