using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ISchoolClassService
{
    Task<List<SchoolClassResponse>> GetAllAsync(Guid? departmentId = null, Guid? academicYearId = null);
    Task<SchoolClassResponse?> GetByIdAsync(Guid id);
    Task<SchoolClassResponse> CreateAsync(CreateSchoolClassRequest request);
    Task<SchoolClassResponse?> UpdateAsync(Guid id, UpdateSchoolClassRequest request);
    Task<bool> DeleteAsync(Guid id);
}
