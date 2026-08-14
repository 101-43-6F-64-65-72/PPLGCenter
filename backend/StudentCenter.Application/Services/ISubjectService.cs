using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ISubjectService
{
    Task<List<SubjectResponse>> GetAllAsync(bool? isActive = null);
    Task<SubjectResponse?> GetByIdAsync(Guid id);
    Task<SubjectResponse> CreateAsync(CreateSubjectRequest request);
    Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request);
    Task<bool> DeleteAsync(Guid id);
}
