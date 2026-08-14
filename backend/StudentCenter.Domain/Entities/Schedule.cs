namespace StudentCenter.Domain.Entities;

public class Schedule
{
    public Guid Id { get; set; }

    public Guid ClassSubjectId { get; set; }
    public ClassSubject ClassSubject { get; set; } = null!;

    public Guid SemesterId { get; set; }
    public Semester Semester { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; } // Monday..Sunday

    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public string Room { get; set; } = string.Empty;
    public string? Color { get; set; } // Hex e.g. "#2c1ee8"

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
