namespace StudentCenter.Domain.Entities;

public class CandidatePairVote
{
    public Guid Id { get; set; }

    public Guid ElectionId { get; set; }
    public Election Election { get; set; } = null!;

    public Guid CandidatePairId { get; set; }
    public CandidatePair CandidatePair { get; set; } = null!;

    public Guid VoterUserId { get; set; }
    public User VoterUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
