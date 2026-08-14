using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        var result = await _discussionService.CreateThreadAsync(GetUserId(), request);
        return CreatedAtAction(nameof(GetThreadById), new { id = result.Id }, result);
    }

    [HttpGet("class-subject/{classSubjectId}")]
    public async Task<IActionResult> GetClassSubjectThreads(Guid classSubjectId, [FromQuery] string? cursor, [FromQuery] int limit = 15)
    {
        var result = await _discussionService.GetClassSubjectThreadsAsync(classSubjectId, cursor, limit);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetThreadById(Guid id)
    {
        var result = await _discussionService.GetThreadByIdAsync(id);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateThread(Guid id, [FromBody] UpdateDiscussionThreadRequest request)
    {
        var result = await _discussionService.UpdateThreadAsync(GetUserId(), id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteThread(Guid id)
    {
        var success = await _discussionService.DeleteThreadAsync(GetUserId(), id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/pin")]
    public async Task<IActionResult> TogglePin(Guid id)
    {
        var result = await _discussionService.TogglePinThreadAsync(GetUserId(), id);
        return Ok(result);
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> ToggleLock(Guid id)
    {
        var result = await _discussionService.ToggleLockThreadAsync(GetUserId(), id);
        return Ok(result);
    }
}
