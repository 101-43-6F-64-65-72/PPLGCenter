using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class ScheduleRotationConfig
{
    public Guid Id { get; set; }
    public Guid SchoolClassId { get; set; }
    public SchoolClass SchoolClass { get; set; } = null!;

    public DateTime AnchorStartDate { get; set; } // Base Monday date of rotation cycle
    public SubjectCategory InitialCategory { get; set; } = SubjectCategory.KK;
    public int CycleWeeks { get; set; } = 2; // Default 2-week block
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
