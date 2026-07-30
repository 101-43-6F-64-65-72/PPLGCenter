namespace StudentCenter.Application.DTOs;

public class SubmissionResponse
{
    public Guid Id { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? GradedAt { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
}
