using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/email")]
public class AdminEmailController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ICurrentUserService _currentUserService;
    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public AdminEmailController(IEmailService emailService, ICurrentUserService currentUserService)
    {
        _emailService = emailService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Returns current email sender and provider configuration status without revealing secrets.
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfigStatus()
    {
        var config = _emailService.GetConfigStatus();
        return Ok(ApiResponse<EmailConfigStatusResponse>.Ok("Email configuration status retrieved", config));
    }

    /// <summary>
    /// Sends a test email and logs the attempt in the database.
    /// </summary>
    [HttpPost("test")]
    public async Task<IActionResult> SendTestEmail([FromBody] SendTestEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.To))
        {
            return BadRequest(ApiResponse<object>.Fail("Alamat email tujuan (To) wajib diisi."));
        }

        var normalizedTo = request.To.Trim();
        if (normalizedTo.Length > 254 || !EmailRegex.IsMatch(normalizedTo))
        {
            return BadRequest(ApiResponse<object>.Fail("Format alamat email tujuan tidak valid atau melebihi batas 254 karakter."));
        }

        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest(ApiResponse<object>.Fail("Subjek email wajib diisi."));
        }

        if (request.Subject.Trim().Length > 200)
        {
            return BadRequest(ApiResponse<object>.Fail("Subjek email tidak boleh melebihi 200 karakter."));
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(ApiResponse<object>.Fail("Isi pesan email wajib diisi."));
        }

        if (request.Message.Length > 5000)
        {
            return BadRequest(ApiResponse<object>.Fail("Isi pesan email tidak boleh melebihi 5000 karakter."));
        }

        var currentAdminId = _currentUserService.UserId;

        var result = await _emailService.SendEmailAsync(
            to: normalizedTo,
            subject: request.Subject.Trim(),
            body: request.Message,
            isHtml: true,
            recipientUserId: request.RecipientUserId,
            createdByUserId: currentAdminId);

        if (result.Success)
        {
            return Ok(ApiResponse<SendEmailResult>.Ok("Email berhasil dikirim!", result));
        }

        return BadRequest(ApiResponse<SendEmailResult>.Fail(
            result.ErrorMessage ?? "Email gagal dikirim oleh provider.",
            errorCode: "EMAIL_SEND_FAILED"));
    }

    /// <summary>
    /// Retrieves paginated email logs.
    /// </summary>
    [HttpGet("logs")]
    public async Task<IActionResult> GetEmailLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        var logs = await _emailService.GetEmailLogsAsync(page, pageSize, search);
        return Ok(ApiResponse<PagedResult<EmailLogResponse>>.Ok("Email logs retrieved successfully", logs));
    }

    /// <summary>
    /// Retrieves a single email log with full provider response and error message.
    /// </summary>
    [HttpGet("logs/{id:guid}")]
    public async Task<IActionResult> GetEmailLogById(Guid id)
    {
        var log = await _emailService.GetEmailLogByIdAsync(id);
        if (log == null)
        {
            return NotFound(ApiResponse<object>.Fail("Log email tidak ditemukan."));
        }

        return Ok(ApiResponse<EmailLogResponse>.Ok("Email log retrieved successfully", log));
    }
}
