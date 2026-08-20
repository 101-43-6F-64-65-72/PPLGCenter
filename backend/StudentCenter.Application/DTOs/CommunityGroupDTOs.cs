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
    public List<Guid>? InitialMemberUserIds { get; set; }
}

public class CommunityMemberResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? UserPhotoUrl { get; set; }
    public string? ClassName { get; set; }
    public string? Position { get; set; }
    public CommunityMemberRole Role { get; set; }
    public CommunityMemberStatus Status { get; set; }
    public DateTime JoinedAt { get; set; }
}

public class ManageMemberRequest
{
    public CommunityMemberStatus Status { get; set; }
    public CommunityMemberRole Role { get; set; } = CommunityMemberRole.Member;
}

public class UserSearchInviteResult
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public string? Position { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsAlreadyMemberOrInvited { get; set; }
}

public class CommunityInvitationResponse
{
    public Guid MembershipId { get; set; }
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string? GroupDescription { get; set; }
    public string? GroupAvatarUrl { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public DateTime InvitedAt { get; set; }
}

public class CommunityMentionResponse
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public Guid MessageId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string ContentSnippet { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
}

