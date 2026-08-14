namespace StudentCenter.Domain.Entities;

public class ClassSubject
{
    public Guid Id { get; set; }

    public Guid ClassId { get; set; }
    public SchoolClass Class { get; set; } = null!;

    public Guid TeacherSubjectId { get; set; }
    public TeacherSubject TeacherSubject { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
