using System.ComponentModel.DataAnnotations;
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
        var (userId, userRole) = GetCurrentIdentity();
        var sessions = await _attendanceService.GetAllSessionsAsync(userId, userRole, scheduleId, classSubjectId, date, status);
        return Ok(ApiResponse<List<AttendanceSessionResponse>>.SuccessResponse(sessions));
    }

    [HttpGet("sessions/{id:guid}")]
    public async Task<IActionResult> GetSessionById(Guid id)
    {
        var (userId, userRole) = GetCurrentIdentity();
        try
        {
            var session = await _attendanceService.GetSessionByIdAsync(id, userId, userRole);
            if (session == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

            return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("sessions")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CreateSession([FromBody] CreateAttendanceSessionRequest request)
    {
        var (teacherId, _) = GetCurrentIdentity();
        try
        {
            var session = await _attendanceService.CreateSessionAsync(teacherId, request);
            return CreatedAtAction(nameof(GetSessionById), new { id = session.Id }, ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Attendance session opened successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("sessions/{id:guid}/records")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> UpdateStudentStatus(Guid id, [FromBody] UpdateAttendanceStatusRequest request)
    {
        var (teacherId, _) = GetCurrentIdentity();
        try
        {
            var session = await _attendanceService.UpdateStudentStatusAsync(id, teacherId, request);
            if (session == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

            return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Student attendance updated successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("sessions/{id:guid}/bulk")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> BulkUpdate(Guid id, [FromBody] BulkUpdateAttendanceRequest request)
    {
        var (teacherId, _) = GetCurrentIdentity();
        try
        {
            var session = await _attendanceService.BulkUpdateAttendanceAsync(id, teacherId, request);
            if (session == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

            return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Attendance records updated in bulk successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("sessions/{id:guid}/close")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> CloseSession(Guid id)
    {
        var (teacherId, _) = GetCurrentIdentity();
        try
        {
            var session = await _attendanceService.CloseSessionAsync(id, teacherId);
            if (session == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Attendance session not found."));

            return Ok(ApiResponse<AttendanceSessionResponse>.SuccessResponse(session, "Attendance session closed successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyAttendanceHistory()
    {
        var (studentId, _) = GetCurrentIdentity();
        var history = await _attendanceService.GetStudentAttendanceHistoryAsync(studentId);
        return Ok(ApiResponse<List<AttendanceRecordResponse>>.SuccessResponse(history));
    }

    private (Guid UserId, string UserRole) GetCurrentIdentity()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        var role = User.IsInRole("Student") ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        return (userId, role);
    }
}
