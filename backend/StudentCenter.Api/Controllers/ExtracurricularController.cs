using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/extracurriculars")]
public class ExtracurricularController : ControllerBase
{
    private readonly IExtracurricularService _extracurricularService;
    private readonly ICurrentUserService _currentUserService;

    public ExtracurricularController(IExtracurricularService extracurricularService, ICurrentUserService currentUserService)
    {
        _extracurricularService = extracurricularService;
        _currentUserService = currentUserService;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetExtracurriculars(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _extracurricularService.GetExtracurricularsAsync(page, pageSize, category, isActive);
        return Ok(ApiResponse<PagedResult<ExtracurricularResponse>>.Ok("Extracurriculars retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyExtracurriculars([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.GetMyExtracurricularsAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<ExtracurricularResponse>>.Ok("My extracurriculars retrieved successfully", result));
    }

    /// <summary>
    /// Returns all extracurriculars supervised by the authenticated teacher,
    /// with live member counts, pending proposal counts, and completed review counts.
    /// Always queries PostgreSQL — never relies on stale auth context or localStorage.
    /// </summary>
    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("supervised")]
    public async Task<IActionResult> GetSupervisedExtracurriculars()
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.GetSupervisedByTeacherAsync(userId.Value);
        return Ok(ApiResponse<List<SupervisedExtracurricularSummary>>.Ok("Supervised extracurriculars retrieved successfully", result));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetExtracurricular(Guid id)
    {
        var result = await _extracurricularService.GetExtracurricularByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Extracurricular not found."));

        return Ok(ApiResponse<ExtracurricularResponse>.Ok("Extracurricular retrieved successfully", result));
    }


    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<IActionResult> CreateExtracurricular([FromBody] CreateExtracurricularRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.CreateExtracurricularAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetExtracurricular), new { id = result.Id },
            ApiResponse<ExtracurricularResponse>.Ok("Extracurricular created successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateExtracurricular(Guid id, [FromBody] UpdateExtracurricularRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.UpdateExtracurricularAsync(id, request, userId.Value);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Extracurricular not found."));

        return Ok(ApiResponse<ExtracurricularResponse>.Ok("Extracurricular updated successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteExtracurricular(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.DeleteExtracurricularAsync(id, userId.Value);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Extracurricular not found."));

        return Ok(ApiResponse<object>.Ok("Extracurricular deleted successfully"));
    }

    [Authorize(Roles = "Student")]
    [HttpPost("{id:guid}/join")]
    public async Task<IActionResult> JoinExtracurricular(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.JoinExtracurricularAsync(id, userId.Value);
        return Ok(ApiResponse<ExtracurricularMemberResponse>.Ok("Successfully joined extracurricular", result));
    }

    [Authorize(Roles = "Student")]
    [HttpDelete("{id:guid}/leave")]
    public async Task<IActionResult> LeaveExtracurricular(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _extracurricularService.LeaveExtracurricularAsync(id, userId.Value);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Membership not found."));

        return Ok(ApiResponse<object>.Ok("Successfully left extracurricular"));
    }

    [Authorize]
    [HttpGet("{id:guid}/members")]
    public async Task<IActionResult> GetExtracurricularMembers(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _extracurricularService.GetExtracurricularMembersAsync(id, page, pageSize);
        return Ok(ApiResponse<PagedResult<ExtracurricularMemberResponse>>.Ok("Members retrieved successfully", result));
    }
}
