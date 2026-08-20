using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Enums;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

/// <summary>
/// Manages user operations and administration.
/// </summary>
[Authorize]
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

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        [FromQuery] string? search = null,
        [FromQuery] UserRole? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] Guid? departmentId = null)
    {
        var result = await _userService.GetUsersAsync(page, pageSize, search, role, isActive, classId, departmentId);
        return Ok(ApiResponse<PagedResult<UserResponse>>.Ok("Users retrieved successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpGet("teachers")]
    public async Task<IActionResult> GetActiveTeachers()
    {
        var teachers = await _userService.GetActiveTeachersAsync();
        return Ok(ApiResponse<List<UserResponse>>.Ok("Active teachers retrieved successfully", teachers));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var currentUserId = _currentUserService.UserId;
        var currentUserRole = _currentUserService.Role;
        var result = await _userService.GetUserByIdAsync(id, currentUserId, currentUserRole);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<UserResponse>.Ok("User retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
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
        var currentUserId = _currentUserService.UserId;
        var currentUserRole = _currentUserService.Role;
        var isSelf = currentUserId.HasValue && currentUserId.Value == id;
        var isAdmin = User.IsInRole("Admin");

        if (!isSelf && !isAdmin)
        {
            return StatusCode(403, ApiResponse<object>.Fail("Forbidden. You do not have permission to access this resource."));
        }

        try
        {
            var result = await _userService.UpdateUserAsync(id, request, currentUserId, currentUserRole);
            if (result is null)
                return NotFound(ApiResponse<object>.Fail("User not found"));

            return Ok(ApiResponse<UserResponse>.Ok("User updated successfully", result));
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        var result = await _userService.UpdateUserStatusAsync(id, request.IsActive);
        if (result is null)
            return NotFound(ApiResponse<object>.Fail("User not found"));

        return Ok(ApiResponse<UserResponse>.Ok("User status updated successfully", result));
    }

    [Authorize(Roles = "Admin")]
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
