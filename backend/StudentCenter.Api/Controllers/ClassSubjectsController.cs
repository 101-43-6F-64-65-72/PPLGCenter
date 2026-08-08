using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/class-subjects")]
public class ClassSubjectsController : ControllerBase
{
    private readonly IClassSubjectService _service;
    private readonly ICurrentUserService _currentUserService;

    public ClassSubjectsController(IClassSubjectService service, ICurrentUserService currentUserService)
    {
        _service = service;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? classId = null, [FromQuery] Guid? teacherId = null, [FromQuery] Guid? subjectId = null)
    {
        // For Teacher role, ALWAYS enforce authenticated teacher identity from JWT principal
        var userRole = _currentUserService.Role;
        var currentUserId = _currentUserService.UserId;
        if (userRole == "Teacher" && currentUserId.HasValue)
        {
            teacherId = currentUserId.Value;
        }

        var list = await _service.GetAllAsync(classId, teacherId, subjectId);
        return Ok(ApiResponse<List<ClassSubjectResponse>>.Ok("ClassSubjects retrieved successfully", list));
    }


    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<object>.Fail("ClassSubject assignment not found"));

        return Ok(ApiResponse<ClassSubjectResponse>.Ok("ClassSubject assignment retrieved successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClassSubjectRequest request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ClassSubjectResponse>.Ok("ClassSubject assigned successfully", result));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success)
            return NotFound(ApiResponse<object>.Fail("ClassSubject assignment not found"));

        return Ok(ApiResponse<object>.Ok("ClassSubject assignment removed successfully"));
    }
}
