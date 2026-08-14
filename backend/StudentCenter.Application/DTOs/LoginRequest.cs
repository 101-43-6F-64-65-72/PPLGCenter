using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

/// <summary>
/// Request model for user login.
/// Supports Student (NIS/NISN), Teacher (NIP), and Admin (Email/Username).
/// </summary>
public class LoginRequest
{
    /// <summary>
    /// Login type: "Student", "Teacher", or "Admin".
    /// Determines which identity field is used for authentication.
    /// </summary>
    [MaxLength(50, ErrorMessage = "LoginType cannot exceed 50 characters.")]
    public string? LoginType { get; set; }

    /// <summary>
    /// Optional full name for soft validation/audit logging.
    /// Never used as the primary authentication credential.
    /// </summary>
    [MaxLength(200, ErrorMessage = "FullName cannot exceed 200 characters.")]
    public string? FullName { get; set; }

    /// <summary>
    /// The user's login identifier.
    /// Student: NIS or NISN | Teacher: NIP | Admin: Email or Username.
    /// </summary>
    [MaxLength(256, ErrorMessage = "Identifier cannot exceed 256 characters.")]
    public string? Identifier { get; set; }

    /// <summary>
    /// Backward-compatible email property (Admin only).
    /// </summary>
    [MaxLength(256, ErrorMessage = "Email cannot exceed 256 characters.")]
    public string? Email { get; set; }

    /// <summary>
    /// The user's password.
    /// </summary>
    [Required(ErrorMessage = "Password is required.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters.")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Gets the effective login identifier from Identifier or Email.
    /// </summary>
    public string GetEffectiveIdentifier()
    {
        if (!string.IsNullOrWhiteSpace(Identifier))
            return Identifier.Trim();

        if (!string.IsNullOrWhiteSpace(Email))
            return Email.Trim();

        return string.Empty;
    }
}
