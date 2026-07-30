using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateBookingRequest : IValidatableObject
{
    [Required(ErrorMessage = "Facility ID is required.")]
    public Guid FacilityId { get; set; }

    [Required(ErrorMessage = "Purpose is required.")]
    [MaxLength(500, ErrorMessage = "Purpose cannot exceed 500 characters.")]
    public string Purpose { get; set; } = string.Empty;

    [Required(ErrorMessage = "Start time is required.")]
    public DateTime StartTime { get; set; }

    [Required(ErrorMessage = "End time is required.")]
    public DateTime EndTime { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndTime <= StartTime)
        {
            yield return new ValidationResult(
                "End time must be greater than start time.",
                new[] { nameof(EndTime) });
        }

        if (StartTime < DateTime.UtcNow)
        {
            yield return new ValidationResult(
                "Booking start time cannot be in the past.",
                new[] { nameof(StartTime) });
        }
    }
}
