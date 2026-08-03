using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/attendance")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;
    private readonly ICurrentUserService _currentUserService;

    public AttendanceController(IAttendanceService attendanceService, ICurrentUserService currentUserService)
    {
        _attendanceService = attendanceService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAllAttendance(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _attendanceService.GetAllAsync(page, pageSize);
        return Ok(ApiResponse<PagedResult<AttendanceResponse>>.Ok("Attendance records retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAttendance(Guid id)
    {
        var result = await _attendanceService.GetByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Attendance record not found."));

        return Ok(ApiResponse<AttendanceResponse>.Ok("Attendance record retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetAttendanceByStudent(
        Guid studentId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _attendanceService.GetByStudentAsync(studentId, page, pageSize);
        return Ok(ApiResponse<PagedResult<AttendanceResponse>>.Ok("Student attendance retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("date/{date:datetime}")]
    public async Task<IActionResult> GetAttendanceByDate(
        DateTime date,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _attendanceService.GetByDateAsync(date, page, pageSize);
        return Ok(ApiResponse<PagedResult<AttendanceResponse>>.Ok("Attendance for date retrieved successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateAttendance([FromBody] CreateAttendanceRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _attendanceService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetAttendance), new { id = result.Id },
            ApiResponse<AttendanceResponse>.Ok("Attendance created successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAttendance(Guid id, [FromBody] UpdateAttendanceRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _attendanceService.UpdateAsync(id, request, userId.Value, userRole);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Attendance record not found."));

        return Ok(ApiResponse<AttendanceResponse>.Ok("Attendance updated successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAttendance(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _attendanceService.DeleteAsync(id, userId.Value, userRole);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Attendance record not found."));

        return Ok(ApiResponse<object>.Ok("Attendance deleted successfully"));
    }
}
