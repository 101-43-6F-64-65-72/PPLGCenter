namespace StudentCenter.Domain.Entities;

public class ElectionCandidate
{
    public Guid Id { get; set; }

    public Guid ElectionId { get; set; }
    public Election Election { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public string Vision { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }

    public int CandidateNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}
