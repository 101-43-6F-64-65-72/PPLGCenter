using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CreateNotificationRequest
{
    [Required(ErrorMessage = "User ID is required.")]
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Message is required.")]
    [MaxLength(1000, ErrorMessage = "Message cannot exceed 1000 characters.")]
    public string Message { get; set; } = string.Empty;

    [Required(ErrorMessage = "Notification type is required.")]
    public NotificationType Type { get; set; }

    [MaxLength(100, ErrorMessage = "Reference ID cannot exceed 100 characters.")]
    public string? ReferenceId { get; set; }

    [MaxLength(100, ErrorMessage = "Reference type cannot exceed 100 characters.")]
    public string? ReferenceType { get; set; }
}
