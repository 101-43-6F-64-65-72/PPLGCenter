using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IUserPermissionService
{
    Task<List<UserPermissionResponse>> GetUserPermissionsAsync(Guid userId);
    Task<bool> HasCapabilityAsync(Guid userId, string capability);
    Task<UserPermissionResponse> GrantPermissionAsync(GrantPermissionRequest request, Guid grantedByUserId);
    Task<bool> RevokePermissionAsync(Guid userId, string capability);
}
