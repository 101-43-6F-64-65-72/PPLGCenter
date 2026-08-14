namespace StudentCenter.Domain.Entities;

public class MessageAttachment
{
    public Guid Id { get; set; }

    public Guid MessageId { get; set; }
    public Message Message { get; set; } = null!;

    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StorageProvider { get; set; } = "Local";
    public string Url { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
