namespace StudentCenter.Application.DTOs;

public class SupervisorTeacherResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NIP { get; set; }
    public string? Email { get; set; }
    public string? PhotoUrl { get; set; }
    public string? PhoneNumber { get; set; }
}

public class ExtracurricularResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int MaxMembers { get; set; }
    public int CurrentMembers { get; set; }
    public string? ScheduleDay { get; set; }
    public string? ScheduleTime { get; set; }
    public string? Location { get; set; }
    public Guid? SupervisorTeacherId { get; set; }
    public SupervisorTeacherResponse? Supervisor { get; set; }
    public string? AdvisorName { get; set; }
    public string? AdvisorWhatsapp { get; set; }
    public bool IsActive { get; set; }
    public Guid ManagedByUserId { get; set; }
    public string ManagedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Lightweight summary of an extracurricular supervised by the current teacher.
/// Returned by GET /api/extracurriculars/supervised.
/// </summary>
public class SupervisedExtracurricularSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? ScheduleDay { get; set; }
    public string? ScheduleTime { get; set; }
    public string? Location { get; set; }
    /// <summary>Active member count (Status != "Removed")</summary>
    public int MemberCount { get; set; }
    /// <summary>Pending proposals whose Category matches this extracurricular's name</summary>
    public int PendingProposalsCount { get; set; }
    /// <summary>Proposals reviewed by this teacher for this extracurricular</summary>
    public int CompletedReviewCount { get; set; }
}
