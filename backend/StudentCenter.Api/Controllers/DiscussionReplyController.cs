using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/discussions/replies")]
[Authorize]
public class DiscussionReplyController : ControllerBase
{
    private readonly IDiscussionService _discussionService;

    public DiscussionReplyController(IDiscussionService discussionService)
    {
        _discussionService = discussionService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReply([FromBody] CreateDiscussionReplyRequest request)
    {
        var result = await _discussionService.CreateReplyAsync(GetUserId(), request);
        return Ok(result);
    }

    [HttpGet("thread/{threadId}")]
    public async Task<IActionResult> GetThreadReplies(Guid threadId)
    {
        var result = await _discussionService.GetThreadRepliesAsync(threadId);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReply(Guid id)
    {
        var success = await _discussionService.DeleteReplyAsync(GetUserId(), id);
        if (!success) return NotFound();
        return NoContent();
    }
}
