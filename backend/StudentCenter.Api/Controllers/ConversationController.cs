using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public class ConversationController : ControllerBase
{
    private readonly IMessageService _messageService;

    public ConversationController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> GetOrCreateDirectConversation([FromBody] CreateConversationRequest request)
    {
        var result = await _messageService.GetOrCreateDirectConversationAsync(GetUserId(), request.RecipientUserId, request.InitialMessage);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetUserConversations([FromQuery] string? cursor, [FromQuery] int limit = 20)
    {
        var result = await _messageService.GetUserConversationsAsync(GetUserId(), cursor, limit);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConversationById(Guid id)
    {
        var result = await _messageService.GetConversationByIdAsync(GetUserId(), id);
        return Ok(result);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var success = await _messageService.MarkConversationAsReadAsync(GetUserId(), id);
        if (!success) return NotFound();
        return Ok();
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _messageService.GetTotalUnreadMessagesCountAsync(GetUserId());
        return Ok(new { unreadCount = count });
    }
}
