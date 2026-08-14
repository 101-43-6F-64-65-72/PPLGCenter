using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAssessmentService
{
    // GradeCategory CRUD
    Task<List<GradeCategoryResponse>> GetAllCategoriesAsync();
    Task<GradeCategoryResponse?> GetCategoryByIdAsync(Guid id);
    Task<GradeCategoryResponse> CreateCategoryAsync(CreateGradeCategoryRequest request);
    Task<GradeCategoryResponse?> UpdateCategoryAsync(Guid id, UpdateGradeCategoryRequest request);
    Task<bool> DeleteCategoryAsync(Guid id);

    // Assessment CRUD
    Task<List<AssessmentResponse>> GetAssessmentsAsync(Guid? classSubjectId = null, Guid? teacherId = null, Guid? categoryId = null);
    Task<AssessmentResponse?> GetAssessmentByIdAsync(Guid id);
    Task<AssessmentResponse> CreateAssessmentAsync(Guid teacherId, CreateAssessmentRequest request);
    Task<AssessmentResponse?> UpdateAssessmentAsync(Guid id, Guid teacherId, UpdateAssessmentRequest request);
    Task<bool> DeleteAssessmentAsync(Guid id, Guid teacherId);
    Task<AssessmentResponse?> PublishAssessmentAsync(Guid id, Guid teacherId);
}
