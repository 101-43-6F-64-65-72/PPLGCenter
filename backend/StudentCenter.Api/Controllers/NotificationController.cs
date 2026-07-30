using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public NotificationController(INotificationService notificationService, ICurrentUserService currentUserService)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _notificationService.GetMyNotificationsAsync(userId.Value, page, pageSize);
        return Ok(ApiResponse<PagedResult<NotificationResponse>>.Ok("Notifications retrieved successfully", result));
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
    public async Task<IActionResult> MarkAsRead(Guid id, [FromBody] MarkNotificationReadRequest request)
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
}
