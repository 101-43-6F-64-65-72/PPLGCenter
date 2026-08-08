using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/assessments")]
public class AssessmentsController : ControllerBase
{
    private readonly IAssessmentService _assessmentService;
    private readonly ICurrentUserService _currentUserService;

    public AssessmentsController(IAssessmentService assessmentService, ICurrentUserService currentUserService)
    {
        _assessmentService = assessmentService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? classSubjectId, 
        [FromQuery] Guid? teacherId, 
        [FromQuery] Guid? categoryId)
    {
        var result = await _assessmentService.GetAssessmentsAsync(classSubjectId, teacherId, categoryId);
        return Ok(ApiResponse<List<AssessmentResponse>>.Ok("Assessments retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _assessmentService.GetAssessmentByIdAsync(id);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Assessment not found."));
        return Ok(ApiResponse<AssessmentResponse>.Ok("Assessment retrieved successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssessmentRequest request)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var result = await _assessmentService.CreateAssessmentAsync(teacherId.Value, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<AssessmentResponse>.Ok("Assessment created successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssessmentRequest request)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var result = await _assessmentService.UpdateAssessmentAsync(id, teacherId.Value, request);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

        return Ok(ApiResponse<AssessmentResponse>.Ok("Assessment updated successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var success = await _assessmentService.DeleteAssessmentAsync(id, teacherId.Value);
        if (!success) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

        return Ok(ApiResponse<object>.Ok("Assessment deleted successfully"));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var result = await _assessmentService.PublishAssessmentAsync(id, teacherId.Value);
        if (result == null) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

        return Ok(ApiResponse<AssessmentResponse>.Ok("Assessment published successfully", result));
    }
}
