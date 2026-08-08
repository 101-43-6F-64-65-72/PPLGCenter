namespace StudentCenter.Domain.Entities;

public class ConversationMember
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; }

    public Guid CreatedByUserId { get; set; }
    public Guid? UpdatedByUserId { get; set; }
    public Guid? DeletedByUserId { get; set; }
}
