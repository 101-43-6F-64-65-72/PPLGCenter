using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string? Bio { get; set; }
    public string? SkillsJson { get; set; } // JSON array of string tags
    public string? TechStackJson { get; set; } // JSON array of string tags
    public string? SocialLinksJson { get; set; } // JSON dictionary {github, linkedin, etc}

    public ProfileVisibility Visibility { get; set; } = ProfileVisibility.PUBLIC;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StudentProject> Projects { get; set; } = new List<StudentProject>();
}
