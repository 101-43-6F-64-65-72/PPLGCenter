using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IClassDivisionService
{
    Task<List<ClassDivisionNodeResponse>> GetDivisionTreeAsync(Guid schoolClassId);
    Task<ClassDivisionNodeResponse?> GetDivisionByIdAsync(Guid divisionId);
    Task<ClassDivisionNodeResponse> CreateDivisionAsync(CreateClassDivisionRequest request);
    Task<ClassDivisionNodeResponse?> UpdateDivisionAsync(Guid divisionId, UpdateClassDivisionRequest request);
    Task<bool> DeleteDivisionAsync(Guid divisionId);
    Task<bool> IsUserAuthorizedToManageClassTreeAsync(Guid userId, Guid schoolClassId);
}
