using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateAssignmentRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Subject is required.")]
    [MaxLength(100, ErrorMessage = "Subject cannot exceed 100 characters.")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Grade is required.")]
    [MaxLength(50, ErrorMessage = "Grade cannot exceed 50 characters.")]
    public string Grade { get; set; } = string.Empty;

    [Required(ErrorMessage = "Due date is required.")]
    public DateTime DueDate { get; set; }

    [Required(ErrorMessage = "Max score is required.")]
    [Range(1, 1000, ErrorMessage = "Max score must be between 1 and 1000.")]
    public int MaxScore { get; set; }
}
