using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/elections")]
public class ElectionsController : ControllerBase
{
    private readonly IElectionService _electionService;
    private readonly ICurrentUserService _currentUserService;

    public ElectionsController(IElectionService electionService, ICurrentUserService currentUserService)
    {
        _electionService = electionService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetElections([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var userId = _currentUserService.UserId;
        var result = await _electionService.GetElectionsAsync(page, pageSize, userId);
        return Ok(ApiResponse<PagedResult<ElectionResponse>>.Ok("Data pemilu berhasil diambil", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetElectionById(Guid id)
    {
        var userId = _currentUserService.UserId;
        var result = await _electionService.GetElectionByIdAsync(id, userId);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<ElectionResponse>.Ok("Detail pemilu berhasil diambil", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateElection([FromBody] CreateElectionRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.CreateElectionAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetElectionById), new { id = result.Id }, ApiResponse<ElectionResponse>.Ok("Pemilu berhasil dibuat", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateElection(Guid id, [FromBody] UpdateElectionRequest request)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.UpdateElectionAsync(id, request, userId.Value, role);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<ElectionResponse>.Ok("Pemilu berhasil diperbarui", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteElection(Guid id)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.DeleteElectionAsync(id, userId.Value, role);
        if (!result) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Pemilu berhasil dihapus"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/candidates")]
    public async Task<IActionResult> AddCandidate(Guid id, [FromBody] CreateCandidateRequest request)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.AddCandidateAsync(id, request, userId.Value, role);
        return Ok(ApiResponse<ElectionCandidateResponse>.Ok("Kandidat berhasil ditambahkan", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}/candidates/{candidateId:guid}")]
    public async Task<IActionResult> RemoveCandidate(Guid id, Guid candidateId)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.RemoveCandidateAsync(id, candidateId, userId.Value, role);
        if (!result) return NotFound(ApiResponse<object>.Fail("Kandidat tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Kandidat berhasil dihapus"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/open")]
    public async Task<IActionResult> OpenElection(Guid id)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.OpenElectionAsync(id, userId.Value, role);
        if (!result) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Pemilu berhasil dibuka untuk voting"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> CloseElection(Guid id)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.CloseElectionAsync(id, userId.Value, role);
        if (!result) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Pemilu berhasil ditutup"));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishResult(Guid id)
    {
        var userId = _currentUserService.UserId;
        var role = _currentUserService.Role ?? string.Empty;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var result = await _electionService.PublishResultAsync(id, userId.Value, role);
        if (!result) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<object>.Ok("Hasil pemilu berhasil dipublikasikan"));
    }

    [Authorize]
    [HttpPost("{id:guid}/vote")]
    public async Task<IActionResult> Vote(Guid id, [FromBody] VoteRequest request)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized(ApiResponse<object>.Fail("Identitas pengguna tidak ditemukan."));

        var success = await _electionService.VoteAsync(id, request, userId.Value);
        return Ok(ApiResponse<object>.Ok("Suara Anda berhasil disimpan!"));
    }

    [Authorize]
    [HttpGet("{id:guid}/result")]
    public async Task<IActionResult> GetResult(Guid id)
    {
        var result = await _electionService.GetResultAsync(id);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<ElectionResultResponse>.Ok("Hasil pemilu berhasil diambil", result));
    }

    [Authorize]
    [HttpGet("{id:guid}/participation")]
    public async Task<IActionResult> GetParticipation(Guid id)
    {
        var result = await _electionService.GetParticipationAsync(id);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Pemilu tidak ditemukan."));
        return Ok(ApiResponse<ParticipationResponse>.Ok("Tingkat partisipasi pemilu berhasil diambil", result));
    }
}
