using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/extracurricular-members")]
[Authorize]
public class ExtracurricularMembersController : ControllerBase
{
    private readonly IExtracurricularService _extracurricularService;

    public ExtracurricularMembersController(IExtracurricularService extracurricularService)
    {
        _extracurricularService = extracurricularService;
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{extracurricularId:guid}/members/{memberId:guid}/status")]
    public async Task<IActionResult> UpdateMemberStatus(Guid extracurricularId, Guid memberId, [FromBody] UpdateMemberStatusRequest request)
    {
        try
        {
            var success = await _extracurricularService.UpdateMemberStatusAsync(extracurricularId, memberId, request.Status, GetUserId());
            if (!success) return NotFound(ApiResponse<object>.Fail("Member not found."));
            return Ok(ApiResponse<object>.Ok("Member status updated successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }
}

public class UpdateMemberStatusRequest
{
    public string Status { get; set; } = "Active"; // Active | Removed
}
