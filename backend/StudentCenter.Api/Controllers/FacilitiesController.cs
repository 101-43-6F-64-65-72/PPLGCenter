using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/facilities")]
public class FacilitiesController : ControllerBase
{
    private readonly IFacilityService _facilityService;
    private readonly ICurrentUserService _currentUserService;

    public FacilitiesController(IFacilityService facilityService, ICurrentUserService currentUserService)
    {
        _facilityService = facilityService;
        _currentUserService = currentUserService;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetFacilities(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? isActive = null)
    {
        var result = await _facilityService.GetFacilitiesAsync(page, pageSize, isActive);
        return Ok(ApiResponse<PagedResult<FacilityResponse>>.Ok("Facilities retrieved successfully", result));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetFacility(Guid id)
    {
        var result = await _facilityService.GetFacilityByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Facility not found."));

        return Ok(ApiResponse<FacilityResponse>.Ok("Facility retrieved successfully", result));
    }

    /// <summary>
    /// Returns facilities managed by the current logged-in teacher.
    /// Used by the frontend to conditionally show the facility monitoring tab.
    /// </summary>
    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("my-managed")]
    public async Task<IActionResult> GetMyManagedFacilities()
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var result = await _facilityService.GetManagedFacilitiesAsync(teacherId.Value);
        return Ok(ApiResponse<List<FacilityResponse>>.Ok("Managed facilities retrieved successfully", result));
    }

    /// <summary>
    /// Returns all bookings for facilities managed by the current teacher.
    /// Replaces the global booking list so teachers only see their own facilities.
    /// </summary>
    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("managed-bookings")]
    public async Task<IActionResult> GetManagedBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var result = await _facilityService.GetManagedBookingsAsync(teacherId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<BookingResponse>>.Ok("Managed bookings retrieved successfully", result));
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
