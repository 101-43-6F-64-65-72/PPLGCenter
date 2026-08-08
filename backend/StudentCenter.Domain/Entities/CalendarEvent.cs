namespace StudentCenter.Domain.Entities;

public class CalendarEvent
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; } = DateTime.UtcNow;

    // Alias for EventDate
    public DateTime EventDate
    {
        get => StartDate;
        set { StartDate = value; EndDate = value; }
    }

    public string? StartTime { get; set; }
    public string? EndTime { get; set; }

    public string? Location { get; set; }
    public string Category { get; set; } = "Academic"; // Academic, Exam, Holiday, Meeting, Extracurricular, OSIS, Other
    public string? Color { get; set; }
    public string Visibility { get; set; } = "Public"; // Public, TeacherOnly, AdminOnly

    public bool IsAllDay { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}
