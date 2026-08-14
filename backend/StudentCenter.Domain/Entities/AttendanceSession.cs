namespace StudentCenter.Domain.Entities;

public class AttendanceSession
{
    public Guid Id { get; set; }

    public Guid ScheduleId { get; set; }
    public Schedule Schedule { get; set; } = null!;

    // Snapshot fields
    public Guid ClassSubjectId { get; set; }
    public ClassSubject ClassSubject { get; set; } = null!;

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public Guid SemesterId { get; set; }
    public Semester Semester { get; set; } = null!;

    public int SessionNumber { get; set; } = 1;
    public DateTime Date { get; set; }

    public DateTime? OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }

    /// <summary>Open | Closed</summary>
    public string Status { get; set; } = "Open";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
