using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/osis/recruitment")]
public class OsisRecruitmentController : ControllerBase
{
    private readonly IOsisRecruitmentService _recruitmentService;
    private readonly ICurrentUserService _currentUserService;

    public OsisRecruitmentController(IOsisRecruitmentService recruitmentService, ICurrentUserService currentUserService)
    {
        _recruitmentService = recruitmentService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet("positions")]
    public async Task<IActionResult> GetPositions([FromQuery] Guid? academicYearId)
    {
        var result = await _recruitmentService.GetPositionsAsync(academicYearId);
        return Ok(ApiResponse<List<OsisPositionResponse>>.Ok("Daftar posisi OSIS berhasil diambil", result));
    }

    [Authorize(Roles = "Admin,Teacher,OSIS")]
    [HttpPost("positions")]
    public async Task<IActionResult> CreatePosition([FromBody] CreateOsisPositionRequest request)
    {
        var result = await _recruitmentService.CreatePositionAsync(request);
        return Ok(ApiResponse<OsisPositionResponse>.Ok("Posisi OSIS baru berhasil ditambahkan", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("positions/{id:guid}")]
    public async Task<IActionResult> DeletePosition(Guid id)
    {
        var success = await _recruitmentService.DeletePositionAsync(id);
        if (!success) return NotFound(ApiResponse<object>.Fail("Posisi OSIS tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Posisi OSIS berhasil dihapus"));
    }

    [Authorize]
    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications([FromQuery] Guid? positionId, [FromQuery] Guid? studentId)
    {
        var result = await _recruitmentService.GetApplicationsAsync(positionId, studentId);
        return Ok(ApiResponse<List<OsisApplicationResponse>>.Ok("Daftar pendaftaran OSIS berhasil diambil", result));
    }

    [Authorize]
    [HttpPost("apply")]
    public async Task<IActionResult> SubmitApplication([FromBody] SubmitOsisApplicationRequest request)
    {
        var studentId = _currentUserService.UserId;
        if (!studentId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _recruitmentService.SubmitApplicationAsync(request, studentId.Value);
        return Ok(ApiResponse<OsisApplicationResponse>.Ok("Pendaftaran pengurus OSIS berhasil diajukan!", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("applications/{id:guid}/teacher-review")]
    public async Task<IActionResult> TeacherReview(Guid id, [FromBody] ReviewOsisApplicationRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _recruitmentService.ReviewApplicationByTeacherAsync(id, request, userId.Value);
        return Ok(ApiResponse<object>.Ok("Review Guru Pembina berhasil disimpan."));
    }

    [Authorize(Roles = "OSIS,Admin")]
    [HttpPost("applications/{id:guid}/chairman-review")]
    public async Task<IActionResult> ChairmanReview(Guid id, [FromBody] ReviewOsisApplicationRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _recruitmentService.ReviewApplicationByChairmanAsync(id, request, userId.Value);
        return Ok(ApiResponse<object>.Ok("Rekomendasi Ketua OSIS berhasil disimpan."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("applications/{id:guid}/admin-review")]
    public async Task<IActionResult> AdminReview(Guid id, [FromBody] ReviewOsisApplicationRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _recruitmentService.ReviewApplicationByAdminAsync(id, request, userId.Value);
        return Ok(ApiResponse<object>.Ok("Persetujuan Final Admin berhasil disimpan. Anggota resmi diterima di kabinet OSIS."));
    }

    [Authorize]
    [HttpGet("cabinet-structure")]
    public async Task<IActionResult> GetCabinetStructure([FromQuery] Guid? academicYearId)
    {
        var result = await _recruitmentService.GetCabinetStructureAsync(academicYearId);
        return Ok(ApiResponse<List<OsisCabinetMemberResponse>>.Ok("Struktur kabinet OSIS berhasil diambil", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost("cabinet-structure")]
    public async Task<IActionResult> AddCabinetMember([FromQuery] Guid academicYearId, [FromQuery] Guid studentId, [FromQuery] string positionTitle, [FromQuery] string department, [FromQuery] string? photoUrl)
    {
        var result = await _recruitmentService.AddCabinetMemberAsync(academicYearId, studentId, positionTitle, department, photoUrl);
        return Ok(ApiResponse<OsisCabinetMemberResponse>.Ok("Anggota kabinet OSIS berhasil ditambahkan", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("cabinet-structure/{id:guid}")]
    public async Task<IActionResult> DeleteCabinetMember(Guid id)
    {
        var success = await _recruitmentService.DeleteCabinetMemberAsync(id);
        if (!success) return NotFound(ApiResponse<object>.Fail("Anggota kabinet tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Anggota kabinet berhasil dihapus"));
    }
}
