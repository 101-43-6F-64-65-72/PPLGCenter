using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
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
        try
        {
            var result = await _discussionService.CreateReplyAsync(GetUserId(), request);
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

    [HttpGet("thread/{threadId}")]
    public async Task<IActionResult> GetThreadReplies(Guid threadId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var result = await _discussionService.GetThreadRepliesAsync(threadId, GetUserId(), page, pageSize);
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReply(Guid id)
    {
        try
        {
            var success = await _discussionService.DeleteReplyAsync(GetUserId(), id);
            if (!success) return NotFound(ApiResponse<object>.Fail("Balasan tidak ditemukan."));
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
}
