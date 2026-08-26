using System;

namespace StudentCenter.Domain.Entities;

public class Feedback
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserIdentifier { get; set; } // NISN / NIP / Email
    public string? UserRole { get; set; } // Student, Teacher, Admin, Guest
    public string Category { get; set; } = "Fitur"; // Fitur, Bug, UI/UX, Apresiasi, Layanan, Lainnya
    public int Rating { get; set; } = 5; // 1 - 5
    public string Content { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; } = false;
    public string Status { get; set; } = "Pending"; // Pending, Reviewed, Resolved
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public virtual User? User { get; set; }
}
