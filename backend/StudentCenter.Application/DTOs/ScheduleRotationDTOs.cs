using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class ScheduleRotationConfigResponse
{
    public Guid Id { get; set; }
    public Guid SchoolClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public DateTime AnchorStartDate { get; set; }
    public SubjectCategory InitialCategory { get; set; }
    public int CycleWeeks { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public SubjectCategory CurrentCategory { get; set; }
}

public class SaveScheduleRotationConfigRequest
{
    public Guid SchoolClassId { get; set; }
    public DateTime AnchorStartDate { get; set; }
    public SubjectCategory InitialCategory { get; set; }
    public int CycleWeeks { get; set; } = 2;
    public bool IsActive { get; set; } = true;
}
