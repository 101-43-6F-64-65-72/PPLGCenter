using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    /// <summary>
    /// Kirim umpan balik / kritik dan saran (Terbuka untuk semua pengguna & tamu)
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateFeedback([FromBody] CreateFeedbackRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        Guid? userId = null;
        string? userName = null;
        string? userRole = null;
        string? userIdentifier = null;

        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var parsedId))
            {
                userId = parsedId;
            }

            userName = User.FindFirst(ClaimTypes.Name)?.Value 
                       ?? User.FindFirst("name")?.Value 
                       ?? User.FindFirst("FullName")?.Value;

            userRole = User.FindFirst(ClaimTypes.Role)?.Value 
                       ?? User.FindFirst("role")?.Value 
                       ?? "Student";

            userIdentifier = User.FindFirst(ClaimTypes.Email)?.Value 
                             ?? User.FindFirst("identifier")?.Value 
                             ?? User.FindFirst("nisn")?.Value 
                             ?? User.FindFirst("nip")?.Value;
        }

        var result = await _feedbackService.CreateFeedbackAsync(request, userId, userName, userRole, userIdentifier);
        return Ok(new
        {
            success = true,
            message = "Terima kasih! Umpan balik Anda berhasil dikirim.",
            data = result
        });
    }

    /// <summary>
    /// Ambil daftar umpan balik (HANYA ADMIN)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetFeedbacks(
        [FromQuery] string? category,
        [FromQuery] int? rating,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var result = await _feedbackService.GetFeedbacksAsync(category, rating, status, search, page, pageSize);
        return Ok(new
        {
            success = true,
            data = result
        });
    }

    /// <summary>
    /// Ambil ringkasan statistik umpan balik (HANYA ADMIN)
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetFeedbackSummary()
    {
        var result = await _feedbackService.GetFeedbackSummaryAsync();
        return Ok(new
        {
            success = true,
            data = result
        });
    }

    /// <summary>
    /// Perbarui status umpan balik & catatan admin (HANYA ADMIN)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateFeedbackStatus(Guid id, [FromBody] UpdateFeedbackStatusRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _feedbackService.UpdateFeedbackStatusAsync(id, request);
        if (result == null)
        {
            return NotFound(new { success = false, message = "Umpan balik tidak ditemukan." });
        }

        return Ok(new
        {
            success = true,
            message = "Status umpan balik berhasil diperbarui.",
            data = result
        });
    }

    /// <summary>
    /// Hapus umpan balik (HANYA ADMIN)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteFeedback(Guid id)
    {
        var success = await _feedbackService.DeleteFeedbackAsync(id);
        if (!success)
        {
            return NotFound(new { success = false, message = "Umpan balik tidak ditemukan." });
        }

        return Ok(new
        {
            success = true,
            message = "Umpan balik berhasil dihapus."
        });
    }
}
