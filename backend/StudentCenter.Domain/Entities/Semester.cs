namespace StudentCenter.Domain.Entities;

public class Semester
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;
    public string Name { get; set; } = string.Empty;   // "Ganjil" | "Genap"
    public int Order { get; set; }                      // 1 | 2
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
