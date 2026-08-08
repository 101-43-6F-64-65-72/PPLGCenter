namespace StudentCenter.Domain.Entities;

public class DiscussionThread
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public ClassSubject ClassSubject { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public bool IsLocked { get; set; }

    public int ReplyCount { get; set; }
    public DateTime? LastReplyAt { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<DiscussionReply> Replies { get; set; } = new List<DiscussionReply>();
}
