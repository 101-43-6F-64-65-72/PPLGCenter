using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class ScheduleResponse
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public Guid SemesterId { get; set; }
    public string SemesterName { get; set; } = string.Empty;
    public string AcademicYearName { get; set; } = string.Empty;
    public int DayOfWeek { get; set; } // 1 = Monday .. 7 = Sunday
    public string DayName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty; // "HH:mm"
    public string EndTime { get; set; } = string.Empty;   // "HH:mm"
    public string Room { get; set; } = string.Empty;
    public string? Color { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateScheduleRequest
{
    [Required(ErrorMessage = "ClassSubjectId is required.")]
    public Guid ClassSubjectId { get; set; }

    [Required(ErrorMessage = "SemesterId is required.")]
    public Guid SemesterId { get; set; }

    [Range(1, 7, ErrorMessage = "DayOfWeek must be between 1 (Monday) and 7 (Sunday).")]
    public int DayOfWeek { get; set; }

    [Required(ErrorMessage = "StartTime is required.")]
    [RegularExpression(@"^([01]\d|2[0-3]):([0-5]\d)$", ErrorMessage = "StartTime must be in HH:mm format.")]
    public string StartTime { get; set; } = string.Empty; // "07:00"

    [Required(ErrorMessage = "EndTime is required.")]
    [RegularExpression(@"^([01]\d|2[0-3]):([0-5]\d)$", ErrorMessage = "EndTime must be in HH:mm format.")]
    public string EndTime { get; set; } = string.Empty;   // "08:30"

    [Required(ErrorMessage = "Room is required.")]
    [MaxLength(100)]
    public string Room { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Color { get; set; } = "#2c1ee8";

    public bool IsActive { get; set; } = true;
}

public class UpdateScheduleRequest
{
    [Required(ErrorMessage = "ClassSubjectId is required.")]
    public Guid ClassSubjectId { get; set; }

    [Required(ErrorMessage = "SemesterId is required.")]
    public Guid SemesterId { get; set; }

    [Range(1, 7, ErrorMessage = "DayOfWeek must be between 1 (Monday) and 7 (Sunday).")]
    public int DayOfWeek { get; set; }

    [Required(ErrorMessage = "StartTime is required.")]
    [RegularExpression(@"^([01]\d|2[0-3]):([0-5]\d)$", ErrorMessage = "StartTime must be in HH:mm format.")]
    public string StartTime { get; set; } = string.Empty;

    [Required(ErrorMessage = "EndTime is required.")]
    [RegularExpression(@"^([01]\d|2[0-3]):([0-5]\d)$", ErrorMessage = "EndTime must be in HH:mm format.")]
    public string EndTime { get; set; } = string.Empty;

    [Required(ErrorMessage = "Room is required.")]
    [MaxLength(100)]
    public string Room { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Color { get; set; }

    public bool IsActive { get; set; } = true;
}
