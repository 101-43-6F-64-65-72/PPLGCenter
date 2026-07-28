using StudentCenter.Domain.Entities;

namespace StudentCenter.Application.Services;

public interface IJwtService
{
    string GenerateToken(User user);
}
