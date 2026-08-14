using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IUserPermissionService _permissionService;

    public PermissionsController(IUserPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetUserPermissions(Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId != userId && !User.IsInRole("Admin"))
            return Forbid("Only Admin can view another user's permissions.");

        var permissions = await _permissionService.GetUserPermissionsAsync(userId);
        return Ok(permissions);
    }

    [HttpPost("grant")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GrantPermission([FromBody] GrantPermissionRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var perm = await _permissionService.GrantPermissionAsync(request, currentUserId);
        return Ok(perm);
    }

    [HttpDelete("revoke/user/{userId:guid}/capability/{capability}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RevokePermission(Guid userId, string capability)
    {
        var success = await _permissionService.RevokePermissionAsync(userId, capability);
        if (!success) return NotFound("Permission not found.");
        return NoContent();
    }
}
