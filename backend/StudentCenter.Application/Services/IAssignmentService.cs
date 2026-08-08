using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAssignmentService
{
    Task<List<AssignmentResponse>> GetAllAsync(Guid? classSubjectId = null, Guid? teacherId = null, bool includeDeleted = false);
    Task<AssignmentResponse?> GetByIdAsync(Guid id);
    Task<AssignmentResponse> CreateAsync(Guid teacherId, CreateAssignmentRequest request);
    Task<AssignmentResponse?> UpdateAsync(Guid id, Guid teacherId, UpdateAssignmentRequest request);
    Task<bool> SoftDeleteAsync(Guid id, Guid teacherId);
    Task<List<AssignmentResponse>> GetStudentAssignmentsAsync(Guid studentId);
    Task<List<AssignmentResponse>> GetTeacherAssignmentsAsync(Guid teacherId);
}
