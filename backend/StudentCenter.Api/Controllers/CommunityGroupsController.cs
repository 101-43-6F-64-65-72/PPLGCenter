using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        var currentUserId = GetCurrentUserId();
        var groups = await _groupService.GetGroupsAsync(currentUserId, page, pageSize, search);
        return Ok(groups);
    }

    [HttpGet("{groupId:guid}")]
    public async Task<IActionResult> GetGroupById(Guid groupId)
    {
        var currentUserId = GetCurrentUserId();
        var group = await _groupService.GetGroupByIdAsync(groupId, currentUserId);
        if (group is null) return NotFound("Community group not found.");
        return Ok(group);
    }

    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateCommunityGroupRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var group = await _groupService.CreateGroupAsync(request, currentUserId);
        return CreatedAtAction(nameof(GetGroupById), new { groupId = group.Id }, group);
    }

    [HttpPost("{groupId:guid}/join")]
    public async Task<IActionResult> JoinGroup(Guid groupId)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _groupService.JoinGroupRequestAsync(groupId, currentUserId);
        if (!success) return NotFound("Group not found.");
        return Ok(new { Message = "Join request submitted." });
    }

    [HttpGet("{groupId:guid}/members")]
    public async Task<IActionResult> GetMembers(Guid groupId)
    {
        var currentUserId = GetCurrentUserId();
        var members = await _groupService.GetMembersAsync(groupId, currentUserId);
        return Ok(members);
    }

    [HttpPost("{groupId:guid}/members/{targetUserId:guid}")]
    public async Task<IActionResult> ManageMember(Guid groupId, Guid targetUserId, [FromBody] ManageMemberRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var member = await _groupService.ManageMemberAsync(groupId, targetUserId, request, currentUserId);
        if (member is null) return NotFound("Member or group not found.");
        return Ok(member);
    }

    [HttpPost("{groupId:guid}/leave")]
    public async Task<IActionResult> LeaveGroup(Guid groupId)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _groupService.LeaveGroupAsync(groupId, currentUserId);
        if (!success) return NotFound("Membership not found.");
        return NoContent();
    }
}
