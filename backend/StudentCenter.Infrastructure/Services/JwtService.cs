using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext? _context;

    public JwtService(IConfiguration configuration, AppDbContext? context = null)
    {
        _configuration = configuration;
        _context = context;
    }

    public string GenerateToken(User user)
    {
        // Default: derive userType from Role, primaryIdentifier from Email
        var userType = user.Role.ToString();
        var primaryIdentifier = user.Email;

        return GenerateToken(user, primaryIdentifier, userType);
    }

    public string GenerateToken(User user, string primaryIdentifier, string userType)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = _configuration["JWT_SECRET"]
            ?? jwtSettings["SecretKey"]
            ?? _configuration["Jwt:SecretKey"]
            ?? _configuration["Jwt:Key"]
            ?? "PPLGCenterSecretKeyForJwtTokenSigning2026SuperSecureKey!";

        var issuer = _configuration["JWT_ISSUER"]
            ?? jwtSettings["Issuer"]
            ?? _configuration["Jwt:Issuer"]
            ?? "PPLGCenter";

        var audience = _configuration["JWT_AUDIENCE"]
            ?? jwtSettings["Audience"]
            ?? _configuration["Jwt:Audience"]
            ?? "PPLGCenterApp";

        var expStr = jwtSettings["ExpirationMinutes"] ?? _configuration["Jwt:ExpirationMinutes"] ?? "1440";
        if (!int.TryParse(expStr, out var expirationMinutes))
        {
            expirationMinutes = 1440;
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        bool isPplgTeacher = user.Role == Domain.Enums.UserRole.Teacher &&
            !string.IsNullOrWhiteSpace(user.Position) &&
            (user.Position.Trim().Equals("Pengembangan Perangkat Lunak Dan Gim", StringComparison.OrdinalIgnoreCase) ||
             user.Position.Trim().Equals("PPLG", StringComparison.OrdinalIgnoreCase));

        var effectiveRole = isPplgTeacher ? "Admin" : user.Role.ToString();

        var claims = new List<Claim>
        {
            // Standard claims
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FullName),
            new Claim(ClaimTypes.Role, effectiveRole),
            // Extended identity claims
            new Claim("given_name", user.FullName),
            new Claim("role", effectiveRole),
            new Claim("userId", user.Id.ToString()),
            new Claim("userType", isPplgTeacher ? "Admin" : userType),
            new Claim("primaryIdentifier", primaryIdentifier),
            new Claim("fullName", user.FullName)
        };

        // Inject OSIS role claim if user has OSIS capability permission
        if (_context != null)
        {
            try
            {
                bool isOsisMember = _context.UserPermissions
                    .AsNoTracking()
                    .Any(p => p.UserId == user.Id && (p.Capability == "OSIS" || p.Capability == "OsisMember"));

                if (isOsisMember)
                {
                    claims.Add(new Claim(ClaimTypes.Role, "OSIS"));
                    claims.Add(new Claim("role", "OSIS"));
                }
            }
            catch
            {
                // Graceful fallback if DB query fails during token generation
            }
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
