namespace StudentCenter.Domain.Entities;

public class StudentProject
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public StudentProfile StudentProfile { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? TechStackJson { get; set; }
    public string? GithubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? ImageUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
