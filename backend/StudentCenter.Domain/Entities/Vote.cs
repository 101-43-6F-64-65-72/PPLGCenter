namespace StudentCenter.Domain.Entities;

public class Vote
{
    public Guid Id { get; set; }

    public Guid ElectionId { get; set; }
    public Election Election { get; set; } = null!;

    public Guid CandidateId { get; set; }
    public ElectionCandidate Candidate { get; set; } = null!;

    public Guid VoterUserId { get; set; }
    public User VoterUser { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
