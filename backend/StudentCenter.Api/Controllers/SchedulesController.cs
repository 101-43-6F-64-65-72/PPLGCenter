using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/schedules")]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;
    private readonly IScheduleIngestionService _ingestionService;

    public SchedulesController(IScheduleService scheduleService, IScheduleIngestionService ingestionService)
    {
        _scheduleService = scheduleService;
        _ingestionService = ingestionService;
    }


    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? semesterId = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] Guid? teacherId = null,
        [FromQuery] int? dayOfWeek = null)
    {
        var (userId, userRole) = GetCurrentIdentity();
        var list = await _scheduleService.GetAllAsync(semesterId, classId, teacherId, dayOfWeek, userId, userRole);
        return Ok(ApiResponse<List<ScheduleResponse>>.Ok("Schedules retrieved successfully", list));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var (userId, userRole) = GetCurrentIdentity();
        try
        {
            var result = await _scheduleService.GetByIdAsync(id, userId, userRole);
            if (result == null)
                return NotFound(ApiResponse<object>.Fail("Schedule not found"));

            return Ok(ApiResponse<ScheduleResponse>.Ok("Schedule retrieved successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScheduleRequest request)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var result = await _scheduleService.CreateAsync(request, userId, userRole);
            return CreatedAtAction(nameof(GetById), new { id = result.Id },
                ApiResponse<ScheduleResponse>.Ok("Schedule created successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateScheduleRequest request)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var result = await _scheduleService.UpdateAsync(id, request, userId, userRole);
            if (result == null)
                return NotFound(ApiResponse<object>.Fail("Schedule not found"));

            return Ok(ApiResponse<ScheduleResponse>.Ok("Schedule updated successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var success = await _scheduleService.DeleteAsync(id, userId, userRole);
            if (!success)
                return NotFound(ApiResponse<object>.Fail("Schedule not found"));

            return Ok(ApiResponse<object>.Ok("Schedule deleted successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("student/today")]
    public async Task<IActionResult> GetTodayStudentSchedule()
    {
        var studentId = GetCurrentUserId();
        if (studentId == Guid.Empty)
            return Unauthorized();

        var result = await _scheduleService.GetTodaySchedulesForStudentAsync(studentId);
        return Ok(ApiResponse<StudentTodayScheduleResponse>.Ok("Today student schedule retrieved successfully", result));
    }


    [HttpGet("teacher/today")]
    public async Task<IActionResult> GetTodayTeacherSchedule()
    {
        var teacherId = GetCurrentUserId();
        if (teacherId == Guid.Empty)
            return Unauthorized();

        var list = await _scheduleService.GetTodaySchedulesForTeacherAsync(teacherId);
        return Ok(ApiResponse<List<ScheduleResponse>>.Ok("Today teacher schedule retrieved successfully", list));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("ingest/weekly")]
    public async Task<IActionResult> IngestWeeklyAgenda([FromBody] string csvContent)
    {
        try
        {
            var result = await _ingestionService.ImportWeeklyAgendaCsvAsync(csvContent);
            return Ok(ApiResponse<ImportSummaryResponse>.Ok("Weekly agenda ingested successfully", result));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("ingest/daily")]
    public async Task<IActionResult> IngestDailyTimetable([FromBody] string csvContent)
    {
        try
        {
            var result = await _ingestionService.ImportDailyTimetableCsvAsync(csvContent);
            return Ok(ApiResponse<ImportSummaryResponse>.Ok("Daily timetable ingested successfully", result));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, ApiResponse<object>.Fail(ex.Message));
        }
    }


    private (Guid UserId, string UserRole) GetCurrentIdentity()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        var role = User.IsInRole("Student") ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        return (userId, role);
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
