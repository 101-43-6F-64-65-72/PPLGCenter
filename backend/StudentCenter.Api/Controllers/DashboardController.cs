using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IDashboardAggregationService _aggregationService;

    public DashboardController(IDashboardService dashboardService, IDashboardAggregationService aggregationService)
    {
        _dashboardService = dashboardService;
        _aggregationService = aggregationService;
    }

    [HttpGet]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _dashboardService.GetSummaryAsync();
        return Ok(ApiResponse<DashboardSummaryResponse>.Ok("Dashboard summary retrieved successfully", result));
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var result = await _aggregationService.GetAdminDashboardAsync();
        return Ok(ApiResponse<AdminDashboardResponse>.SuccessResponse(result));
    }

    [HttpGet("teacher")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> GetTeacherDashboard()
    {
        var teacherId = GetCurrentUserId();
        var result = await _aggregationService.GetTeacherDashboardAsync(teacherId);
        return Ok(ApiResponse<TeacherDashboardResponse>.SuccessResponse(result));
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student,Admin")]
    public async Task<IActionResult> GetStudentDashboard()
    {
        var studentId = GetCurrentUserId();
        var result = await _aggregationService.GetStudentDashboardAsync(studentId);
        return Ok(ApiResponse<StudentDashboardResponse>.SuccessResponse(result));
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
