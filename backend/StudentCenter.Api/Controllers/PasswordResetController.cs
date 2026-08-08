using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/auth/reset-password")]
public class PasswordResetController : ControllerBase
{
    private readonly IPasswordResetService _resetService;
    private readonly ICurrentUserService _currentUserService;

    public PasswordResetController(IPasswordResetService resetService, ICurrentUserService currentUserService)
    {
        _resetService = resetService;
        _currentUserService = currentUserService;
    }

    [HttpPost("request")]
    public async Task<IActionResult> CreateRequest([FromBody] CreatePasswordResetRequest request)
    {
        var result = await _resetService.CreateResetRequestAsync(request);
        return Ok(ApiResponse<CreatePasswordResetResponse>.Ok("Permohonan reset password berhasil dibuat.", result));
    }

    [HttpGet("status/{requestId:guid}")]
    public async Task<IActionResult> GetRequestStatus(Guid requestId)
    {
        var result = await _resetService.GetRequestStatusAsync(requestId);
        if (result is null)
        {
            return NotFound(ApiResponse<object>.Fail("Permohonan reset password tidak ditemukan."));
        }

        return Ok(ApiResponse<PasswordResetRequestResponse>.Ok("Status permohonan berhasil diambil.", result));
    }

    [HttpGet("status-by-identifier/{identifier}")]
    public async Task<IActionResult> GetRequestStatusByIdentifier(string identifier)
    {
        var result = await _resetService.GetRequestStatusByIdentifierAsync(identifier);
        if (result is null)
        {
            return NotFound(ApiResponse<object>.Fail("Permohonan reset password tidak ditemukan untuk akun ini."));
        }

        return Ok(ApiResponse<PasswordResetRequestResponse>.Ok("Status permohonan berhasil diambil.", result));
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> ConfirmReset([FromBody] ConfirmResetPasswordRequest request)
    {
        await _resetService.ConfirmResetPasswordAsync(request);
        return Ok(ApiResponse<object>.Ok("Password berhasil diperbarui! Silakan login dengan password baru Anda."));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/requests")]
    public async Task<IActionResult> GetPendingRequests()
    {
        var result = await _resetService.GetPendingRequestsAsync();
        return Ok(ApiResponse<List<PasswordResetRequestResponse>>.Ok("Daftar permohonan reset password berhasil diambil.", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin/{requestId:guid}/review")]
    public async Task<IActionResult> ReviewRequest(Guid requestId, [FromBody] ReviewPasswordResetRequest request)
    {
        var adminUserId = _currentUserService.UserId;
        if (!adminUserId.HasValue)
        {
            return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));
        }

        var result = await _resetService.ReviewResetRequestAsync(requestId, request, adminUserId.Value);
        var message = request.IsApproved ? "Permohonan reset password berhasil disetujui." : "Permohonan reset password ditolak.";
        return Ok(ApiResponse<object>.Ok(message));
    }
}
