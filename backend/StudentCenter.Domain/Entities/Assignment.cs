namespace StudentCenter.Domain.Entities;

public class Assignment
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public int MaxScore { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
