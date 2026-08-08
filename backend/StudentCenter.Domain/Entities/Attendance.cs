using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Attendance
{
    public Guid Id { get; set; }

    public Guid? AttendanceSessionId { get; set; }
    public AttendanceSession? AttendanceSession { get; set; }

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public DateTime AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.NotMarked;

    public DateTime? CheckInTime { get; set; }
    public string? Notes { get; set; }

    public Guid? RecordedByUserId { get; set; }
    public User? RecordedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
