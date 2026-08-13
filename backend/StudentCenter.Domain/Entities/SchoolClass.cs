namespace StudentCenter.Domain.Entities;

/// <summary>
/// Represents a school class (e.g. "X RPL 1").
/// Named SchoolClass to avoid conflict with C# keyword 'class'.
/// </summary>
public class SchoolClass
{
    public Guid Id { get; set; }
    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;
    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;
    public string Name { get; set; } = string.Empty;       // "X RPL 1"
    public string Grade { get; set; } = string.Empty;      // "X" | "XI" | "XII"
    public int Capacity { get; set; } = 36;
    public Guid? HomeroomTeacherId { get; set; }           // nullable FK → User (Teacher)
    public User? HomeroomTeacher { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<User> Students { get; set; } = new List<User>();
    public ICollection<ClassDivision> Divisions { get; set; } = new List<ClassDivision>();
}
