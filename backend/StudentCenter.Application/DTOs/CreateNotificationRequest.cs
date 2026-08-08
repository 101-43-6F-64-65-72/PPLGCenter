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

    public string Body { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Message cannot exceed 1000 characters.")]
    public string Message 
    { 
        get => string.IsNullOrEmpty(Body) ? _message : Body; 
        set 
        { 
            _message = value; 
            if (string.IsNullOrEmpty(Body)) Body = value; 
        } 
    }
    private string _message = string.Empty;

    [Required(ErrorMessage = "Notification type is required.")]
    public NotificationType Type { get; set; }

    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;

    [MaxLength(100, ErrorMessage = "Reference ID cannot exceed 100 characters.")]
    public string? ReferenceId { get; set; }

    public NotificationReferenceType ReferenceType { get; set; } = NotificationReferenceType.None;

    [MaxLength(500, ErrorMessage = "Action URL cannot exceed 500 characters.")]
    public string? ActionUrl { get; set; }

    [MaxLength(100, ErrorMessage = "Icon cannot exceed 100 characters.")]
    public string? Icon { get; set; }

    [MaxLength(50, ErrorMessage = "Color cannot exceed 50 characters.")]
    public string? Color { get; set; }

    public string? Metadata { get; set; }
}
