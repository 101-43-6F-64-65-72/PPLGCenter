using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/announcements")]
public class AnnouncementController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;
    private readonly IAnnouncementCommentService _commentService;
    private readonly IAnnouncementReactionService _reactionService;
    private readonly ICurrentUserService _currentUserService;

    public AnnouncementController(
        IAnnouncementService announcementService,
        IAnnouncementCommentService commentService,
        IAnnouncementReactionService reactionService,
        ICurrentUserService currentUserService)
    {
        _announcementService = announcementService;
        _commentService = commentService;
        _reactionService = reactionService;
        _currentUserService = currentUserService;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAnnouncements(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null)
    {
        var result = await _announcementService.GetAnnouncementsAsync(page, pageSize, category);
        return Ok(ApiResponse<PagedResult<AnnouncementResponse>>.Ok("Announcements retrieved successfully", result));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAnnouncement(Guid id)
    {
        var result = await _announcementService.GetAnnouncementByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Announcement not found"));

        return Ok(ApiResponse<AnnouncementResponse>.Ok("Announcement retrieved successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher,Student")]
    [HttpPost]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
        {
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));
        }

        var result = await _announcementService.CreateAnnouncementAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetAnnouncement), new { id = result.Id },
            ApiResponse<AnnouncementResponse>.Ok("Announcement created successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher,Student")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementRequest request)
    {
        var result = await _announcementService.UpdateAnnouncementAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Announcement not found"));

        return Ok(ApiResponse<AnnouncementResponse>.Ok("Announcement updated successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher,Student")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        var result = await _announcementService.DeleteAnnouncementAsync(id);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Announcement not found"));

        return Ok(ApiResponse<object>.Ok("Announcement deleted successfully"));
    }

    [Authorize]
    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null)
    {
        var result = await _announcementService.GetFeedAsync(page, pageSize, category);
        return Ok(ApiResponse<PagedResult<AnnouncementFeedResponse>>.Ok("Feed retrieved successfully", result));
    }

    [Authorize]
    [HttpPost("{id:guid}/comments")]
    public async Task<IActionResult> AddComment(Guid id, [FromBody] CommentRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _commentService.AddCommentAsync(id, request, userId.Value, request.ParentCommentId);
        return Ok(ApiResponse<CommentResponse>.Ok("Comment added successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}/comments")]
    public async Task<IActionResult> GetComments(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _commentService.GetCommentsAsync(id, page, pageSize);
        return Ok(ApiResponse<PagedResult<CommentResponse>>.Ok("Comments retrieved successfully", result));
    }

    [Authorize]
    [HttpDelete("~/api/comments/{id:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _commentService.DeleteCommentAsync(id, userId.Value, userRole);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Comment not found"));

        return Ok(ApiResponse<object>.Ok("Comment deleted successfully"));
    }

    [Authorize]
    [HttpPost("{id:guid}/reactions")]
    public async Task<IActionResult> React(Guid id, [FromBody] ReactionRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        await _reactionService.ToggleReactionAsync(id, request.Type, userId.Value);
        return Ok(ApiResponse<object>.Ok("Reaction registered successfully"));
    }

    [Authorize]
    [HttpDelete("{id:guid}/reactions")]
    public async Task<IActionResult> RemoveReaction(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _reactionService.RemoveReactionAsync(id, userId.Value);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Reaction not found"));

        return Ok(ApiResponse<object>.Ok("Reaction removed successfully"));
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/reactions")]
    public async Task<IActionResult> GetReactions(Guid id)
    {
        var userId = _currentUserService.UserId;
        var result = await _reactionService.GetReactionSummaryAsync(id, userId);
        return Ok(ApiResponse<StudentCenter.Application.DTOs.AnnouncementReactionSummaryResponse>.Ok("Reactions retrieved successfully", result));
    }
}
