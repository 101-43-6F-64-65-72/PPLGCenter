using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/classes")]
public class ClassesController : ControllerBase
{
    private readonly ISchoolClassService _schoolClassService;

    public ClassesController(ISchoolClassService schoolClassService)
    {
        _schoolClassService = schoolClassService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? departmentId = null, [FromQuery] Guid? academicYearId = null)
    {
        var result = await _schoolClassService.GetAllAsync(departmentId, academicYearId);
        return Ok(ApiResponse<List<SchoolClassResponse>>.Ok("Classes retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _schoolClassService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Class not found"));

        return Ok(ApiResponse<SchoolClassResponse>.Ok("Class retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSchoolClassRequest request)
    {
        var result = await _schoolClassService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<SchoolClassResponse>.Ok("Class created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSchoolClassRequest request)
    {
        var result = await _schoolClassService.UpdateAsync(id, request);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Class not found"));

        return Ok(ApiResponse<SchoolClassResponse>.Ok("Class updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _schoolClassService.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("Class not found"));

        return Ok(ApiResponse<object>.Ok("Class deleted successfully"));
    }
}
