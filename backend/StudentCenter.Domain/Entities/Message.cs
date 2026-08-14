using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Message
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;

    public MessageType MessageType { get; set; } = MessageType.Text;
    public string? Text { get; set; }

    public DateTime? ReadAt { get; set; }
    public DateTime? EditedAt { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
}
