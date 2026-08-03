using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IMaterialService
{
    Task<PagedResult<MaterialResponse>> GetMaterialsAsync(int page, int pageSize, string? subject, string? grade);
    Task<MaterialResponse?> GetMaterialByIdAsync(Guid id);
    Task<MaterialResponse> CreateMaterialAsync(CreateMaterialRequest request, Guid userId);
    Task<MaterialResponse?> UpdateMaterialAsync(Guid id, UpdateMaterialRequest request, Guid userId, string userRole);
    Task<bool> DeleteMaterialAsync(Guid id, Guid userId, string userRole);
}
