namespace StudentCenter.Domain.Entities;

public class TeacherSubject
{
    public Guid Id { get; set; }

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<ClassSubject> ClassSubjects { get; set; } = new List<ClassSubject>();
}
