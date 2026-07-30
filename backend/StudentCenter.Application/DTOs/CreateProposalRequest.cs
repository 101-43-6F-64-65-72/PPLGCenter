using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateProposalRequest
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(300, MinimumLength = 5, ErrorMessage = "Title must be between 5 and 300 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 2000 characters")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "FileUrl is required")]
    [StringLength(500, ErrorMessage = "FileUrl must not exceed 500 characters")]
    public string FileUrl { get; set; } = string.Empty;
}
