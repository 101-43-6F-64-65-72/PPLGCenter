using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/teacher-subjects")]
public class TeacherSubjectsController : ControllerBase
{
    private readonly ITeacherSubjectService _service;

    public TeacherSubjectsController(ITeacherSubjectService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? teacherId = null, [FromQuery] Guid? subjectId = null)
    {
        var list = await _service.GetAllAsync(teacherId, subjectId);
        return Ok(ApiResponse<List<TeacherSubjectResponse>>.Ok("TeacherSubjects retrieved successfully", list));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("TeacherSubject assignment not found"));

        return Ok(ApiResponse<TeacherSubjectResponse>.Ok("TeacherSubject assignment retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTeacherSubjectRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<TeacherSubjectResponse>.Ok("TeacherSubject assigned successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("TeacherSubject assignment not found"));

        return Ok(ApiResponse<object>.Ok("TeacherSubject assignment removed successfully"));
    }
}
