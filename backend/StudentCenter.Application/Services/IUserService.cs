using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IUserService
{
    Task<LoginResult> LoginAsync(LoginRequest request);
}
