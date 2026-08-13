using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommunityMessagesController : ControllerBase
{
    private readonly IGroupMessageService _messageService;

    public CommunityMessagesController(IGroupMessageService messageService)
    {
        _messageService = messageService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("group/{groupId:guid}")]
    public async Task<IActionResult> GetGroupMessages(Guid groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = GetCurrentUserId();
        var messages = await _messageService.GetGroupMessagesAsync(groupId, currentUserId, page, pageSize);
        return Ok(messages);
    }

    [HttpPost]
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendGroupMessageRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var message = await _messageService.SendMessageAsync(request, currentUserId);
        return CreatedAtAction(nameof(GetGroupMessages), new { groupId = request.GroupId }, message);
    }
}
