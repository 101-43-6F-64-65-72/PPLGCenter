namespace StudentCenter.Domain.Entities;

public class BookManager
{
    public Guid Id { get; set; }
    public string? BookCategory { get; set; } // Null = All Categories
    public Guid ManagerUserId { get; set; }
    public User ManagerUser { get; set; } = null!;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
