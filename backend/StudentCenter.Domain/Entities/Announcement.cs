namespace StudentCenter.Domain.Entities;

public class Announcement
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public bool IsPinned { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public ICollection<AnnouncementComment> Comments { get; set; } = new List<AnnouncementComment>();
    public ICollection<AnnouncementReaction> Reactions { get; set; } = new List<AnnouncementReaction>();
}
