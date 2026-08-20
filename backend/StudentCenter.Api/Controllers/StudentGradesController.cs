using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
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
    private readonly IReportCardService _reportCardService;

    public StudentGradesController(IStudentGradeService studentGradeService, IReportCardService reportCardService)
    {
        _studentGradeService = studentGradeService;
        _reportCardService = reportCardService;
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var isStudent = User.IsInRole("Student");
        var userRole = isStudent ? "Student" : (User.IsInRole("Teacher") ? "Teacher" : "Admin");
        var userId = GetCurrentUserId();
        try
        {
            var result = await _studentGradeService.GetGradeByIdAsync(id, userId, userRole);
            if (result == null) return NotFound(ApiResponse<object>.Fail("Grade record not found."));
            return Ok(ApiResponse<StudentGradeResponse>.Ok("Grade record retrieved successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
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

        var teacherId = GetCurrentUserId();
        try
        {
            var gradebook = await _studentGradeService.GetTeacherGradebookAsync(teacherId, targetId.Value);
            return Ok(ApiResponse<TeacherGradebookViewResponse>.Ok("Gradebook retrieved successfully", gradebook));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Student")]
    [HttpGet("my-grades")]
    public async Task<IActionResult> GetMyGrades([FromQuery] Guid? classSubjectId = null)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var grades = await _studentGradeService.GetStudentGradesAsync(studentId, classSubjectId);
            return Ok(ApiResponse<List<StudentGradeResponse>>.Ok("Grades retrieved successfully", grades));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Student")]
    [HttpGet("my-transcript")]
    public async Task<IActionResult> GetMyTranscript()
    {
        var studentId = GetCurrentUserId();
        try
        {
            var transcript = await _studentGradeService.GetStudentTranscriptAsync(studentId);
            return Ok(ApiResponse<StudentTranscriptResponse>.Ok("Transcript retrieved successfully", transcript));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Student")]
    [HttpGet("report-card")]
    public async Task<IActionResult> GetReportCardSummary([FromQuery] Guid? semesterId = null)
    {
        var studentId = GetCurrentUserId();
        try
        {
            var reportCard = await _reportCardService.GetStudentReportCardSummaryAsync(studentId, semesterId);
            return Ok(ApiResponse<ReportCardSummaryResponse>.Ok("Report card retrieved successfully", reportCard));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("upsert/{assessmentId:guid}")]
    public async Task<IActionResult> UpsertGrade(Guid assessmentId, [FromBody] GradeItemRequest request, [FromQuery] bool publish = false)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var result = await _studentGradeService.UpsertGradeAsync(teacherId, assessmentId, request, publish);
            return Ok(ApiResponse<StudentGradeResponse>.Ok("Grade updated successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("bulk-grade")]
    public async Task<IActionResult> BulkGrade([FromBody] BulkGradeRequest request)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var results = await _studentGradeService.BulkGradeAsync(teacherId, request);
            return Ok(ApiResponse<List<StudentGradeResponse>>.Ok("Bulk grades processed successfully", results));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("publish-grades/{assessmentId:guid}")]
    public async Task<IActionResult> PublishGrades(Guid assessmentId, [FromBody] List<Guid>? studentIds = null)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            var success = await _studentGradeService.PublishGradesAsync(teacherId, assessmentId, studentIds);
            if (!success) return NotFound(ApiResponse<object>.Fail("Assessment not found."));

            return Ok(ApiResponse<object>.Ok("Grades published successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpPost("import-csv")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> ImportCsv([FromQuery] Guid assessmentId, IFormFile file)
    {
        var teacherId = GetCurrentUserId();
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.Fail("CSV file is required."));

        try
        {
            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);
            string csvContent = await reader.ReadToEndAsync();

            var (importedCount, errors) = await _studentGradeService.ImportGradesCsvAsync(teacherId, assessmentId, csvContent);
            return Ok(ApiResponse<object>.Ok($"Successfully imported {importedCount} grade records.", new { ImportedCount = importedCount, Errors = errors }));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Teacher,Admin")]
    [HttpGet("export-csv/{assessmentId:guid}")]
    public async Task<IActionResult> ExportCsv(Guid assessmentId)
    {
        var teacherId = GetCurrentUserId();
        try
        {
            string csv = await _studentGradeService.ExportGradesCsvAsync(teacherId, assessmentId);
            var bytes = Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", $"Assessment_Grades_{assessmentId}.csv");
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
    }
}
