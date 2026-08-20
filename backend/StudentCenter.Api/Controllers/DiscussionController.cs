using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/discussions")]
[Authorize]
public class DiscussionController : ControllerBase
{
    private readonly IDiscussionService _discussionService;

    public DiscussionController(IDiscussionService discussionService)
    {
        _discussionService = discussionService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> CreateThread([FromBody] CreateDiscussionThreadRequest request)
    {
        try
        {
            var result = await _discussionService.CreateThreadAsync(GetUserId(), request);
            return CreatedAtAction(nameof(GetThreadById), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("class-subject/{classSubjectId}")]
    public async Task<IActionResult> GetClassSubjectThreads(Guid classSubjectId, [FromQuery] string? cursor, [FromQuery] int limit = 15)
    {
        try
        {
            var result = await _discussionService.GetClassSubjectThreadsAsync(classSubjectId, GetUserId(), cursor, limit);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetThreadById(Guid id)
    {
        try
        {
            var result = await _discussionService.GetThreadByIdAsync(id, GetUserId());
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateThread(Guid id, [FromBody] UpdateDiscussionThreadRequest request)
    {
        try
        {
            var result = await _discussionService.UpdateThreadAsync(GetUserId(), id, request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteThread(Guid id)
    {
        try
        {
            var success = await _discussionService.DeleteThreadAsync(GetUserId(), id);
            if (!success) return NotFound(ApiResponse<object>.Fail("Diskusi tidak ditemukan."));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/pin")]
    public async Task<IActionResult> TogglePin(Guid id)
    {
        try
        {
            var result = await _discussionService.TogglePinThreadAsync(GetUserId(), id);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> ToggleLock(Guid id)
    {
        try
        {
            var result = await _discussionService.ToggleLockThreadAsync(GetUserId(), id);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }
}
