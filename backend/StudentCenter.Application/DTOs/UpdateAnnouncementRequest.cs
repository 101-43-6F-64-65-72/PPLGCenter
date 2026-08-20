using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class UpdateAnnouncementRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Content is required.")]
    public string Content { get; set; } = string.Empty;

    public string Category { get; set; } = "General";

    public string? TargetClasses { get; set; }

    public DateTime? PublishStart { get; set; }

    public DateTime? PublishEnd { get; set; }

    [MaxLength(500, ErrorMessage = "Cover Image URL cannot exceed 500 characters.")]
    public string? CoverImageUrl { get; set; }

    public bool IsPinned { get; set; }
}
