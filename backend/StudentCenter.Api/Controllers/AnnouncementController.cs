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
    private readonly ICurrentUserService _currentUserService;

    public AnnouncementController(IAnnouncementService announcementService, ICurrentUserService currentUserService)
    {
        _announcementService = announcementService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAnnouncements(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null)
    {
        var result = await _announcementService.GetAnnouncementsAsync(page, pageSize, category);
        return Ok(ApiResponse<PagedResult<AnnouncementResponse>>.Ok("Announcements retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAnnouncement(Guid id)
    {
        var result = await _announcementService.GetAnnouncementByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Announcement not found"));

        return Ok(ApiResponse<AnnouncementResponse>.Ok("Announcement retrieved successfully", result));
    }

    [Authorize(Roles = "Admin,OSIS")]
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

    [Authorize(Roles = "Admin,OSIS")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAnnouncement(Guid id, [FromBody] UpdateAnnouncementRequest request)
    {
        var result = await _announcementService.UpdateAnnouncementAsync(id, request);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Announcement not found"));

        return Ok(ApiResponse<AnnouncementResponse>.Ok("Announcement updated successfully", result));
    }

    [Authorize(Roles = "Admin,OSIS")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAnnouncement(Guid id)
    {
        var result = await _announcementService.DeleteAnnouncementAsync(id);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Announcement not found"));

        return Ok(ApiResponse<object>.Ok("Announcement deleted successfully"));
    }
}
