using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ISubmissionService
{
    Task<List<SubmissionResponse>> GetSubmissionsByAssignmentAsync(Guid assignmentId, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<SubmissionResponse?> GetSubmissionByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<SubmissionResponse?> GetStudentSubmissionForAssignmentAsync(Guid assignmentId, Guid studentId);
    Task<SubmissionResponse> SubmitAssignmentAsync(Guid studentId, CreateSubmissionRequest request);
    Task<SubmissionResponse?> GradeSubmissionAsync(Guid submissionId, Guid teacherId, GradeSubmissionRequest request);
}
