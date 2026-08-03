using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.Services;

public interface IUserService
{
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role, bool? isActive);
    Task<UserResponse?> GetUserByIdAsync(Guid id);
    Task<UserResponse?> CreateUserAsync(CreateUserRequest request);
    Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task<UserResponse?> UpdateUserStatusAsync(Guid id, bool isActive);
    Task<bool> DeleteUserAsync(Guid id);
}
