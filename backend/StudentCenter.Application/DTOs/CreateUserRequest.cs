using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CreateUserRequest
{
    [Required(ErrorMessage = "Full Name is required.")]
    [MaxLength(200, ErrorMessage = "Full Name cannot exceed 200 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [MaxLength(256, ErrorMessage = "Email cannot exceed 256 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required.")]
    public UserRole Role { get; set; }
}
