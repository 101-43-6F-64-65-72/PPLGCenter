namespace StudentCenter.Domain.Entities;

public class Subject
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty; // Unique, e.g. "MTK", "PBO"
    public string Name { get; set; } = string.Empty; // e.g. "Matematika", "Pemrograman Berbasis Objek"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<TeacherSubject> TeacherSubjects { get; set; } = new List<TeacherSubject>();
}
