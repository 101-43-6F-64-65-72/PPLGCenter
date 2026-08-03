using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class UpdateAttendanceRequest
{
    [Required(ErrorMessage = "Status is required")]
    public AttendanceStatus Status { get; set; }

    [StringLength(1000, ErrorMessage = "Notes must not exceed 1000 characters")]
    public string? Notes { get; set; }
}
