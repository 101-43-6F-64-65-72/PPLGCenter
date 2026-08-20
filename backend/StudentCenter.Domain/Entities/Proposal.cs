using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Proposal
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Category { get; set; }
    public Guid? ExtracurricularId { get; set; }
    public Extracurricular? Extracurricular { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    
    // Alias for AttachmentUrl
    public string AttachmentUrl
    {
        get => FileUrl;
        set => FileUrl = value;
    }

    public ProposalStatus Status { get; set; } = ProposalStatus.Pending;

    public string? TeacherComment { get; set; }
    public string? AdminComment { get; set; }

    // RejectionReason getter/setter for backward compatibility
    public string? RejectionReason
    {
        get => AdminComment ?? TeacherComment;
        set { AdminComment = value; TeacherComment = value; }
    }

    public Guid SubmittedByUserId { get; set; }
    public User SubmittedByUser { get; set; } = null!;

    // Alias for StudentId
    public Guid StudentId
    {
        get => SubmittedByUserId;
        set => SubmittedByUserId = value;
    }

    public Guid? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }

    // Alias for SubmittedAt
    public DateTime SubmittedAt
    {
        get => CreatedAt;
        set => CreatedAt = value;
    }
}
