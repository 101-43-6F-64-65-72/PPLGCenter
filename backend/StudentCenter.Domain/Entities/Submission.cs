namespace StudentCenter.Domain.Entities;

public class Submission
{
    public Guid Id { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
}
