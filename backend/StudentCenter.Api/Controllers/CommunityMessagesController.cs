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
        try
        {
            var currentUserId = GetCurrentUserId();
            var messages = await _messageService.GetGroupMessagesAsync(groupId, currentUserId, page, pageSize);
            return Ok(messages);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost]
    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendGroupMessageRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var message = await _messageService.SendMessageAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetGroupMessages), new { groupId = request.GroupId }, message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
    }
}
