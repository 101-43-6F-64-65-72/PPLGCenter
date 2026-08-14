using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

/// <summary>
/// Request model for creating an announcement.
/// </summary>
public class CreateAnnouncementRequest
{
    /// <summary>
    /// The announcement title.
    /// </summary>
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// The announcement content.
    /// </summary>
    [Required(ErrorMessage = "Content is required.")]
    [MaxLength(5000, ErrorMessage = "Content cannot exceed 5000 characters.")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// The announcement category.
    /// </summary>
    [Required(ErrorMessage = "Category is required.")]
    [MaxLength(100, ErrorMessage = "Category cannot exceed 100 characters.")]
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// The cover image URL.
    /// </summary>
    [MaxLength(500, ErrorMessage = "Cover Image URL cannot exceed 500 characters.")]
    [Url(ErrorMessage = "Cover Image URL must be a valid URL.")]
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// Indicates if the announcement is pinned.
    /// </summary>
    public bool IsPinned { get; set; }
}
