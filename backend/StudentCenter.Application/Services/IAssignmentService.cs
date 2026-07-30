using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAssignmentService
{
    Task<PagedResult<AssignmentResponse>> GetAssignmentsAsync(int page, int pageSize, string? subject, string? grade);
    Task<AssignmentResponse?> GetAssignmentByIdAsync(Guid id);
    Task<AssignmentResponse> CreateAssignmentAsync(CreateAssignmentRequest request, Guid userId);
    Task<AssignmentResponse?> UpdateAssignmentAsync(Guid id, UpdateAssignmentRequest request, Guid userId, string userRole);
    Task<bool> DeleteAssignmentAsync(Guid id, Guid userId, string userRole);
}
