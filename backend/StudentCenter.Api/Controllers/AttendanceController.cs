using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetAllSessions([FromQuery] Guid? scheduleId, [FromQuery] Guid? classSubjectId, [FromQuery] DateTime? date, [FromQuery] string? status)
    {
        var sessions = await _attendanceService.GetAllSessionsAsync(scheduleId, classSubjectId, date, status);
        return Ok(ApiResponse<List<AttendanceSessionResponse>>.SuccessResponse(sessions));
    }

    [HttpGet("sessions/{id:guid}")]
    public async Task<IActionResult> GetSessionById(Guid id)
    {
        var session = await _attendanceService.GetSessionByIdAsync(id);
        if (session == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

        return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session));
    }

    [HttpPost("sessions")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateSession([FromBody] CreateAttendanceSessionRequest request)
    {
        var teacherId = GetCurrentUserId();
        var session = await _attendanceService.CreateSessionAsync(teacherId, request);
        return CreatedAtAction(nameof(GetSessionById), new { id = session.Id }, ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Attendance session opened successfully."));
    }

    [HttpPut("sessions/{id:guid}/records")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> UpdateStudentStatus(Guid id, [FromBody] UpdateAttendanceStatusRequest request)
    {
        var teacherId = GetCurrentUserId();
        var session = await _attendanceService.UpdateStudentStatusAsync(id, teacherId, request);
        if (session == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

        return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Student attendance updated successfully."));
    }

    [HttpPut("sessions/{id:guid}/bulk")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> BulkUpdate(Guid id, [FromBody] BulkUpdateAttendanceRequest request)
    {
        var teacherId = GetCurrentUserId();
        var session = await _attendanceService.BulkUpdateAttendanceAsync(id, teacherId, request);
        if (session == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

        return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Attendance records updated in bulk successfully."));
    }

    [HttpPost("sessions/{id:guid}/close")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CloseSession(Guid id)
    {
        var teacherId = GetCurrentUserId();
        var session = await _attendanceService.CloseSessionAsync(id, teacherId);
        if (session == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

        return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Attendance session closed successfully."));
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyAttendanceHistory()
    {
        var studentId = GetCurrentUserId();
        var history = await _attendanceService.GetStudentAttendanceHistoryAsync(studentId);
        return Ok(ApiResponse<List<AttendanceRecordResponse>>.SuccessResponse(history));
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
