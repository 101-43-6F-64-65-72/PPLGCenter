using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class BookingResponse
{
    public Guid Id { get; set; }
    public Guid FacilityId { get; set; }
    public string FacilityName { get; set; } = string.Empty;
    public Guid BookedByUserId { get; set; }
    public string BookedByUserName { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public BookingStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? ApprovedOrRejectedByUserId { get; set; }
    public string? ApprovedOrRejectedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
