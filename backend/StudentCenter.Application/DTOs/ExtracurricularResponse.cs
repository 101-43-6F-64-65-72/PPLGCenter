namespace StudentCenter.Application.DTOs;

public class ExtracurricularResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int MaxMembers { get; set; }
    public int CurrentMembers { get; set; }
    public bool IsActive { get; set; }
    public Guid ManagedByUserId { get; set; }
    public string ManagedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
