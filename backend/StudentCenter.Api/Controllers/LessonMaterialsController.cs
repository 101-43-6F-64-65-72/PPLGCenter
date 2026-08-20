using System.ComponentModel.DataAnnotations;
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
        try
        {
            var isStudent = User.IsInRole("Student");
            var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
            var userId = GetCurrentUserId();
            var actualVisibility = isStudent ? "Published" : visibility;
            var materials = await _materialService.GetAllAsync(classSubjectId, actualVisibility, false, userId, userRole);
            return Ok(ApiResponse<List<LessonMaterialResponse>>.SuccessResponse(materials));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var isStudent = User.IsInRole("Student");
            var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
            var userId = GetCurrentUserId();
            var material = await _materialService.GetByIdAsync(id, isStudent, userId, userRole);
            if (material == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Lesson material not found."));

            return Ok(ApiResponse<LessonMaterialResponse>.SuccessResponse(material));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateLessonMaterialRequest request)
    {
        try
        {
            var teacherId = GetCurrentUserId();
            var material = await _materialService.CreateAsync(teacherId, request);
            return CreatedAtAction(nameof(GetById), new { id = material.Id }, ApiResponse<LessonMaterialResponse>.SuccessResponse(material, "Lesson material created successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLessonMaterialRequest request)
    {
        try
        {
            var teacherId = GetCurrentUserId();
            var material = await _materialService.UpdateAsync(id, teacherId, request);
            if (material == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Lesson material not found."));

            return Ok(ApiResponse<LessonMaterialResponse>.SuccessResponse(material, "Lesson material updated successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var teacherId = GetCurrentUserId();
            var success = await _materialService.SoftDeleteAsync(id, teacherId);
            if (!success)
                return NotFound(ApiResponse<object>.ErrorResponse("Lesson material not found or unauthorized."));

            return Ok(ApiResponse<object>.SuccessResponse(null!, "Lesson material deleted successfully."));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyMaterials()
    {
        try
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
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.ErrorResponse(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.ErrorResponse(ex.Message));
        }
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
