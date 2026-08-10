using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserService _userService;

    public NotificationController(
        INotificationService notificationService, 
        ICurrentUserService currentUserService,
        IUserService userService)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
        _userService = userService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] NotificationFilterRequest filter)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _notificationService.GetMyNotificationsAsync(userId.Value, filter);
        return Ok(ApiResponse<PagedResult<NotificationResponse>>.Ok("Notifications retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _notificationService.GetSummaryAsync(userId.Value);
        return Ok(ApiResponse<NotificationSummaryResponse>.Ok("Notification summary retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _notificationService.GetUnreadCountAsync(userId.Value);
        return Ok(ApiResponse<int>.Ok("Unread notification count retrieved successfully", result));
    }

    [Authorize]
    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _notificationService.MarkAsReadAsync(id, userId.Value);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Notification not found."));

        return Ok(ApiResponse<object>.Ok("Notification marked as read successfully"));
    }

    [Authorize]
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        await _notificationService.MarkAllAsReadAsync(userId.Value);
        return Ok(ApiResponse<object>.Ok("All notifications marked as read successfully"));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _notificationService.DeleteAsync(id, userId.Value);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Notification not found."));

        return Ok(ApiResponse<object>.Ok("Notification deleted successfully"));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost("broadcast")]
    public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Body))
            return BadRequest(ApiResponse<object>.Fail("Title and Body are required."));

        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var user = await _userService.GetUserByIdAsync(userId.Value);
        var senderName = user?.FullName ?? "Pengelola Sekolah";

        await _notificationService.BroadcastWithSenderAsync(
            userId.Value,
            senderName,
            request.Title,
            request.Body,
            request.Type,
            request.TargetRole,
            request.Priority,
            request.ActionUrl,
            request.Icon,
            request.Color,
            request.Metadata
        );

        return Ok(ApiResponse<object>.Ok("Broadcast notification sent successfully."));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpGet("broadcasts")]
    public async Task<IActionResult> GetBroadcastList()
    {
        var broadcasts = await _notificationService.GetBroadcastListAsync();
        return Ok(ApiResponse<List<BroadcastItemResponse>>.Ok("Broadcast list retrieved successfully", broadcasts));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("broadcast/{broadcastId}")]
    public async Task<IActionResult> UpdateBroadcast(string broadcastId, [FromBody] UpdateBroadcastRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Body))
            return BadRequest(ApiResponse<object>.Fail("Title and Body are required."));

        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        try
        {
            var success = await _notificationService.UpdateBroadcastAsync(broadcastId, userId.Value, request);
            if (!success)
                return NotFound(ApiResponse<object>.Fail("Broadcast not found."));

            return Ok(ApiResponse<object>.Ok("Broadcast updated successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("broadcast/{broadcastId}")]
    public async Task<IActionResult> DeleteBroadcast(string broadcastId)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var isAdmin = User.IsInRole("Admin");

        try
        {
            var success = await _notificationService.DeleteBroadcastAsync(broadcastId, userId.Value, isAdmin);
            if (!success)
                return NotFound(ApiResponse<object>.Fail("Broadcast not found."));

            return Ok(ApiResponse<object>.Ok("Broadcast deleted successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
