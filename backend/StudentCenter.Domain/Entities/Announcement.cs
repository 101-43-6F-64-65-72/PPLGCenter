namespace StudentCenter.Domain.Entities;

public class Announcement
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? TargetClasses { get; set; } // Comma-separated class names e.g. "X PPLG A, XI PPLG A" or "Semua Kelas"
    public DateTime? PublishStart { get; set; }
    public DateTime? PublishEnd { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsPinned { get; set; }
    public bool IsCommentsLocked { get; set; }
    public bool IsShowcase { get; set; }
    public int ShowcaseOrder { get; set; }
    public string? CustomCtaText { get; set; }
    public string? CustomCtaUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public ICollection<AnnouncementComment> Comments { get; set; } = new List<AnnouncementComment>();
    public ICollection<AnnouncementReaction> Reactions { get; set; } = new List<AnnouncementReaction>();
}
