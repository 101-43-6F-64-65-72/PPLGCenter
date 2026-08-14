namespace StudentCenter.Domain.Entities;

public class GradeScale
{
    public Guid Id { get; set; }
    public decimal Minimum { get; set; }
    public decimal Maximum { get; set; }
    public string Letter { get; set; } = string.Empty;
    public string Predicate { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
