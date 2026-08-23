namespace StudentCenter.Domain.Entities;

public class GroupMessageReaction
{
    public Guid Id { get; set; }

    public Guid MessageId { get; set; }
    public GroupMessage Message { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string Emoji { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
