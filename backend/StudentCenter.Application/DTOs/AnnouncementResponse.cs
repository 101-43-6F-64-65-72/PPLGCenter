namespace StudentCenter.Application.DTOs;

public class AnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? TargetClasses { get; set; }
    public DateTime? PublishStart { get; set; }
    public DateTime? PublishEnd { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsPinned { get; set; }
    public bool IsShowcase { get; set; }
    public int ShowcaseOrder { get; set; }
    public string? CustomCtaText { get; set; }
    public string? CustomCtaUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public int ReactionCount { get; set; }
    public int CommentCount { get; set; }
}
