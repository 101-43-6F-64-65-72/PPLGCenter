using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class StudentProfileResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string NIS { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public string? Bio { get; set; }
    public string? SkillsJson { get; set; }
    public string? TechStackJson { get; set; }
    public string? SocialLinksJson { get; set; }
    public ProfileVisibility Visibility { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<StudentProjectResponse> Projects { get; set; } = new();
}

public class UpdateStudentProfileRequest
{
    public string? Bio { get; set; }
    public string? SkillsJson { get; set; }
    public string? TechStackJson { get; set; }
    public string? SocialLinksJson { get; set; }
    public ProfileVisibility Visibility { get; set; } = ProfileVisibility.PUBLIC;
}

public class StudentProjectResponse
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? TechStackJson { get; set; }
    public string? GithubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StudentProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? TechStackJson { get; set; }
    public string? GithubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? ImageUrl { get; set; }
}
