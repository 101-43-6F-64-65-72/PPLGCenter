namespace StudentCenter.Application.DTOs;

public class CalendarEventResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime EventDate { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? Location { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string Visibility { get; set; } = string.Empty;
    public bool IsAllDay { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
