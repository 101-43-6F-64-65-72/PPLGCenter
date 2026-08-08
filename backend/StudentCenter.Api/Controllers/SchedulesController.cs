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

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? semesterId = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] Guid? teacherId = null,
        [FromQuery] int? dayOfWeek = null)
    {
        var list = await _scheduleService.GetAllAsync(semesterId, classId, teacherId, dayOfWeek);
        return Ok(ApiResponse<List<ScheduleResponse>>.Ok("Schedules retrieved successfully", list));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _scheduleService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Schedule not found"));

        return Ok(ApiResponse<ScheduleResponse>.Ok("Schedule retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScheduleRequest request)
    {
        var result = await _scheduleService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ScheduleResponse>.Ok("Schedule created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateScheduleRequest request)
    {
        var result = await _scheduleService.UpdateAsync(id, request);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Schedule not found"));

        return Ok(ApiResponse<ScheduleResponse>.Ok("Schedule updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _scheduleService.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("Schedule not found"));

        return Ok(ApiResponse<object>.Ok("Schedule deleted successfully"));
    }

    [HttpGet("student/today")]
    public async Task<IActionResult> GetTodayStudentSchedule()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var studentId))
            return Unauthorized();

        var list = await _scheduleService.GetTodaySchedulesForStudentAsync(studentId);
        return Ok(ApiResponse<List<ScheduleResponse>>.Ok("Today student schedule retrieved successfully", list));
    }

    [HttpGet("teacher/today")]
    public async Task<IActionResult> GetTodayTeacherSchedule()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var teacherId))
            return Unauthorized();

        var list = await _scheduleService.GetTodaySchedulesForTeacherAsync(teacherId);
        return Ok(ApiResponse<List<ScheduleResponse>>.Ok("Today teacher schedule retrieved successfully", list));
    }
}
