using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Conversation
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public ConversationType Type { get; set; } = ConversationType.Direct;

    public Guid? LastMessageId { get; set; }
    public Message? LastMessage { get; set; }
    public DateTime LastActivityAt { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<ConversationMember> Members { get; set; } = new List<ConversationMember>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
