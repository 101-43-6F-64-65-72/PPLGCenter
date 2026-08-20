namespace StudentCenter.Application.DTOs;

public class AnnouncementFeedResponse
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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public int ReactionCount { get; set; }
    public int CommentCount { get; set; }
    public List<CommentResponse> LatestComments { get; set; } = new();
}
