using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class OsisApplication
{
    public Guid Id { get; set; }

    public Guid OsisPositionId { get; set; }
    public OsisPosition OsisPosition { get; set; } = null!;

    public Guid ApplicantStudentId { get; set; }
    public User ApplicantStudent { get; set; } = null!;

    public string Motivation { get; set; } = string.Empty;
    public string? PortfolioUrl { get; set; }

    public RecruitmentApplicationStatus Status { get; set; } = RecruitmentApplicationStatus.Submitted;

    public string? TeacherReviewNotes { get; set; }
    public string? ChairmanNotes { get; set; }
    public string? AdminNotes { get; set; }

    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
