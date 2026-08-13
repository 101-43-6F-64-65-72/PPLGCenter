namespace StudentCenter.Domain.Entities;

public class CommunityGroup
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AvatarUrl { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CommunityGroupMember> Members { get; set; } = new List<CommunityGroupMember>();
    public ICollection<GroupMessage> Messages { get; set; } = new List<GroupMessage>();
}
