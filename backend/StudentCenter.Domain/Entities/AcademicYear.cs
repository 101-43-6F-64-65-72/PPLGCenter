namespace StudentCenter.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;          // e.g. "2026/2027"
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Semester> Semesters { get; set; } = new List<Semester>();
    public ICollection<SchoolClass> Classes { get; set; } = new List<SchoolClass>();
}
