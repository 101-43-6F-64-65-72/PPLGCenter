using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessageController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var result = await _messageService.SendMessageAsync(GetUserId(), request);
        return Ok(result);
    }

    [HttpGet("conversation/{conversationId}")]
    public async Task<IActionResult> GetConversationMessages(Guid conversationId, [FromQuery] string? cursor, [FromQuery] int limit = 30)
    {
        var result = await _messageService.GetConversationMessagesAsync(GetUserId(), conversationId, cursor, limit);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMessage(Guid id)
    {
        var success = await _messageService.DeleteMessageAsync(GetUserId(), id);
        if (!success) return NotFound();
        return NoContent();
    }
}
