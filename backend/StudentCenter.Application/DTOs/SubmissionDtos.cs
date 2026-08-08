using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class SubmissionResponse
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNis { get; set; } = string.Empty;
    public int LatestVersion { get; set; }
    public DateTime SubmittedAt { get; set; }
    public bool IsLate { get; set; }
    public double? Score { get; set; }
    public string? Feedback { get; set; }
    public DateTime? GradedAt { get; set; }
    public List<SubmissionRevisionResponse> Revisions { get; set; } = new();
}

public class SubmissionRevisionResponse
{
    public Guid Id { get; set; }
    public int Version { get; set; }
    public string SubmissionType { get; set; } = string.Empty; // TEXT | FILE | LINK
    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSubmissionRequest
{
    [Required(ErrorMessage = "AssignmentId is required.")]
    public Guid AssignmentId { get; set; }

    [Required(ErrorMessage = "SubmissionType is required.")]
    public string SubmissionType { get; set; } = "FILE"; // TEXT | FILE | LINK

    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string? Comment { get; set; }
}

public class GradeSubmissionRequest
{
    [Range(0, 1000, ErrorMessage = "Score must be between 0 and MaxScore.")]
    public double Score { get; set; }

    [MaxLength(2000)]
    public string? Feedback { get; set; }
}
