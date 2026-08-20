using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScheduleRotationController : ControllerBase
{
    private readonly IScheduleRotationService _rotationService;

    public ScheduleRotationController(IScheduleRotationService rotationService)
    {
        _rotationService = rotationService;
    }

    private (Guid UserId, string UserRole) GetCurrentIdentity()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        var role = User.IsInRole("Student") ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        return (userId, role);
    }

    [HttpGet("class/{schoolClassId:guid}")]
    public async Task<IActionResult> GetConfig(Guid schoolClassId)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var config = await _rotationService.GetConfigByClassIdAsync(schoolClassId, userId, userRole);
            if (config is null) return NotFound(ApiResponse<object>.Fail("No active schedule rotation configuration found for this class."));
            return Ok(ApiResponse<ScheduleRotationConfigResponse>.Ok("Rotation config retrieved successfully", config));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("class/{schoolClassId:guid}/current-category")]
    public async Task<IActionResult> GetCurrentCategory(Guid schoolClassId, [FromQuery] DateTime? date)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var targetDate = date ?? DateTime.UtcNow;
            var category = await _rotationService.GetCurrentCategoryForClassAsync(schoolClassId, targetDate, userId, userRole);
            return Ok(ApiResponse<object>.Ok("Current category calculated successfully", new { SchoolClassId = schoolClassId, TargetDate = targetDate, CurrentCategory = category.ToString() }));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost]
    [HttpPost("config")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveConfig([FromBody] SaveScheduleRotationConfigRequest request)
    {
        try
        {
            var (userId, userRole) = GetCurrentIdentity();
            var saved = await _rotationService.SaveConfigAsync(request, userId, userRole);
            return Ok(ApiResponse<ScheduleRotationConfigResponse>.Ok("Rotation config saved successfully", saved));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status409Conflict, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
