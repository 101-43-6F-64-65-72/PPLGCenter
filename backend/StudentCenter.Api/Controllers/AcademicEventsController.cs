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
        var list = await _service.GetAllAsync(targetType, classId, isActive);
        return Ok(ApiResponse<List<AcademicEventResponse>>.Ok("Academic events retrieved successfully", list));
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int limit = 5)
    {
        var list = await _service.GetUpcomingEventsAsync(limit);
        return Ok(ApiResponse<List<AcademicEventResponse>>.Ok("Upcoming academic events retrieved successfully", list));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Academic event not found"));

        return Ok(ApiResponse<AcademicEventResponse>.Ok("Academic event retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAcademicEventRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<AcademicEventResponse>.Ok("Academic event created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAcademicEventRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Academic event not found"));

        return Ok(ApiResponse<AcademicEventResponse>.Ok("Academic event updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("Academic event not found"));

        return Ok(ApiResponse<object>.Ok("Academic event deleted successfully"));
    }
}
