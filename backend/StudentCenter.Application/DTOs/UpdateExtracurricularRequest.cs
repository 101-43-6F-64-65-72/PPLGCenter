using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class UpdateExtracurricularRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 200 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    public string Description { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "ImageUrl must not exceed 500 characters")]
    public string? ImageUrl { get; set; }

    [Required(ErrorMessage = "Category is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Category must be between 3 and 100 characters")]
    public string Category { get; set; } = string.Empty;

    [Required(ErrorMessage = "MaxMembers is required")]
    [Range(1, 1000, ErrorMessage = "MaxMembers must be between 1 and 1000")]
    public int MaxMembers { get; set; }

    [StringLength(50, ErrorMessage = "ScheduleDay must not exceed 50 characters")]
    public string? ScheduleDay { get; set; }

    [StringLength(100, ErrorMessage = "ScheduleTime must not exceed 100 characters")]
    public string? ScheduleTime { get; set; }

    [StringLength(200, ErrorMessage = "Location must not exceed 200 characters")]
    public string? Location { get; set; }

    public Guid? SupervisorTeacherId { get; set; }

    [StringLength(200, ErrorMessage = "AdvisorName must not exceed 200 characters")]
    public string? AdvisorName { get; set; }

    [StringLength(50, ErrorMessage = "AdvisorWhatsapp must not exceed 50 characters")]
    public string? AdvisorWhatsapp { get; set; }

    [Required(ErrorMessage = "IsActive is required")]
    public bool IsActive { get; set; }
}
