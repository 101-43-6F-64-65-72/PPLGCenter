using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
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

    public AssessmentsController(IAssessmentService assessmentService)
    {
        _assessmentService = assessmentService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? classSubjectId, 
        [FromQuery] Guid? teacherId, 
        [FromQuery] Guid? categoryId)
    {
        var isStudent = User.IsInRole("Student");
        var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        var userId = GetCurrentUserId();
        var result = await _assessmentService.GetAssessmentsAsync(classSubjectId, teacherId, categoryId, userId, userRole);
        return Ok(ApiResponse<List<AssessmentResponse>>.Ok("Assessments retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        var isStudent = User.IsInRole("Student");
        var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        var userId = GetCurrentUserId();
        try
        {
            var result = await _assessmentService.GetAssessmentByIdAsync(id, userId, userRole);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Assessment not found."));
            return Ok(ApiResponse<AssessmentResponse>.Ok("Assessment retrieved successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssessmentRequest request)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var result = await _assessmentService.CreateAssessmentAsync(teacherId, request);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<AssessmentResponse>.Ok("Assessment created successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssessmentRequest request)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var result = await _assessmentService.UpdateAssessmentAsync(id, teacherId, request);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

            return Ok(ApiResponse<AssessmentResponse>.Ok("Assessment updated successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var success = await _assessmentService.DeleteAssessmentAsync(id, teacherId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

            return Ok(ApiResponse<object>.Ok("Assessment deleted successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var result = await _assessmentService.PublishAssessmentAsync(id, teacherId);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

            return Ok(ApiResponse<AssessmentResponse>.Ok("Assessment published successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
