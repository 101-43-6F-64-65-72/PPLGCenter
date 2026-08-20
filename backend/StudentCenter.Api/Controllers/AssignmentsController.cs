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
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ISubmissionService _submissionService;

    public AssignmentsController(IAssignmentService assignmentService, ISubmissionService submissionService)
    {
        _assignmentService = assignmentService;
        _submissionService = submissionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? classSubjectId, [FromQuery] Guid? teacherId)
    {
        var isStudent = User.IsInRole("Student");
        var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        var userId = GetCurrentUserId();
        var assignments = await _assignmentService.GetAllAsync(classSubjectId, teacherId, false, userId, userRole);
        return Ok(ApiResponse<List<AssignmentResponse>>.SuccessResponse(assignments));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var isStudent = User.IsInRole("Student");
        var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        var userId = GetCurrentUserId();
        try
        {
            var assignment = await _assignmentService.GetByIdAsync(id, userId, userRole);
            if (assignment == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Assignment not found."));

            return Ok(ApiResponse<AssignmentResponse>.SuccessResponse(assignment));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var assignment = await _assignmentService.CreateAsync(teacherId, request);
            return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, ApiResponse<AssignmentResponse>.SuccessResponse(assignment, "Assignment created successfully."));
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

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssignmentRequest request)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var assignment = await _assignmentService.UpdateAsync(id, teacherId, request);
            if (assignment == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Assignment not found."));

            return Ok(ApiResponse<AssignmentResponse>.SuccessResponse(assignment, "Assignment updated successfully."));
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

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var success = await _assignmentService.SoftDeleteAsync(id, teacherId);
            if (!success)
                return NotFound(ApiResponse<object>.ErrorResponse("Assignment not found or unauthorized."));

            return Ok(ApiResponse<object>.SuccessResponse(null!, "Assignment deleted successfully."));
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

    [HttpGet("my")]
    public async Task<IActionResult> GetMyAssignments()
    {
        var userId = GetCurrentUserId();
        if (User.IsInRole("Student"))
        {
            var assignments = await _assignmentService.GetStudentAssignmentsAsync(userId);
            return Ok(ApiResponse<List<AssignmentResponse>>.SuccessResponse(assignments));
        }
        else
        {
            var assignments = await _assignmentService.GetTeacherAssignmentsAsync(userId);
            return Ok(ApiResponse<List<AssignmentResponse>>.SuccessResponse(assignments));
        }
    }

    [HttpGet("{id:guid}/submissions")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetAssignmentSubmissions(Guid id)
    {
        var teacherId = GetCurrentUserId();
        var userRole = User.IsInRole("Admin") ? "Admin" : "Teacher";
        try
        {
            var submissions = await _submissionService.GetSubmissionsByAssignmentAsync(id, teacherId, userRole);
            return Ok(ApiResponse<List<SubmissionResponse>>.SuccessResponse(submissions));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
