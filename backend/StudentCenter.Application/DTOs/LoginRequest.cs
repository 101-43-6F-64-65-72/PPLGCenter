using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class LoginRequest
{
    [Required(ErrorMessage = "Email/Identifier is required.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}
