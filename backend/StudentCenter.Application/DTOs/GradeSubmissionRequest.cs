using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class GradeSubmissionRequest
{
    [Required(ErrorMessage = "Score is required.")]
    [Range(0, 1000, ErrorMessage = "Score must be between 0 and 1000.")]
    public int Score { get; set; }

    [MaxLength(2000, ErrorMessage = "Feedback cannot exceed 2000 characters.")]
    public string? Feedback { get; set; }
}
