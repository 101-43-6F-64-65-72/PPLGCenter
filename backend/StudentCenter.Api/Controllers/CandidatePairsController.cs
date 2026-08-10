using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/candidate-pairs")]
public class CandidatePairsController : ControllerBase
{
    private readonly ICandidatePairService _candidatePairService;
    private readonly ICurrentUserService _currentUserService;

    public CandidatePairsController(ICandidatePairService candidatePairService, ICurrentUserService currentUserService)
    {
        _candidatePairService = candidatePairService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet("eligible-vices")]
    public async Task<IActionResult> GetEligibleViceCandidates([FromQuery] string? search = null, [FromQuery] Guid? electionId = null)
    {
        var currentUserId = _currentUserService.UserId;
        var result = await _candidatePairService.GetEligibleViceCandidatesAsync(search, electionId, currentUserId);
        return Ok(ApiResponse<List<UserResponse>>.Ok("Daftar calon wakil berhasil diambil", result));
    }

    [Authorize]
    [HttpGet("election/{electionId:guid}")]
    public async Task<IActionResult> GetPairs(Guid electionId)
    {
        var userId = _currentUserService.UserId;
        var result = await _candidatePairService.GetCandidatePairsAsync(electionId, userId);
        return Ok(ApiResponse<List<CandidatePairResponse>>.Ok("Daftar pasangan calon berhasil diambil", result));
    }

    [Authorize]
    [HttpGet("election/{electionId:guid}/eligibility")]
    public async Task<IActionResult> GetEligibility(Guid electionId)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _candidatePairService.CheckEligibilityAsync(electionId, userId.Value);
        return Ok(ApiResponse<ElectionEligibilityResponse>.Ok("Status kelayakan calon berhasil diperiksa", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPairById(Guid id)
    {
        var userId = _currentUserService.UserId;
        var result = await _candidatePairService.GetCandidatePairByIdAsync(id, userId);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Pasangan calon tidak ditemukan."));
        return Ok(ApiResponse<CandidatePairResponse>.Ok("Detail pasangan calon berhasil diambil", result));
    }

    [Authorize(Roles = "Student,Admin,Teacher")]
    [HttpPost("register-chairman")]
    public async Task<IActionResult> RegisterChairman([FromBody] RegisterChairmanRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _candidatePairService.RegisterChairmanAsync(request, userId.Value);
        return Ok(ApiResponse<CandidatePairResponse>.Ok("Pendaftaran Calon Ketua berhasil diajukan!", result));
    }

    /// <summary>
    /// Unified atomic registration of a Ketua + Wakil pair in one request.
    /// The logged-in user is automatically the Chairman.
    /// </summary>
    [Authorize(Roles = "Student,Admin,Teacher")]
    [HttpPost("register-pair")]
    public async Task<IActionResult> RegisterPair([FromBody] RegisterPairRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _candidatePairService.RegisterPairAsync(request, userId.Value);
        return Ok(ApiResponse<CandidatePairResponse>.Ok("Pendaftaran Pasangan Calon berhasil diajukan! Menunggu review guru pembina.", result));
    }

    [Authorize(Roles = "Student,Admin,Teacher")]
    [HttpPost("{id:guid}/apply-vice")]
    public async Task<IActionResult> ApplyVice(Guid id, [FromBody] ApplyViceRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _candidatePairService.ApplyViceAsync(id, request, userId.Value);
        return Ok(ApiResponse<CandidatePairResponse>.Ok("Permohonan Calon Wakil Ketua berhasil diajukan!", result));
    }

    [Authorize(Roles = "Student")]
    [HttpPost("{id:guid}/chairman-review")]
    public async Task<IActionResult> ChairmanReviewVice(Guid id, [FromQuery] bool accept)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _candidatePairService.ChairmanReviewViceAsync(id, accept, userId.Value);
        return Ok(ApiResponse<object>.Ok(accept ? "Calon Wakil berhasil disetujui oleh Calon Ketua." : "Calon Wakil ditolak."));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("{id:guid}/teacher-review")]
    public async Task<IActionResult> TeacherReview(Guid id, [FromBody] ReviewCandidatePairRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _candidatePairService.TeacherReviewPairAsync(id, request, userId.Value);
        return Ok(ApiResponse<object>.Ok("Review Guru Pembina berhasil disimpan."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/admin-review")]
    public async Task<IActionResult> AdminReview(Guid id, [FromBody] ReviewCandidatePairRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _candidatePairService.AdminReviewPairAsync(id, request, userId.Value);
        return Ok(ApiResponse<object>.Ok("Persetujuan Final Admin berhasil disimpan. Pasangan resmi dipublikasikan."));
    }

    [Authorize]
    [HttpPost("election/{electionId:guid}/vote")]
    public async Task<IActionResult> CastVote(Guid electionId, [FromBody] CastPairVoteRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _candidatePairService.CastVoteAsync(electionId, request.CandidatePairId, userId.Value);
        return Ok(ApiResponse<object>.Ok("Suara Anda berhasil diberikan untuk Pasangan Calon pilihan!"));
    }

    [Authorize]
    [HttpGet("election/{electionId:guid}/live-results")]
    public async Task<IActionResult> GetLiveResults(Guid electionId)
    {
        var userId = _currentUserService.UserId;
        var result = await _candidatePairService.GetLiveResultsAsync(electionId, userId);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Pemilihan tidak ditemukan."));
        return Ok(ApiResponse<PemilosLiveResultResponse>.Ok("Hasil perolehan suara live berhasil diambil", result));
    }
}
