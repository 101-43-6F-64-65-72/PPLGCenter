namespace StudentCenter.Domain.Entities;

public class AnnouncementComment
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid AnnouncementId { get; set; }
    public Announcement Announcement { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
