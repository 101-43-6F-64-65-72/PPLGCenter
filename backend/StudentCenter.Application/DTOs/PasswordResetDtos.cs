using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CreatePasswordResetRequest
{
    [Required(ErrorMessage = "NIS/NISN/NIP/Email wajib diisi.")]
    public string Identifier { get; set; } = string.Empty;

    public string? FullName { get; set; }
    public string? Reason { get; set; }
}

public class CreatePasswordResetResponse
{
    public Guid RequestId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class PasswordResetRequestResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public string UserIdentifier { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public PasswordResetStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public string? Reason { get; set; }
    public string? AdminNotes { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsValidForReset { get; set; }
}

public class ReviewPasswordResetRequest
{
    public bool IsApproved { get; set; }
    public string? AdminNotes { get; set; }
}

public class ConfirmResetPasswordRequest
{
    [Required(ErrorMessage = "NIS/NISN/NIP/Email wajib diisi.")]
    public string Identifier { get; set; } = string.Empty;

    public Guid? RequestId { get; set; }

    [Required(ErrorMessage = "Password baru wajib diisi.")]
    [MinLength(6, ErrorMessage = "Password minimal 6 karakter.")]
    public string NewPassword { get; set; } = string.Empty;
}
