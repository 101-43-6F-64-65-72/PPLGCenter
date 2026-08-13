using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    [HttpGet("class/{schoolClassId:guid}")]
    public async Task<IActionResult> GetConfig(Guid schoolClassId)
    {
        var config = await _rotationService.GetConfigByClassIdAsync(schoolClassId);
        if (config is null) return NotFound("No active schedule rotation configuration found for this class.");
        return Ok(config);
    }

    [HttpGet("class/{schoolClassId:guid}/current-category")]
    public async Task<IActionResult> GetCurrentCategory(Guid schoolClassId, [FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.UtcNow;
        var category = await _rotationService.GetCurrentCategoryForClassAsync(schoolClassId, targetDate);
        return Ok(new { SchoolClassId = schoolClassId, TargetDate = targetDate, CurrentCategory = category.ToString() });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> SaveConfig([FromBody] SaveScheduleRotationConfigRequest request)
    {
        var saved = await _rotationService.SaveConfigAsync(request);
        return Ok(saved);
    }
}
