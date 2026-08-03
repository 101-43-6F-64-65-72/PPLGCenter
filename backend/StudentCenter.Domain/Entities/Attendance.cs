using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Attendance
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
    public DateTime AttendanceDate { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
    public Guid RecordedByUserId { get; set; }
    public User RecordedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
