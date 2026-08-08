using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/grade-categories")]
public class GradeCategoriesController : ControllerBase
{
    private readonly IAssessmentService _assessmentService;

    public GradeCategoriesController(IAssessmentService assessmentService)
    {
        _assessmentService = assessmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _assessmentService.GetAllCategoriesAsync();
        return Ok(ApiResponse<List<GradeCategoryResponse>>.Ok("Grade categories retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _assessmentService.GetCategoryByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Grade category not found."));
        return Ok(ApiResponse<GradeCategoryResponse>.Ok("Grade category retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGradeCategoryRequest request)
    {
        var result = await _assessmentService.CreateCategoryAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<GradeCategoryResponse>.Ok("Grade category created successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGradeCategoryRequest request)
    {
        var result = await _assessmentService.UpdateCategoryAsync(id, request);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Grade category not found."));
        return Ok(ApiResponse<GradeCategoryResponse>.Ok("Grade category updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _assessmentService.DeleteCategoryAsync(id);
        if (!success) return NotFound(ApiResponse<object>.Fail("Grade category not found or has linked assessments."));
        return Ok(ApiResponse<object>.Ok("Grade category deleted successfully"));
    }
}
