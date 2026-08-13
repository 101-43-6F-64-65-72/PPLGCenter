namespace StudentCenter.Application.DTOs;

public class FacilityManagerResponse
{
    public Guid Id { get; set; }
    public Guid FacilityId { get; set; }
    public Guid ManagerUserId { get; set; }
    public string ManagerName { get; set; } = string.Empty;
    public string ManagerEmail { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
}
