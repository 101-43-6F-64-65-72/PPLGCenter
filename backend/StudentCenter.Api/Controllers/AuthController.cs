using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(IUserService userService, ICurrentUserService currentUserService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _userService.LoginAsync(request);

        return result.Status switch
        {
            LoginStatus.UserNotFound => Unauthorized(ApiResponse<object>.Fail("Invalid email or password")),
            LoginStatus.InvalidPassword => Unauthorized(ApiResponse<object>.Fail("Invalid email or password")),
            LoginStatus.UserInactive => StatusCode(403, ApiResponse<object>.Fail("Account is inactive")),
            LoginStatus.Success => Ok(ApiResponse<LoginResponse>.Ok("Login successful", result.Data)),
            _ => StatusCode(500, ApiResponse<object>.Fail("An unexpected error occurred"))
        };
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
        {
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));
        }

        var user = new CurrentUserResponse
        {
            Id = userId.Value,
            FullName = _currentUserService.FullName ?? "Unknown",
            Email = _currentUserService.Email ?? string.Empty,
            Role = _currentUserService.Role ?? string.Empty
        };

        return Ok(ApiResponse<CurrentUserResponse>.Ok("User retrieved successfully", user));
    }
}
