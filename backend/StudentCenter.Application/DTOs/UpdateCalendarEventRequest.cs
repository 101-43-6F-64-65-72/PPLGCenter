using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class UpdateCalendarEventRequest : IValidatableObject
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Start date is required.")]
    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    [Required(ErrorMessage = "End date is required.")]
    public DateTime EndDate { get; set; } = DateTime.UtcNow;

    public DateTime EventDate
    {
        get => StartDate;
        set { StartDate = value; EndDate = value; }
    }

    public string? StartTime { get; set; }
    public string? EndTime { get; set; }

    [MaxLength(200, ErrorMessage = "Location cannot exceed 200 characters.")]
    public string? Location { get; set; }

    [Required(ErrorMessage = "Category is required.")]
    [MaxLength(100, ErrorMessage = "Category cannot exceed 100 characters.")]
    public string Category { get; set; } = "Academic";

    public string? Color { get; set; }
    public string Visibility { get; set; } = "Public";

    public bool IsAllDay { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDate < StartDate)
        {
            yield return new ValidationResult(
                "End date must be greater than or equal to start date.",
                new[] { nameof(EndDate) });
        }
    }
}
