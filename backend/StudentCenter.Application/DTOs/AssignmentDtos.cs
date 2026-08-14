using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class AssignmentResponse
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public Guid? ScheduleId { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Attachment { get; set; }
    public DateTime PublishAt { get; set; }
    public DateTime DueDate { get; set; }
    public double MaxScore { get; set; }
    public bool AllowLateSubmission { get; set; }
    public double LatePenaltyPercent { get; set; }
    public int SubmissionCount { get; set; }
    public int GradedCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAssignmentRequest
{
    [Required(ErrorMessage = "ClassSubjectId is required.")]
    public Guid ClassSubjectId { get; set; }

    public Guid? ScheduleId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public string? Attachment { get; set; }

    public DateTime PublishAt { get; set; } = DateTime.UtcNow;

    [Required(ErrorMessage = "DueDate is required.")]
    public DateTime DueDate { get; set; }

    [Range(1, 1000, ErrorMessage = "MaxScore must be greater than 0.")]
    public double MaxScore { get; set; } = 100.0;

    public bool AllowLateSubmission { get; set; } = false;
    public double LatePenaltyPercent { get; set; } = 0.0;
}

public class UpdateAssignmentRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public string? Attachment { get; set; }

    public DateTime PublishAt { get; set; }

    [Required(ErrorMessage = "DueDate is required.")]
    public DateTime DueDate { get; set; }

    [Range(1, 1000, ErrorMessage = "MaxScore must be greater than 0.")]
    public double MaxScore { get; set; } = 100.0;

    public bool AllowLateSubmission { get; set; } = false;
    public double LatePenaltyPercent { get; set; } = 0.0;
}
