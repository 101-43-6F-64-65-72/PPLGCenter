using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateFacilityRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Location is required.")]
    [MaxLength(200, ErrorMessage = "Location cannot exceed 200 characters.")]
    public string Location { get; set; } = string.Empty;

    [Required(ErrorMessage = "Capacity is required.")]
    [Range(1, 10000, ErrorMessage = "Capacity must be between 1 and 10000.")]
    public int Capacity { get; set; }

    [MaxLength(500, ErrorMessage = "ImageUrl cannot exceed 500 characters.")]
    public string? ImageUrl { get; set; }

    [MaxLength(100, ErrorMessage = "Category cannot exceed 100 characters.")]
    public string? Category { get; set; }

    public bool IsActive { get; set; } = true;
}
