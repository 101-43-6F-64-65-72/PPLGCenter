using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentProfilesController : ControllerBase
{
    private readonly IStudentProfileService _profileService;

    public StudentProfilesController(IStudentProfileService profileService)
    {
        _profileService = profileService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool IsAdminOrTeacher() =>
        User.IsInRole("Admin") || User.IsInRole("Teacher");

    [HttpGet("user/{userId:guid}")]
    public async Task<IActionResult> GetProfile(Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        var profile = await _profileService.GetProfileByUserIdAsync(userId, currentUserId, IsAdminOrTeacher());
        if (profile is null) return NotFound("Profile not found.");
        return Ok(profile);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var currentUserId = GetCurrentUserId();
        var profile = await _profileService.GetProfileByUserIdAsync(currentUserId, currentUserId, true);
        if (profile is null) return NotFound("Profile not found.");
        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateStudentProfileRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var profile = await _profileService.UpsertProfileAsync(currentUserId, request);
        return Ok(profile);
    }

    [HttpPost("me/projects")]
    public async Task<IActionResult> AddProject([FromBody] StudentProjectRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var project = await _profileService.AddProjectAsync(currentUserId, request);
        return CreatedAtAction(nameof(GetMyProfile), new { id = project.Id }, project);
    }

    [HttpPut("me/projects/{projectId:guid}")]
    public async Task<IActionResult> UpdateProject(Guid projectId, [FromBody] StudentProjectRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var project = await _profileService.UpdateProjectAsync(currentUserId, projectId, request);
        if (project is null) return NotFound("Project not found.");
        return Ok(project);
    }

    [HttpDelete("me/projects/{projectId:guid}")]
    public async Task<IActionResult> DeleteProject(Guid projectId)
    {
        var currentUserId = GetCurrentUserId();
        var success = await _profileService.DeleteProjectAsync(currentUserId, projectId);
        if (!success) return NotFound("Project not found.");
        return NoContent();
    }
}
