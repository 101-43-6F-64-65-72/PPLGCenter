using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommunityGroupsController : ControllerBase
{
    private readonly ICommunityGroupService _groupService;

    public CommunityGroupsController(ICommunityGroupService groupService)
    {
        _groupService = groupService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetGroups([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var groups = await _groupService.GetGroupsAsync(currentUserId, page, pageSize, search);
            return Ok(groups);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("inbox/invitations")]
    public async Task<IActionResult> GetInvitations()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var invitations = await _groupService.GetInvitationsAsync(currentUserId);
            return Ok(invitations);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("inbox/invitations/{membershipId:guid}/respond")]
    public async Task<IActionResult> RespondToInvitation(Guid membershipId, [FromQuery] bool accept = true)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _groupService.RespondToInvitationAsync(membershipId, accept, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Invitation not found."));
            return Ok(new { Message = accept ? "Invitation accepted." : "Invitation declined." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("inbox/mentions")]
    public async Task<IActionResult> GetMentions()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var mentions = await _groupService.GetMentionsAsync(currentUserId);
            return Ok(mentions);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateCommunityGroupRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var group = await _groupService.CreateGroupAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetGroupById), new { groupId = group.Id }, group);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{groupId:guid}")]
    public async Task<IActionResult> GetGroupById(Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var group = await _groupService.GetGroupByIdAsync(groupId, currentUserId);
            if (group is null) return NotFound(ApiResponse<object>.Fail("Community group not found."));
            return Ok(group);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("{groupId:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _groupService.DeleteGroupAsync(groupId, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Group not found."));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{groupId:guid}/join")]
    public async Task<IActionResult> JoinGroup(Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _groupService.JoinGroupRequestAsync(groupId, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Group not found."));
            return Ok(new { Message = "Join request submitted." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{groupId:guid}/members")]
    public async Task<IActionResult> GetMembers(Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var members = await _groupService.GetMembersAsync(groupId, currentUserId);
            return Ok(members);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{groupId:guid}/members/{targetUserId:guid}")]
    [HttpPut("{groupId:guid}/members/{targetUserId:guid}")]
    public async Task<IActionResult> ManageMember(Guid groupId, Guid targetUserId, [FromBody] ManageMemberRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var member = await _groupService.ManageMemberAsync(groupId, targetUserId, request, currentUserId);
            if (member is null) return NotFound(ApiResponse<object>.Fail("Member or group not found."));
            return Ok(member);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{groupId:guid}/leave")]
    [HttpDelete("{groupId:guid}/leave")]
    public async Task<IActionResult> LeaveGroup(Guid groupId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _groupService.LeaveGroupAsync(groupId, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Membership not found."));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{groupId:guid}/invite/{targetUserId:guid}")]
    public async Task<IActionResult> InviteMember(Guid groupId, Guid targetUserId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _groupService.InviteMemberAsync(groupId, targetUserId, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Group or target user not found."));
            return Ok(new { Message = "User invited successfully." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{groupId:guid}/search-users")]
    public async Task<IActionResult> SearchUsersForInvite(Guid groupId, [FromQuery] string query = "")
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var users = await _groupService.SearchUsersForInviteAsync(groupId, query, currentUserId);
            return Ok(users);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
