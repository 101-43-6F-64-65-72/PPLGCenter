namespace StudentCenter.Application.DTOs;

public class ClassLeadershipResponse
{
    public Guid Id { get; set; }
    public Guid SchoolClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid HomeroomTeacherId { get; set; }
    public string HomeroomTeacherName { get; set; } = string.Empty;
    public Guid ClassLeaderStudentId { get; set; }
    public string ClassLeaderStudentName { get; set; } = string.Empty;
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public Guid AppointedByUserId { get; set; }
    public DateTime AppointedAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class AppointLeadershipRequest
{
    public Guid SchoolClassId { get; set; }
    public Guid HomeroomTeacherId { get; set; }
    public Guid ClassLeaderStudentId { get; set; }
    public Guid AcademicYearId { get; set; }
}
