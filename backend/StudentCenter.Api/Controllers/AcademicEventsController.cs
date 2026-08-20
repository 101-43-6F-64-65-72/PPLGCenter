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
[Route("api/academic-events")]
public class AcademicEventsController : ControllerBase
{
    private readonly IAcademicEventService _service;

    public AcademicEventsController(IAcademicEventService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? targetType = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] bool? isActive = null)
    {
        var (userId, userRole) = GetCurrentIdentity();
        var list = await _service.GetAllAsync(userId, userRole, targetType, classId, isActive);
        return Ok(ApiResponse<List<AcademicEventResponse>>.Ok("Academic events retrieved successfully", list));
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int limit = 5)
    {
        var (userId, userRole) = GetCurrentIdentity();
        var list = await _service.GetUpcomingEventsAsync(limit, userId, userRole);
        return Ok(ApiResponse<List<AcademicEventResponse>>.Ok("Upcoming academic events retrieved successfully", list));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var (userId, userRole) = GetCurrentIdentity();
        try
        {
            var result = await _service.GetByIdAsync(id, userId, userRole);
            if (result == null)
                return NotFound(ApiResponse<object>.Fail("Academic event not found"));

            return Ok(ApiResponse<AcademicEventResponse>.Ok("Academic event retrieved successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAcademicEventRequest request)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var result = await _service.CreateAsync(request, userId, userRole);
            return CreatedAtAction(nameof(GetById), new { id = result.Id },
                ApiResponse<AcademicEventResponse>.Ok("Academic event created successfully", result));
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
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAcademicEventRequest request)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var result = await _service.UpdateAsync(id, request, userId, userRole);
            if (result == null)
                return NotFound(ApiResponse<object>.Fail("Academic event not found"));

            return Ok(ApiResponse<AcademicEventResponse>.Ok("Academic event updated successfully", result));
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
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var success = await _service.DeleteAsync(id, userId, userRole);
            if (!success)
                return NotFound(ApiResponse<object>.Fail("Academic event not found"));

            return Ok(ApiResponse<object>.Ok("Academic event deleted successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    private (Guid UserId, string UserRole) GetCurrentIdentity()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        var role = User.IsInRole("Student") ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        return (userId, role);
    }
}
