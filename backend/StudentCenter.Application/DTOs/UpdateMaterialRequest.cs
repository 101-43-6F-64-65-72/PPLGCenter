using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class UpdateMaterialRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "File URL is required.")]
    [MaxLength(500, ErrorMessage = "File URL cannot exceed 500 characters.")]
    public string FileUrl { get; set; } = string.Empty;

    [Required(ErrorMessage = "Subject is required.")]
    [MaxLength(100, ErrorMessage = "Subject cannot exceed 100 characters.")]
    public string Subject { get; set; } = string.Empty;

    [Required(ErrorMessage = "Grade is required.")]
    [MaxLength(50, ErrorMessage = "Grade cannot exceed 50 characters.")]
    public string Grade { get; set; } = string.Empty;
}
