using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IClassSubjectService
{
    Task<List<ClassSubjectResponse>> GetAllAsync(Guid? classId = null, Guid? teacherId = null, Guid? subjectId = null);
    Task<ClassSubjectResponse?> GetByIdAsync(Guid id);
    Task<ClassSubjectResponse> CreateAsync(CreateClassSubjectRequest request);
    Task<bool> DeleteAsync(Guid id);
}
