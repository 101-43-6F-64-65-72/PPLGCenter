using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAcademicYearService
{
    Task<List<AcademicYearResponse>> GetAllAsync();
    Task<AcademicYearResponse?> GetByIdAsync(Guid id);
    Task<AcademicYearResponse> CreateAsync(CreateAcademicYearRequest request);
    Task<AcademicYearResponse?> UpdateAsync(Guid id, UpdateAcademicYearRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<AcademicYearResponse?> SetActiveAsync(Guid id);
}
