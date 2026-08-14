namespace StudentCenter.Domain.Entities;

public class AnnouncementComment
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    
    public Guid AnnouncementId { get; set; }
    public Announcement Announcement { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? ParentCommentId { get; set; }
    public AnnouncementComment? ParentComment { get; set; }
    public ICollection<AnnouncementComment> ChildComments { get; set; } = new List<AnnouncementComment>();

    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
