using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ILessonMaterialService
{
    Task<List<LessonMaterialResponse>> GetAllAsync(Guid? classSubjectId = null, string? visibility = null, bool includeDeleted = false);
    Task<LessonMaterialResponse?> GetByIdAsync(Guid id, bool isStudent = false);
    Task<LessonMaterialResponse> CreateAsync(Guid teacherId, CreateLessonMaterialRequest request);
    Task<LessonMaterialResponse?> UpdateAsync(Guid id, Guid teacherId, UpdateLessonMaterialRequest request);
    Task<bool> SoftDeleteAsync(Guid id, Guid teacherId);
    Task<List<LessonMaterialResponse>> GetStudentMaterialsAsync(Guid studentId);
    Task<List<LessonMaterialResponse>> GetTeacherMaterialsAsync(Guid teacherId);
}
