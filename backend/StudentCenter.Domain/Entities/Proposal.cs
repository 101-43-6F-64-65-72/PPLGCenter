using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Proposal
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public ProposalStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public User SubmittedByUser { get; set; } = null!;
    public Guid? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
