using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class ProposalResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Category { get; set; }
    public Guid? ExtracurricularId { get; set; }
    public string? ExtracurricularName { get; set; }
    public string FileUrl { get; set; } = string.Empty;

    public string AttachmentUrl
    {
        get => FileUrl;
        set => FileUrl = value;
    }

    public ProposalStatus Status { get; set; }

    public string? TeacherComment { get; set; }
    public string? AdminComment { get; set; }
    public string? RejectionReason { get; set; }

    public Guid SubmittedByUserId { get; set; }
    public Guid StudentId => SubmittedByUserId;
    public string SubmittedByUserName { get; set; } = string.Empty;

    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewedByUserName { get; set; }
    public string? ReviewedBy => ReviewedByUserName;

    public DateTime CreatedAt { get; set; }
    public DateTime SubmittedAt => CreatedAt;
    public DateTime UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
