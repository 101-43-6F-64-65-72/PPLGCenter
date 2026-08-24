using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? EmailNotif { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public string? Username { get; set; }
    public string? NIS { get; set; }
    public string? NISN { get; set; }
    public string? NIP { get; set; }
    public string? PhoneNumber { get; set; }
    public string? PhotoUrl { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // ── Student-specific ───────────────────────────────────────────────────────
    /// <summary>FK to SchoolClass. Required for Students.</summary>
    public Guid? ClassId { get; set; }
    public SchoolClass? Class { get; set; }

    /// <summary>Nomor absen / student number within the class.</summary>
    public int? StudentNumber { get; set; }

    public string? Gender { get; set; }          // "Male" | "Female"
    public DateTime? BirthDate { get; set; }
    public string? Address { get; set; }

    // ── Teacher-specific ───────────────────────────────────────────────────────
    /// <summary>Position / jabatan (e.g. Wali Kelas, Waka Kesiswaan).</summary>
    public string? Position { get; set; }

    // ── Navigation ─────────────────────────────────────────────────────────────
    public ICollection<ExtracurricularMember> Memberships { get; set; } = new List<ExtracurricularMember>();
    public ICollection<ExtracurricularAdvisor> AdvisorExtracurriculars { get; set; } = new List<ExtracurricularAdvisor>();

    // ── PPLG Center Navigation ──────────────────────────────────────────────────
    public StudentProfile? StudentProfile { get; set; }
    public ICollection<UserPermission> CustomPermissions { get; set; } = new List<UserPermission>();
}
