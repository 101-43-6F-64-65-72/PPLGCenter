using StudentCenter.Domain.Entities;

namespace StudentCenter.Application.Services;

public interface IJwtService
{
    /// <summary>
    /// Generates a JWT token for the given user with standard claims.
    /// </summary>
    string GenerateToken(User user);

    /// <summary>
    /// Generates a JWT token with an explicit primary identifier (NIS/NISN/NIP/Email)
    /// that was used during login, included as the PrimaryIdentifier claim.
    /// </summary>
    string GenerateToken(User user, string primaryIdentifier, string userType);
}
