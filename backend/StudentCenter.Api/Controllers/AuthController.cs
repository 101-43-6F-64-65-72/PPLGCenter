using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

/// <summary>
/// Manages user authentication and authorization operations.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserService _currentUserService;

    /// <summary>
    /// Initializes a new instance of the AuthController.
    /// </summary>
    public AuthController(IUserService userService, ICurrentUserService currentUserService)
    {
        _userService = userService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Authenticates a user and returns a JWT token.
    /// </summary>
    /// <param name="request">The login credentials.</param>
    /// <returns>A JWT token upon successful authentication.</returns>
    /// <response code="200">Login successful, returns token.</response>
    /// <response code="401">Invalid credentials.</response>
    /// <response code="403">Account is inactive.</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
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

    /// <summary>
    /// Retrieves the current authenticated user's information.
    /// </summary>
    /// <returns>The authenticated user's details.</returns>
    /// <response code="200">User information retrieved successfully.</response>
    /// <response code="401">User not authenticated.</response>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
        {
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));
        }

        var user = await _userService.GetUserByIdAsync(userId.Value);
        if (user is null)
        {
            return NotFound(ApiResponse<object>.Fail("User not found."));
        }

        return Ok(ApiResponse<UserResponse>.Ok("User retrieved successfully", user));
    }
}
