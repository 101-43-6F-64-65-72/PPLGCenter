using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/semesters")]
public class SemestersController : ControllerBase
{
    private readonly ISemesterService _semesterService;

    public SemestersController(ISemesterService semesterService)
    {
        _semesterService = semesterService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? academicYearId = null)
    {
        var result = await _semesterService.GetAllAsync(academicYearId);
        return Ok(ApiResponse<List<SemesterResponse>>.Ok("Semesters retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _semesterService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Semester not found"));

        return Ok(ApiResponse<SemesterResponse>.Ok("Semester retrieved successfully", result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSemesterRequest request)
    {
        var result = await _semesterService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<SemesterResponse>.Ok("Semester created successfully", result));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSemesterRequest request)
    {
        var result = await _semesterService.UpdateAsync(id, request);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Semester not found"));

        return Ok(ApiResponse<SemesterResponse>.Ok("Semester updated successfully", result));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _semesterService.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("Semester not found"));

        return Ok(ApiResponse<object>.Ok("Semester deleted successfully"));
    }

    [HttpPatch("{id:guid}/set-active")]
    public async Task<IActionResult> SetActive(Guid id)
    {
        var result = await _semesterService.SetActiveAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Semester not found"));

        return Ok(ApiResponse<SemesterResponse>.Ok("Semester set as active", result));
    }
}
