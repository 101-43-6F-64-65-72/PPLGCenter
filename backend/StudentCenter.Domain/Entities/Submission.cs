namespace StudentCenter.Domain.Entities;

public class Submission
{
    public Guid Id { get; set; }

    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public int LatestVersion { get; set; } = 1;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public double? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Backward Compatibility Properties
    public string FileUrl { get => Revisions.OrderByDescending(r => r.Version).FirstOrDefault()?.FileUrl ?? string.Empty; set { } }
    public string? Notes { get => Revisions.OrderByDescending(r => r.Version).FirstOrDefault()?.Comment; set { } }

    // Navigation
    public ICollection<SubmissionRevision> Revisions { get; set; } = new List<SubmissionRevision>();
}
