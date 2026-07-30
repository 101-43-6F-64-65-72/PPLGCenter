using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/facilities")]
public class FacilityController : ControllerBase
{
    private readonly IFacilityService _facilityService;

    public FacilityController(IFacilityService facilityService)
    {
        _facilityService = facilityService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetFacilities(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? isActive = null)
    {
        var result = await _facilityService.GetFacilitiesAsync(page, pageSize, isActive);
        return Ok(ApiResponse<PagedResult<FacilityResponse>>.Ok("Facilities retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetFacility(Guid id)
    {
        var result = await _facilityService.GetFacilityByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Facility not found."));

        return Ok(ApiResponse<FacilityResponse>.Ok("Facility retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateFacility([FromBody] CreateFacilityRequest request)
    {
        var result = await _facilityService.CreateFacilityAsync(request);
        return CreatedAtAction(nameof(GetFacility), new { id = result.Id },
            ApiResponse<FacilityResponse>.Ok("Facility created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateFacility(Guid id, [FromBody] UpdateFacilityRequest request)
    {
        var result = await _facilityService.UpdateFacilityAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Facility not found."));

        return Ok(ApiResponse<FacilityResponse>.Ok("Facility updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFacility(Guid id)
    {
        var result = await _facilityService.DeleteFacilityAsync(id);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Facility not found."));

        return Ok(ApiResponse<object>.Ok("Facility deleted successfully"));
    }
}
