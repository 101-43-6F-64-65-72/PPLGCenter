using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Enums;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

/// <summary>
/// Manages user administration operations (Admin only).
/// </summary>
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(IUserService userService, ICurrentUserService currentUserService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] UserRole? role = null,
        [FromQuery] bool? isActive = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search, role, isActive);
        return Ok(ApiResponse<PagedResult<UserResponse>>.Ok("Users retrieved successfully", result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<UserResponse>.Ok("User retrieved successfully", result));
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var result = await _userService.CreateUserAsync(request);
        if (result is null)
            return BadRequest(ApiResponse<object>.Fail("Could not create user."));

        return CreatedAtAction(nameof(GetUser), new { id = result.Id },
            ApiResponse<UserResponse>.Ok("User created successfully", result));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var result = await _userService.UpdateUserAsync(id, request);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<UserResponse>.Ok("User updated successfully", result));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        var result = await _userService.UpdateUserStatusAsync(id, request.IsActive);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<UserResponse>.Ok("User status updated successfully", result));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId.HasValue && currentUserId.Value == id)
        {
            return BadRequest(ApiResponse<object>.Fail("You cannot delete your own user account."));
        }

        var result = await _userService.DeleteUserAsync(id);
        if (!result)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<object>.Ok("User deleted successfully"));
    }
}
