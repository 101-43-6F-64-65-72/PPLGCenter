namespace StudentCenter.Domain.Entities;

public class GroupMessageDeletedUser
{
    public Guid Id { get; set; }

    public Guid MessageId { get; set; }
    public GroupMessage Message { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime DeletedAt { get; set; } = DateTime.UtcNow;
}
