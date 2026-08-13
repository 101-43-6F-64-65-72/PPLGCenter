namespace StudentCenter.Domain.Entities;

public class FacilityManager
{
    public Guid Id { get; set; }
    public Guid FacilityId { get; set; }
    public Facility Facility { get; set; } = null!;

    public Guid ManagerUserId { get; set; }
    public User ManagerUser { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
