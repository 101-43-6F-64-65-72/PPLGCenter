using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/academic-years")]
public class AcademicYearsController : ControllerBase
{
    private readonly IAcademicYearService _academicYearService;

    public AcademicYearsController(IAcademicYearService academicYearService)
    {
        _academicYearService = academicYearService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _academicYearService.GetAllAsync();
        return Ok(ApiResponse<List<AcademicYearResponse>>.Ok("Academic years retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _academicYearService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Academic year not found"));

        return Ok(ApiResponse<AcademicYearResponse>.Ok("Academic year retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAcademicYearRequest request)
    {
        var result = await _academicYearService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<AcademicYearResponse>.Ok("Academic year created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAcademicYearRequest request)
    {
        var result = await _academicYearService.UpdateAsync(id, request);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Academic year not found"));

        return Ok(ApiResponse<AcademicYearResponse>.Ok("Academic year updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _academicYearService.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("Academic year not found"));

        return Ok(ApiResponse<object>.Ok("Academic year deleted successfully"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/set-active")]
    public async Task<IActionResult> SetActive(Guid id)
    {
        var result = await _academicYearService.SetActiveAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Academic year not found"));

        return Ok(ApiResponse<AcademicYearResponse>.Ok("Academic year set as active", result));
    }
}
