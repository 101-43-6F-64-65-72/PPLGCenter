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
    public string Category { get; set; } = "General";

    /// <summary>
    /// Target classes comma-separated string e.g. "X PPLG A, XI PPLG A" or "Semua Kelas".
    /// </summary>
    public string? TargetClasses { get; set; }

    /// <summary>
    /// Publish start date and time.
    /// </summary>
    public DateTime? PublishStart { get; set; }

    /// <summary>
    /// Publish end date and time.
    /// </summary>
    public DateTime? PublishEnd { get; set; }

    /// <summary>
    /// The cover image URL.
    /// </summary>
    [MaxLength(500, ErrorMessage = "Cover Image URL cannot exceed 500 characters.")]
    public string? CoverImageUrl { get; set; }

    /// <summary>
    /// Indicates if the announcement is pinned.
    /// </summary>
    public bool IsPinned { get; set; }

    /// <summary>
    /// Indicates if the announcement is displayed on the main showcase slider.
    /// </summary>
    public bool IsShowcase { get; set; }

    /// <summary>
    /// Order index in the showcase slider.
    /// </summary>
    public int ShowcaseOrder { get; set; }

    /// <summary>
    /// Custom call-to-action button text (optional).
    /// </summary>
    [MaxLength(100, ErrorMessage = "Custom CTA text cannot exceed 100 characters.")]
    public string? CustomCtaText { get; set; }

    /// <summary>
    /// Custom call-to-action destination URL (optional).
    /// </summary>
    [MaxLength(500, ErrorMessage = "Custom CTA URL cannot exceed 500 characters.")]
    public string? CustomCtaUrl { get; set; }
}
