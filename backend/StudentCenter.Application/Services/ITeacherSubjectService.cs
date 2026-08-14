using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ITeacherSubjectService
{
    Task<List<TeacherSubjectResponse>> GetAllAsync(Guid? teacherId = null, Guid? subjectId = null);
    Task<TeacherSubjectResponse?> GetByIdAsync(Guid id);
    Task<TeacherSubjectResponse> CreateAsync(CreateTeacherSubjectRequest request);
    Task<bool> DeleteAsync(Guid id);
}
