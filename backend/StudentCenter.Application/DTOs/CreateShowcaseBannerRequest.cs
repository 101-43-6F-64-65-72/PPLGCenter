using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateShowcaseBannerRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? LinkUrl { get; set; }

    [MaxLength(100)]
    public string? ButtonText { get; set; }

    public Guid? AnnouncementId { get; set; }

    public int Order { get; set; } = 1;

    public bool IsActive { get; set; } = true;
}
