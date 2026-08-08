namespace StudentCenter.Domain.Entities;

public class Extracurricular
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Category { get; set; } = string.Empty;
    public int MaxMembers { get; set; }

    public int MaximumMembers
    {
        get => MaxMembers;
        set => MaxMembers = value;
    }

    public string? ScheduleDay { get; set; }
    public string? Day
    {
        get => ScheduleDay;
        set => ScheduleDay = value;
    }

    public string? ScheduleTime { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }

    public string? Location { get; set; }
    public string? AdvisorName { get; set; }
    public string? CoachName
    {
        get => AdvisorName;
        set => AdvisorName = value;
    }

    public string? AdvisorWhatsapp { get; set; }
    public string? CoachPhoneNumber
    {
        get => AdvisorWhatsapp;
        set => AdvisorWhatsapp = value;
    }

    public bool IsActive { get; set; } = true;
    public bool RegistrationOpen { get; set; } = true;

    public Guid ManagedByUserId { get; set; }
    public User ManagedByUser { get; set; } = null!;
    public Guid? SupervisorTeacherId { get; set; }
    public User? SupervisorTeacher { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ExtracurricularMember> Members { get; set; } = new List<ExtracurricularMember>();
    public ICollection<ExtracurricularAdvisor> Advisors { get; set; } = new List<ExtracurricularAdvisor>();
}
