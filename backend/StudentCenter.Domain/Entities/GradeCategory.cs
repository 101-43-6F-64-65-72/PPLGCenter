using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class GradeCategory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; }
    public GradeCategoryType Type { get; set; } = GradeCategoryType.Assignment;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
}
