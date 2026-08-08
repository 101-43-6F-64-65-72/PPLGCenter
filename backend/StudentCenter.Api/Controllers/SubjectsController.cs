using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/subjects")]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive = null)
    {
        var result = await _subjectService.GetAllAsync(isActive);
        return Ok(ApiResponse<List<SubjectResponse>>.Ok("Subjects retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _subjectService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Subject not found"));

        return Ok(ApiResponse<SubjectResponse>.Ok("Subject retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSubjectRequest request)
    {
        var result = await _subjectService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<SubjectResponse>.Ok("Subject created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubjectRequest request)
    {
        var result = await _subjectService.UpdateAsync(id, request);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("Subject not found"));

        return Ok(ApiResponse<SubjectResponse>.Ok("Subject updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _subjectService.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("Subject not found"));

        return Ok(ApiResponse<object>.Ok("Subject deleted successfully"));
    }
}
