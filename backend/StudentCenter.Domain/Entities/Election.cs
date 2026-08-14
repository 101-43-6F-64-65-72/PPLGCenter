using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Election
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public ElectionStatus Status { get; set; } = ElectionStatus.Draft;
    public string? CabinetStructureJson { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public ICollection<ElectionCandidate> Candidates { get; set; } = new List<ElectionCandidate>();
    public ICollection<Vote> Votes { get; set; } = new List<Vote>();
}
