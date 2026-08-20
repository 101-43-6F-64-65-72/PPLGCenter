using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/calendar")]
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _calendarService;
    private readonly ICurrentUserService _currentUserService;

    public CalendarController(ICalendarService calendarService, ICurrentUserService currentUserService)
    {
        _calendarService = calendarService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetEvents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null)
    {
        var userRole = _currentUserService.Role;
        var result = await _calendarService.GetEventsAsync(page, pageSize, category, userRole);
        return Ok(ApiResponse<PagedResult<CalendarEventResponse>>.Ok("Calendar events retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("month")]
    public async Task<IActionResult> GetMonthlyEvents([FromQuery] int year = 0, [FromQuery] int month = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        if (month == 0) month = DateTime.UtcNow.Month;

        var userRole = _currentUserService.Role;
        var result = await _calendarService.GetMonthlyEventsAsync(year, month, userRole);
        return Ok(ApiResponse<List<CalendarEventResponse>>.Ok("Monthly calendar events retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("day")]
    public async Task<IActionResult> GetDailyEvents([FromQuery] DateTime? date = null)
    {
        var targetDate = date ?? DateTime.UtcNow;
        var userRole = _currentUserService.Role;
        var result = await _calendarService.GetDailyEventsAsync(targetDate, userRole);
        return Ok(ApiResponse<List<CalendarEventResponse>>.Ok("Daily calendar events retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingEvents([FromQuery] int count = 5)
    {
        var userRole = _currentUserService.Role;
        var result = await _calendarService.GetUpcomingEventsAsync(count, userRole);
        return Ok(ApiResponse<List<CalendarEventResponse>>.Ok("Upcoming events retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEvent(Guid id)
    {
        var userRole = _currentUserService.Role;
        try
        {
            var result = await _calendarService.GetEventByIdAsync(id, userRole);

            if (result is null)
                return NotFound(ApiResponse<object>.Fail("Calendar event not found"));

            return Ok(ApiResponse<CalendarEventResponse>.Ok("Calendar event retrieved successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateCalendarEventRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        try
        {
            var result = await _calendarService.CreateEventAsync(request, userId.Value, userRole);
            return CreatedAtAction(nameof(GetEvent), new { id = result.Id },
                ApiResponse<CalendarEventResponse>.Ok("Calendar event created successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateCalendarEventRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        try
        {
            var result = await _calendarService.UpdateEventAsync(id, request, userId.Value, userRole);

            if (result is null)
                return NotFound(ApiResponse<object>.Fail("Calendar event not found"));

            return Ok(ApiResponse<CalendarEventResponse>.Ok("Calendar event updated successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        try
        {
            var result = await _calendarService.DeleteEventAsync(id, userId.Value, userRole);

            if (!result)
                return NotFound(ApiResponse<object>.Fail("Calendar event not found"));

            return Ok(ApiResponse<object>.Ok("Calendar event deleted successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
