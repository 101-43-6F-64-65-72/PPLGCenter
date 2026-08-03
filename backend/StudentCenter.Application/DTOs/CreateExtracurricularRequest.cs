using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateExtracurricularRequest
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
}
