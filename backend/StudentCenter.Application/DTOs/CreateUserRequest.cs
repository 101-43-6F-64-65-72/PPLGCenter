using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

/// <summary>
/// Request model for creating a new user.
/// </summary>
public class CreateUserRequest
{
    /// <summary>
    /// The user's full name.
    /// </summary>
    [Required(ErrorMessage = "Full Name is required.")]
    [MaxLength(200, ErrorMessage = "Full Name cannot exceed 200 characters.")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// The user's email address.
    /// </summary>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    [MaxLength(256, ErrorMessage = "Email cannot exceed 256 characters.")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100, ErrorMessage = "Username cannot exceed 100 characters.")]
    public string? Username { get; set; }

    [MaxLength(50, ErrorMessage = "NIS cannot exceed 50 characters.")]
    public string? NIS { get; set; }

    [MaxLength(50, ErrorMessage = "NISN cannot exceed 50 characters.")]
    public string? NISN { get; set; }

    [MaxLength(50, ErrorMessage = "NIP cannot exceed 50 characters.")]
    public string? NIP { get; set; }

    [MaxLength(50, ErrorMessage = "Phone Number cannot exceed 50 characters.")]
    public string? PhoneNumber { get; set; }

    [MaxLength(500, ErrorMessage = "Photo URL cannot exceed 500 characters.")]
    public string? PhotoUrl { get; set; }

    public Guid? ClassId { get; set; }
    public int? StudentNumber { get; set; }

    [MaxLength(20)]
    public string? Gender { get; set; }

    public DateTime? BirthDate { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? Position { get; set; }

    /// <summary>
    /// The user's password.
    /// </summary>
    [Required(ErrorMessage = "Password is required.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// The user's role.
    /// </summary>
    [Required(ErrorMessage = "Role is required.")]
    public UserRole Role { get; set; }
}
