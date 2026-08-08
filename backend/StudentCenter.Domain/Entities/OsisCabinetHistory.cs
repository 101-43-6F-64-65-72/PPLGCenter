namespace StudentCenter.Domain.Entities;

public class OsisCabinetHistory
{
    public Guid Id { get; set; }

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public string PositionTitle { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
