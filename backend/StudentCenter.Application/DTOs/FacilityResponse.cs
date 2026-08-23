namespace StudentCenter.Application.DTOs;

public class FacilityResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Location { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string? ImageUrl { get; set; }
    public string? Model3DUrl { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public Guid? ManagerTeacherId { get; set; }
    public string? ManagerTeacherName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
