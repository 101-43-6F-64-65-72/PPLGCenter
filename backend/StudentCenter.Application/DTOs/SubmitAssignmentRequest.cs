using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class SubmitAssignmentRequest
{
    [Required(ErrorMessage = "File URL is required.")]
    [MaxLength(500, ErrorMessage = "File URL cannot exceed 500 characters.")]
    public string FileUrl { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters.")]
    public string? Notes { get; set; }
}
