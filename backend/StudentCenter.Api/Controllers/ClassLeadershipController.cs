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

    private (Guid UserId, string UserRole) GetCurrentIdentity()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        var role = User.IsInRole("Admin") ? "Admin" : (User.IsInRole("Teacher") ? "Teacher" : "Student");
        return (userId, role);
    }

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
        try
        {
            var (currentUserId, currentUserRole) = GetCurrentIdentity();
            var appointed = await _leadershipService.AppointLeadershipAsync(request, currentUserId, currentUserRole);
            return CreatedAtAction(nameof(GetActiveLeadership), new { schoolClassId = request.SchoolClassId }, appointed);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ex.Message);
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
