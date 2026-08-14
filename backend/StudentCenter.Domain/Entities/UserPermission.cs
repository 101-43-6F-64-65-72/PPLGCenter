namespace StudentCenter.Domain.Entities;

public class UserPermission
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Capability { get; set; } = string.Empty; // e.g. "class.manage.tree", "facility.approve"
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public Guid GrantedByUserId { get; set; }
}
