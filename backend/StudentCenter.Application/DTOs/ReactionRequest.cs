using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class ReactionRequest
{
    [Required(ErrorMessage = "Reaction type is required.")]
    [MaxLength(50, ErrorMessage = "Reaction type cannot exceed 50 characters.")]
    public string Type { get; set; } = string.Empty;
}
