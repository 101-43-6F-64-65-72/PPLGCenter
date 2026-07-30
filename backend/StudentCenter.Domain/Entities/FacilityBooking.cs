using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class FacilityBooking
{
    public Guid Id { get; set; }
    public Guid FacilityId { get; set; }
    public Facility Facility { get; set; } = null!;
    public Guid BookedByUserId { get; set; }
    public User BookedByUser { get; set; } = null!;
    public string Purpose { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public BookingStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? ApprovedOrRejectedByUserId { get; set; }
    public User? ApprovedOrRejectedByUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
