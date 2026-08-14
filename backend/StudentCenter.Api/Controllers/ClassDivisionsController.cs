using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassDivisionsController : ControllerBase
{
    private readonly IClassDivisionService _divisionService;

    public ClassDivisionsController(IClassDivisionService divisionService)
    {
        _divisionService = divisionService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("class/{schoolClassId:guid}")]
    public async Task<IActionResult> GetDivisionTree(Guid schoolClassId)
    {
        var tree = await _divisionService.GetDivisionTreeAsync(schoolClassId);
        return Ok(tree);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDivision([FromBody] CreateClassDivisionRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var authorized = await _divisionService.IsUserAuthorizedToManageClassTreeAsync(currentUserId, request.SchoolClassId);
        if (!authorized)
            return Forbid("Only Admin, Teacher, or assigned Ketua Kelas can manage this class division tree.");

        var division = await _divisionService.CreateDivisionAsync(request);
        return CreatedAtAction(nameof(GetDivisionTree), new { schoolClassId = request.SchoolClassId }, division);
    }

    [HttpPut("{divisionId:guid}")]
    public async Task<IActionResult> UpdateDivision(Guid divisionId, [FromBody] UpdateClassDivisionRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var existing = await _divisionService.GetDivisionByIdAsync(divisionId);
        if (existing is null) return NotFound("Division not found.");

        var authorized = await _divisionService.IsUserAuthorizedToManageClassTreeAsync(currentUserId, existing.SchoolClassId);
        if (!authorized)
            return Forbid("Only Admin, Teacher, or assigned Ketua Kelas can manage this class division tree.");

        var division = await _divisionService.UpdateDivisionAsync(divisionId, request);
        return Ok(division);
    }

    [HttpDelete("{divisionId:guid}")]
    public async Task<IActionResult> DeleteDivision(Guid divisionId)
    {
        var currentUserId = GetCurrentUserId();
        var existing = await _divisionService.GetDivisionByIdAsync(divisionId);
        if (existing is null) return NotFound("Division not found.");

        var authorized = await _divisionService.IsUserAuthorizedToManageClassTreeAsync(currentUserId, existing.SchoolClassId);
        if (!authorized)
            return Forbid("Only Admin, Teacher, or assigned Ketua Kelas can manage this class division tree.");

        var success = await _divisionService.DeleteDivisionAsync(divisionId);
        if (!success) return NotFound("Division not found.");
        return NoContent();
    }
}
