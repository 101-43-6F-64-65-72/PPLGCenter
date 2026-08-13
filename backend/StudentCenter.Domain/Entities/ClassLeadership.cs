namespace StudentCenter.Domain.Entities;

public class ClassLeadership
{
    public Guid Id { get; set; }
    public Guid SchoolClassId { get; set; }
    public SchoolClass SchoolClass { get; set; } = null!;

    public Guid HomeroomTeacherId { get; set; } // Wali Kelas
    public User HomeroomTeacher { get; set; } = null!;

    public Guid ClassLeaderStudentId { get; set; } // Ketua Kelas
    public User ClassLeaderStudent { get; set; } = null!;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid AppointedByUserId { get; set; }
    public DateTime AppointedAt { get; set; } = DateTime.UtcNow;

    public bool IsActive { get; set; } = true;
    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
    public DateTime? EndDate { get; set; }
}
