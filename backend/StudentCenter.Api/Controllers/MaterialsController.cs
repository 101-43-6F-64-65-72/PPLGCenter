using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/materials")]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;
    private readonly ICurrentUserService _currentUserService;

    public MaterialsController(IMaterialService materialService, ICurrentUserService currentUserService)
    {
        _materialService = materialService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetMaterials(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? subject = null,
        [FromQuery] string? grade = null)
    {
        var result = await _materialService.GetMaterialsAsync(page, pageSize, subject, grade);
        return Ok(ApiResponse<PagedResult<MaterialResponse>>.Ok("Materials retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetMaterial(Guid id)
    {
        var result = await _materialService.GetMaterialByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Material not found"));

        return Ok(ApiResponse<MaterialResponse>.Ok("Material retrieved successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPost]
    public async Task<IActionResult> CreateMaterial([FromBody] CreateMaterialRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _materialService.CreateMaterialAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetMaterial), new { id = result.Id },
            ApiResponse<MaterialResponse>.Ok("Material created successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateMaterial(Guid id, [FromBody] UpdateMaterialRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _materialService.UpdateMaterialAsync(id, request, userId.Value, userRole);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Material not found"));

        return Ok(ApiResponse<MaterialResponse>.Ok("Material updated successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMaterial(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _materialService.DeleteMaterialAsync(id, userId.Value, userRole);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Material not found"));

        return Ok(ApiResponse<object>.Ok("Material deleted successfully"));
    }
}
