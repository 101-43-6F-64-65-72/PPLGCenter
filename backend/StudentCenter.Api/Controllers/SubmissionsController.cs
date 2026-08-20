using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public SubmissionsController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var currentUserRole = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        try
        {
            var submission = await _submissionService.GetSubmissionByIdAsync(id, currentUserId, currentUserRole);
            if (submission == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Submission not found."));

            return Ok(ApiResponse<SubmissionResponse>.SuccessResponse(submission));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("assignment/{assignmentId:guid}/my")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMySubmissionForAssignment(Guid assignmentId)
    {
        var studentId = GetCurrentUserId();
        var submission = await _submissionService.GetStudentSubmissionForAssignmentAsync(assignmentId, studentId);
        if (submission == null)
            return NotFound(ApiResponse<object>.ErrorResponse("No submission found for this assignment."));

        return Ok(ApiResponse<SubmissionResponse>.SuccessResponse(submission));
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Submit([FromBody] CreateSubmissionRequest request)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var submission = await _submissionService.SubmitAssignmentAsync(studentId, request);
            return CreatedAtAction(nameof(GetById), new { id = submission.Id }, ApiResponse<SubmissionResponse>.SuccessResponse(submission, "Assignment submitted successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost("{id:guid}/grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Grade(Guid id, [FromBody] GradeSubmissionRequest request)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var submission = await _submissionService.GradeSubmissionAsync(id, teacherId, request);
            if (submission == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Submission not found."));

            return Ok(ApiResponse<SubmissionResponse>.SuccessResponse(submission, "Submission graded successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
