using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class CandidatePair
{
    public Guid Id { get; set; }

    public Guid ElectionId { get; set; }
    public Election Election { get; set; } = null!;

    public int CandidateNumber { get; set; }

    // Chairman Candidate
    public Guid ChairmanUserId { get; set; }
    public User ChairmanUser { get; set; } = null!;

    // Vice Chairman Candidate (Nullable while searching for partner)
    public Guid? ViceUserId { get; set; }
    public User? ViceUser { get; set; }

    public string Vision { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string Programs { get; set; } = string.Empty;

    public string? ViceVision { get; set; }
    public string? ViceMission { get; set; }

    public string? PhotoUrl { get; set; }
    public string? VicePhotoUrl { get; set; }

    public CandidatePairStatus Status { get; set; } = CandidatePairStatus.WaitingVice;
    public string? RejectionReason { get; set; }

    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CandidatePairVote> Votes { get; set; } = new List<CandidatePairVote>();
}
