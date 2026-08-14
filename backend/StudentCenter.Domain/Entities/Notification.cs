using System.ComponentModel.DataAnnotations.Schema;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    
    [NotMapped]
    public string Message 
    { 
        get => Body; 
        set => Body = value; 
    }

    public NotificationType Type { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    
    public string? ReferenceId { get; set; }
    public NotificationReferenceType ReferenceType { get; set; } = NotificationReferenceType.None;
    
    public string? ActionUrl { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public string? Metadata { get; set; } // stored as jsonb

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
