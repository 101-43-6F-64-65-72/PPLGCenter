using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ISubmissionService
{
    Task<SubmissionResponse> SubmitAsync(Guid assignmentId, SubmitAssignmentRequest request, Guid studentId);
    Task<PagedResult<SubmissionResponse>> GetSubmissionsByAssignmentAsync(Guid assignmentId, int page, int pageSize);
    Task<SubmissionResponse?> GetSubmissionByIdAsync(Guid id);
    Task<SubmissionResponse?> GradeSubmissionAsync(Guid id, GradeSubmissionRequest request, Guid userId, string userRole);
}
