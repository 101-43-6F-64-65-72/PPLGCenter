using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/announcements/{announcementId}/comments")]
[Authorize]
public class AnnouncementCommentsController : ControllerBase
{
    private readonly IAnnouncementCommentService _commentService;

    public AnnouncementCommentsController(IAnnouncementCommentService commentService)
    {
        _commentService = commentService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> AddComment(Guid announcementId, [FromBody] CreateAnnouncementCommentRequest request)
    {
        var commentReq = new CommentRequest { Content = request.Content };
        try
        {
            var result = await _commentService.AddCommentAsync(announcementId, commentReq, GetUserId(), request.ParentCommentId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetComments(Guid announcementId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _commentService.GetCommentsAsync(announcementId, page, pageSize);
        return Ok(result);
    }

    [HttpDelete("{commentId}")]
    public async Task<IActionResult> DeleteComment(Guid announcementId, Guid commentId)
    {
        try
        {
            var success = await _commentService.DeleteCommentAsync(commentId, GetUserId(), GetUserRole());
            if (!success) return NotFound();
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
    }

    [HttpPost("toggle-lock")]
    public async Task<IActionResult> ToggleCommentsLock(Guid announcementId)
    {
        var isLocked = await _commentService.ToggleCommentsLockAsync(announcementId, GetUserId());
        return Ok(new { isCommentsLocked = isLocked });
    }
}
