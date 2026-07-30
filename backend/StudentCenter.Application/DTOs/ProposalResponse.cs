using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class ProposalResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public ProposalStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public string SubmittedByUserName { get; set; } = string.Empty;
    public Guid? ReviewedByUserId { get; set; }
    public string? ReviewedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
