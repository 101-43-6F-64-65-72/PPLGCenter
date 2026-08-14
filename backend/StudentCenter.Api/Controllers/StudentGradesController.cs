using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/student-grades")]
[Authorize]
public class StudentGradesController : ControllerBase
{
    private readonly IStudentGradeService _studentGradeService;
    private readonly ICurrentUserService _currentUserService;

    public StudentGradesController(IStudentGradeService studentGradeService, ICurrentUserService currentUserService)
    {
        _studentGradeService = studentGradeService;
        _currentUserService = currentUserService;
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("gradebook")]
    [HttpGet("gradebook/{classSubjectId:guid}")]
    public async Task<IActionResult> GetGradebook(
        [FromRoute] Guid? classSubjectId,
        [FromQuery(Name = "classSubjectId")] Guid? classSubjectIdFromQuery)
    {
        var targetId = classSubjectId ?? classSubjectIdFromQuery;
        if (targetId is null || targetId == Guid.Empty)
            return BadRequest(ApiResponse<object>.Fail("classSubjectId parameter is required."));

        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var gradebook = await _studentGradeService.GetTeacherGradebookAsync(teacherId.Value, targetId.Value);
        return Ok(ApiResponse<TeacherGradebookViewResponse>.Ok("Gradebook retrieved successfully", gradebook));
    }

    [Authorize(Roles = "Student")]
    [HttpGet("my-grades")]
    public async Task<IActionResult> GetMyGrades([FromQuery] Guid? classSubjectId = null)
    {
        var studentId = _currentUserService.UserId;
        if (studentId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var grades = await _studentGradeService.GetStudentGradesAsync(studentId.Value, classSubjectId);
        return Ok(ApiResponse<List<StudentGradeResponse>>.Ok("Grades retrieved successfully", grades));
    }

    [Authorize(Roles = "Student")]
    [HttpGet("my-transcript")]
    public async Task<IActionResult> GetMyTranscript()
    {
        var studentId = _currentUserService.UserId;
        if (studentId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var transcript = await _studentGradeService.GetStudentTranscriptAsync(studentId.Value);
        return Ok(ApiResponse<StudentTranscriptResponse>.Ok("Transcript retrieved successfully", transcript));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("upsert/{assessmentId:guid}")]
    public async Task<IActionResult> UpsertGrade(Guid assessmentId, [FromBody] GradeItemRequest request, [FromQuery] bool publish = false)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var result = await _studentGradeService.UpsertGradeAsync(teacherId.Value, assessmentId, request, publish);
        return Ok(ApiResponse<StudentGradeResponse>.Ok("Grade updated successfully", result));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("bulk-grade")]
    public async Task<IActionResult> BulkGrade([FromBody] BulkGradeRequest request)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var results = await _studentGradeService.BulkGradeAsync(teacherId.Value, request);
        return Ok(ApiResponse<List<StudentGradeResponse>>.Ok("Bulk grades processed successfully", results));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("publish-grades/{assessmentId:guid}")]
    public async Task<IActionResult> PublishGrades(Guid assessmentId, [FromBody] List<Guid>? studentIds = null)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        var success = await _studentGradeService.PublishGradesAsync(teacherId.Value, assessmentId, studentIds);
        if (!success) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

        return Ok(ApiResponse<object>.Ok("Grades published successfully"));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("import-csv")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportCsv([FromQuery] Guid assessmentId, IFormFile file)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("CSV file is required."));

        using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
        string csvContent = await reader.ReadToEndAsync();

        var (importedCount, errors) = await _studentGradeService.ImportGradesCsvAsync(teacherId.Value, assessmentId, csvContent);
        return Ok(ApiResponse<object>.Ok($"Successfully imported {importedCount} grade records.", new { ImportedCount = importedCount, Errors = errors }));
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("export-csv/{assessmentId:guid}")]
    public async Task<IActionResult> ExportCsv(Guid assessmentId)
    {
        var teacherId = _currentUserService.UserId;
        if (teacherId is null) return Unauthorized(ApiResponse<object>.Fail("User identity not found."));

        string csv = await _studentGradeService.ExportGradesCsvAsync(teacherId.Value, assessmentId);
        var bytes = Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", $"Assessment_Grades_{assessmentId}.csv");
    }
}
