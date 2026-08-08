using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class AttendanceSessionResponse
{
    public Guid Id { get; set; }
    public Guid ScheduleId { get; set; }
    public Guid ClassSubjectId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public Guid SemesterId { get; set; }
    public int SessionNumber { get; set; }
    public DateTime Date { get; set; }
    public DateTime? OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string Status { get; set; } = string.Empty; // Open | Closed
    public int TotalStudents { get; set; }
    public int PresentCount { get; set; }
    public int LateCount { get; set; }
    public int PermissionCount { get; set; }
    public int SickCount { get; set; }
    public int AlphaCount { get; set; }
    public int NotMarkedCount { get; set; }
    public List<AttendanceRecordResponse> Attendances { get; set; } = new();
}

public class AttendanceRecordResponse
{
    public Guid Id { get; set; }
    public Guid AttendanceSessionId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNis { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? CheckInTime { get; set; }
    public string? Notes { get; set; }
}

public class CreateAttendanceSessionRequest
{
    [Required(ErrorMessage = "ScheduleId is required.")]
    public Guid ScheduleId { get; set; }

    [Required(ErrorMessage = "Date is required.")]
    public DateTime Date { get; set; }

    public int SessionNumber { get; set; } = 1;
}

public class UpdateAttendanceStatusRequest
{
    [Required(ErrorMessage = "StudentId is required.")]
    public Guid StudentId { get; set; }

    [Required(ErrorMessage = "Status is required.")]
    public AttendanceStatus Status { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class BulkUpdateAttendanceRequest
{
    [Required]
    public List<UpdateAttendanceStatusRequest> Records { get; set; } = new();
}
