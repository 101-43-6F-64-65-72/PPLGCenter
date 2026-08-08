using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ISemesterService
{
    Task<List<SemesterResponse>> GetAllAsync(Guid? academicYearId = null);
    Task<SemesterResponse?> GetByIdAsync(Guid id);
    Task<SemesterResponse> CreateAsync(CreateSemesterRequest request);
    Task<SemesterResponse?> UpdateAsync(Guid id, UpdateSemesterRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<SemesterResponse?> SetActiveAsync(Guid id);
}
