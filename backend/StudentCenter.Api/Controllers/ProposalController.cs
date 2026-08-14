using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/proposals")]
public class ProposalController : ControllerBase
{
    private readonly IProposalService _proposalService;
    private readonly ICurrentUserService _currentUserService;

    public ProposalController(IProposalService proposalService, ICurrentUserService currentUserService)
    {
        _proposalService = proposalService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetProposals(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? userId = null,
        [FromQuery] ProposalStatus? status = null)
    {
        var requestingUserId = _currentUserService.UserId;
        var requestingUserRole = _currentUserService.Role;
        var result = await _proposalService.GetProposalsAsync(page, pageSize, userId, status, requestingUserId, requestingUserRole);
        return Ok(ApiResponse<PagedResult<ProposalResponse>>.Ok("Proposals retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetProposal(Guid id)
    {
        var result = await _proposalService.GetProposalByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Proposal not found."));

        return Ok(ApiResponse<ProposalResponse>.Ok("Proposal retrieved successfully", result));
    }

    [Authorize(Roles = "Student,OSIS")]
    [HttpPost]
    public async Task<IActionResult> CreateProposal([FromBody] CreateProposalRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _proposalService.CreateProposalAsync(request, userId.Value);
        return Ok(ApiResponse<ProposalResponse>.Ok("Proposal created successfully", result));
    }

    [Authorize(Roles = "Student,Teacher,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProposal(Guid id, [FromBody] UpdateProposalRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _proposalService.UpdateProposalAsync(id, request, userId.Value);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Proposal not found."));

        return Ok(ApiResponse<ProposalResponse>.Ok("Proposal updated successfully", result));
    }

    [Authorize(Roles = "Student,Teacher,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProposal(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _proposalService.DeleteProposalAsync(id, userId.Value);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Proposal not found."));

        return Ok(ApiResponse<object>.Ok("Proposal deleted successfully"));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPatch("{id:guid}/review")]
    public async Task<IActionResult> ReviewProposal(Guid id, [FromBody] ReviewProposalRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _proposalService.ReviewProposalAsync(id, request, userId.Value);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Proposal not found."));

        return Ok(ApiResponse<ProposalResponse>.Ok("Proposal reviewed successfully", result));
    }
}
