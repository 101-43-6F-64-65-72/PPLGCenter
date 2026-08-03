namespace StudentCenter.Domain.Entities;

public class Extracurricular
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int MaxMembers { get; set; }
    public bool IsActive { get; set; }
    public Guid ManagedByUserId { get; set; }
    public User ManagedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<ExtracurricularMember> Members { get; set; } = new List<ExtracurricularMember>();
}
