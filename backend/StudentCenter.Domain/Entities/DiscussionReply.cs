namespace StudentCenter.Domain.Entities;

public class DiscussionReply
{
    public Guid Id { get; set; }

    public Guid ThreadId { get; set; }
    public DiscussionThread Thread { get; set; } = null!;

    public Guid? ParentReplyId { get; set; }
    public DiscussionReply? ParentReply { get; set; }
    public ICollection<DiscussionReply> ChildReplies { get; set; } = new List<DiscussionReply>();

    public string Body { get; set; } = string.Empty;

    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentFileSize { get; set; }
    public string? StorageProvider { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
}
