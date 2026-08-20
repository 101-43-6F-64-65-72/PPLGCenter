using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IStudentGradeService
{
    Task<StudentGradeResponse?> GetGradeByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<StudentGradeResponse> UpsertGradeAsync(Guid teacherId, Guid assessmentId, GradeItemRequest request, bool publish = false);
    Task<List<StudentGradeResponse>> BulkGradeAsync(Guid teacherId, BulkGradeRequest request);
    Task<bool> PublishGradesAsync(Guid teacherId, Guid assessmentId, List<Guid>? studentIds = null);
    Task<TeacherGradebookViewResponse> GetTeacherGradebookAsync(Guid teacherId, Guid classSubjectId);
    Task<List<StudentGradeResponse>> GetStudentGradesAsync(Guid studentId, Guid? classSubjectId = null);
    Task<StudentTranscriptResponse> GetStudentTranscriptAsync(Guid studentId);
    Task<(int ImportedCount, List<string> Errors)> ImportGradesCsvAsync(Guid teacherId, Guid assessmentId, string csvContent);
    Task<string> ExportGradesCsvAsync(Guid teacherId, Guid assessmentId);
}
