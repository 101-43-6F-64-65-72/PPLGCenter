using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class ReviewProposalRequest
{
    [Required(ErrorMessage = "Status is required")]
    public ProposalStatus Status { get; set; }

    [StringLength(1000, ErrorMessage = "RejectionReason must not exceed 1000 characters")]
    public string? RejectionReason { get; set; }
}
