using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CreateAttendanceRequest
{
    [Required(ErrorMessage = "StudentId is required")]
    public Guid StudentId { get; set; }

    [Required(ErrorMessage = "AttendanceDate is required")]
    public DateTime AttendanceDate { get; set; }

    [Required(ErrorMessage = "Status is required")]
    public AttendanceStatus Status { get; set; }

    [StringLength(1000, ErrorMessage = "Notes must not exceed 1000 characters")]
    public string? Notes { get; set; }
}
