using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/assignments")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ISubmissionService _submissionService;
    private readonly ICurrentUserService _currentUserService;

    public AssignmentsController(
        IAssignmentService assignmentService,
        ISubmissionService submissionService,
        ICurrentUserService currentUserService)
    {
        _assignmentService = assignmentService;
        _submissionService = submissionService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAssignments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? subject = null,
        [FromQuery] string? grade = null)
    {
        var result = await _assignmentService.GetAssignmentsAsync(page, pageSize, subject, grade);
        return Ok(ApiResponse<PagedResult<AssignmentResponse>>.Ok("Assignments retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssignment(Guid id)
    {
        var result = await _assignmentService.GetAssignmentByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Assignment not found"));

        return Ok(ApiResponse<AssignmentResponse>.Ok("Assignment retrieved successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _assignmentService.CreateAssignmentAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetAssignment), new { id = result.Id },
            ApiResponse<AssignmentResponse>.Ok("Assignment created successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAssignment(Guid id, [FromBody] UpdateAssignmentRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _assignmentService.UpdateAssignmentAsync(id, request, userId.Value, userRole);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Assignment not found"));

        return Ok(ApiResponse<AssignmentResponse>.Ok("Assignment updated successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAssignment(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _assignmentService.DeleteAssignmentAsync(id, userId.Value, userRole);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Assignment not found"));

        return Ok(ApiResponse<object>.Ok("Assignment deleted successfully"));
    }

    [Authorize(Roles = "Student")]
    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> SubmitAssignment(Guid id, [FromBody] SubmitAssignmentRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _submissionService.SubmitAsync(id, request, userId.Value);
        return CreatedAtAction(nameof(GetSubmission), new { id = result.Id },
            ApiResponse<SubmissionResponse>.Ok("Assignment submitted successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpGet("{id:guid}/submissions")]
    public async Task<IActionResult> GetSubmissions(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _submissionService.GetSubmissionsByAssignmentAsync(id, page, pageSize);
        return Ok(ApiResponse<PagedResult<SubmissionResponse>>.Ok("Submissions retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("~/api/submissions/{id:guid}")]
    public async Task<IActionResult> GetSubmission(Guid id)
    {
        var result = await _submissionService.GetSubmissionByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Submission not found"));

        return Ok(ApiResponse<SubmissionResponse>.Ok("Submission retrieved successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("~/api/submissions/{id:guid}/grade")]
    public async Task<IActionResult> GradeSubmission(Guid id, [FromBody] GradeSubmissionRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _submissionService.GradeSubmissionAsync(id, request, userId.Value, userRole);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Submission not found"));

        return Ok(ApiResponse<SubmissionResponse>.Ok("Submission graded successfully", result));
    }
}
