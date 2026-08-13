using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassLeadershipController : ControllerBase
{
    private readonly IClassLeadershipService _leadershipService;

    public ClassLeadershipController(IClassLeadershipService leadershipService)
    {
        _leadershipService = leadershipService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("class/{schoolClassId:guid}/active")]
    public async Task<IActionResult> GetActiveLeadership(Guid schoolClassId)
    {
        var active = await _leadershipService.GetActiveLeadershipAsync(schoolClassId);
        if (active is null) return NotFound("No active leadership record for this class.");
        return Ok(active);
    }

    [HttpGet("class/{schoolClassId:guid}/history")]
    public async Task<IActionResult> GetLeadershipHistory(Guid schoolClassId)
    {
        var history = await _leadershipService.GetLeadershipHistoryAsync(schoolClassId);
        return Ok(history);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> AppointLeadership([FromBody] AppointLeadershipRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var appointed = await _leadershipService.AppointLeadershipAsync(request, currentUserId);
        return CreatedAtAction(nameof(GetActiveLeadership), new { schoolClassId = request.SchoolClassId }, appointed);
    }
}
