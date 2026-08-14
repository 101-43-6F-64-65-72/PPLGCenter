namespace StudentCenter.Domain.Entities;

public class AcademicEvent
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Holiday | Exam | Meeting | Competition | School</summary>
    public string Type { get; set; } = "School";

    /// <summary>All | Teacher | Student | Class</summary>
    public string TargetType { get; set; } = "All";

    public Guid? TargetClassId { get; set; }
    public SchoolClass? TargetClass { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
