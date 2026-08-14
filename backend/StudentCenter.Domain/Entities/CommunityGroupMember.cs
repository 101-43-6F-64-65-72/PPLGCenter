using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class CommunityGroupMember
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public CommunityGroup Group { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public CommunityMemberRole Role { get; set; } = CommunityMemberRole.Member;
    public CommunityMemberStatus Status { get; set; } = CommunityMemberStatus.Pending;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
