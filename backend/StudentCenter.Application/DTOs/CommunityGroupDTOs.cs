using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CommunityGroupResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int MemberCount { get; set; }
    public CommunityMemberRole? MyRole { get; set; }
    public CommunityMemberStatus? MyStatus { get; set; }
}

public class CreateCommunityGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
}

public class CommunityMemberResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public CommunityMemberRole Role { get; set; }
    public CommunityMemberStatus Status { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class ManageMemberRequest
{
    public CommunityMemberStatus Status { get; set; }
    public CommunityMemberRole Role { get; set; } = CommunityMemberRole.Member;
}
