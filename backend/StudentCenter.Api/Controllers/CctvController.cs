using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/cctv")]
public class CctvController : ControllerBase
{
    private readonly ICctvService _cctvService;
    private const string GatewayApiKeyHeader = "X-Gateway-Api-Key";
    private static readonly string ServerMachineApiKey = Environment.GetEnvironmentVariable("CCTV_GATEWAY_API_KEY") ?? "CctvEdgeGatewaySecretApiKey2026!";

    public CctvController(ICctvService cctvService)
    {
        _cctvService = cctvService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool TryAuthenticateMachineGateway(out string authenticatedGatewayId)
    {
        authenticatedGatewayId = string.Empty;
        if (!Request.Headers.TryGetValue(GatewayApiKeyHeader, out var apiKeyHeader) || string.IsNullOrWhiteSpace(apiKeyHeader))
        {
            return false;
        }

        if (apiKeyHeader.ToString() != ServerMachineApiKey)
        {
            return false;
        }

        // Authoritatively map machine API key to server-side registered Edge Gateway identity
        authenticatedGatewayId = "gateway-school-main";
        return true;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetCameras()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var cameras = await _cctvService.GetCamerasAsync(currentUserId);
            return Ok(cameras);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetCameraById(Guid id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var camera = await _cctvService.GetCameraByIdAsync(id, currentUserId);
            if (camera is null) return NotFound(ApiResponse<object>.Fail("Kamera CCTV tidak ditemukan."));
            return Ok(camera);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateCamera([FromBody] CreateCctvCameraRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var camera = await _cctvService.CreateCameraAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetCameraById), new { id = camera.Id }, camera);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/toggle")]
    [Authorize]
    public async Task<IActionResult> ToggleCamera(Guid id, [FromQuery] bool isEnabled)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _cctvService.ToggleCameraStatusAsync(id, isEnabled, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Kamera CCTV tidak ditemukan."));
            return Ok(new { Message = "Status aktif kamera berhasil diperbarui." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("{id:guid}/status")]
    [Authorize]
    public async Task<IActionResult> UpdateCameraStatus(Guid id, [FromQuery] CctvCameraStatus newStatus)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _cctvService.UpdateCameraStatusAsync(id, "gateway-school-main", newStatus, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Kamera CCTV tidak ditemukan."));
            return Ok(new { Message = "Transisi status kamera berhasil diperbarui." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteCamera(Guid id)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _cctvService.DeleteCameraAsync(id, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Kamera CCTV tidak ditemukan."));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("discover")]
    [Authorize]
    public async Task<IActionResult> DiscoverCameras()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var discovered = await _cctvService.DiscoverCamerasAsync(currentUserId);
            return Ok(discovered);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEDICATED MACHINE AUTHENTICATION ENDPOINTS FOR EDGE CCTV GATEWAY
    // ─────────────────────────────────────────────────────────────────────────

    [HttpPost("gateway/heartbeat")]
    public async Task<IActionResult> ProcessGatewayHeartbeat([FromBody] EdgeGatewayHeartbeatRequest request)
    {
        if (!TryAuthenticateMachineGateway(out var authenticatedGatewayId))
        {
            return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse<object>.Fail("Autentikasi mesin Edge Gateway gagal. Kunci X-Gateway-Api-Key tidak valid."));
        }

        try
        {
            await _cctvService.ProcessGatewayHeartbeatAsync(authenticatedGatewayId, request);
            return Ok(new { Message = "Telemetri heartbeat gateway berhasil diproses.", GatewayId = authenticatedGatewayId });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("gateway/discovery")]
    public async Task<IActionResult> IngestGatewayDiscovery([FromBody] EdgeGatewayDiscoveryRequest request)
    {
        if (!TryAuthenticateMachineGateway(out var authenticatedGatewayId))
        {
            return StatusCode(StatusCodes.Status401Unauthorized, ApiResponse<object>.Fail("Autentikasi mesin Edge Gateway gagal. Kunci X-Gateway-Api-Key tidak valid."));
        }

        try
        {
            var cameras = await _cctvService.IngestGatewayDiscoveryAsync(authenticatedGatewayId, request);
            return Ok(cameras);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}
