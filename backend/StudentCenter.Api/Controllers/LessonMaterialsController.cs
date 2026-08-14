using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LessonMaterialsController : ControllerBase
{
    private readonly ILessonMaterialService _materialService;

    public LessonMaterialsController(ILessonMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? classSubjectId, [FromQuery] string? visibility)
    {
        var isStudent = User.IsInRole("Student");
        var actualVisibility = isStudent ? "Published" : visibility;
        var materials = await _materialService.GetAllAsync(classSubjectId, actualVisibility);
        return Ok(ApiResponse<List<LessonMaterialResponse>>.SuccessResponse(materials));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var isStudent = User.IsInRole("Student");
        var material = await _materialService.GetByIdAsync(id, isStudent);
        if (material == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Lesson material not found."));

        return Ok(ApiResponse<LessonMaterialResponse>.SuccessResponse(material));
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateLessonMaterialRequest request)
    {
        var teacherId = GetCurrentUserId();
        var material = await _materialService.CreateAsync(teacherId, request);
        return CreatedAtAction(nameof(GetById), new { id = material.Id }, ApiResponse<LessonMaterialResponse>.SuccessResponse(material, "Lesson material created successfully."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLessonMaterialRequest request)
    {
        var teacherId = GetCurrentUserId();
        var material = await _materialService.UpdateAsync(id, teacherId, request);
        if (material == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Lesson material not found."));

        return Ok(ApiResponse<LessonMaterialResponse>.SuccessResponse(material, "Lesson material updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var teacherId = GetCurrentUserId();
        var success = await _materialService.SoftDeleteAsync(id, teacherId);
        if (!success)
            return NotFound(ApiResponse<object>.ErrorResponse("Lesson material not found or unauthorized."));

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Lesson material deleted successfully."));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyMaterials()
    {
        var userId = GetCurrentUserId();
        if (User.IsInRole("Student"))
        {
            var materials = await _materialService.GetStudentMaterialsAsync(userId);
            return Ok(ApiResponse<List<LessonMaterialResponse>>.SuccessResponse(materials));
        }
        else
        {
            var materials = await _materialService.GetTeacherMaterialsAsync(userId);
            return Ok(ApiResponse<List<LessonMaterialResponse>>.SuccessResponse(materials));
        }
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
