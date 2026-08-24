using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.Services;

public interface IUserService
{
    Task<LoginResult> LoginAsync(LoginRequest request);
    Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role, bool? isActive, Guid? classId = null, Guid? departmentId = null);
    Task<List<UserResponse>> GetActiveTeachersAsync();
    Task<UserResponse?> GetUserByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<UserResponse?> CreateUserAsync(CreateUserRequest request);
    Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<UserResponse?> UpdateUserStatusAsync(Guid id, bool isActive);
    Task<bool> DeleteUserAsync(Guid id);
    Task<UserResponse?> AssignTeacherAsync(AssignTeacherRequest request);
    Task<RequestNotificationOtpResponse> RequestNotificationEmailOtpAsync(Guid userId, string email);
    Task<VerifyNotificationOtpResponse> VerifyNotificationEmailOtpAsync(Guid userId, string email, List<string> techStack);
    Task<bool> DeleteNotificationEmailAsync(Guid userId);
}
