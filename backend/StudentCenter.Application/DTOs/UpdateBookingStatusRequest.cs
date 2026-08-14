using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class UpdateBookingStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    public BookingStatus Status { get; set; }

    [MaxLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters.")]
    public string? RejectionReason { get; set; }
}
