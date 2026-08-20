using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Helpers;

public static class AuthorizationExtensions
{
    /// <summary>
    /// Verifies whether the requesting user is the assigned teacher (assignedTeacherId == userId) or holds Admin role.
    /// </summary>
    public static async Task<bool> IsTeacherOrAdminAuthorizedAsync(
        this AppDbContext context,
        Guid userId,
        Guid assignedTeacherId)
    {
        if (assignedTeacherId == userId) return true;

        var user = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return user.IsAdminOrPplgTeacher();
    }

    public static bool IsAdminOrPplgTeacher(this Domain.Entities.User? user)
    {
        if (user == null) return false;
        if (user.Role == UserRole.Admin) return true;
        if (user.Role == UserRole.Teacher && !string.IsNullOrWhiteSpace(user.Position))
        {
            var pos = user.Position.Trim();
            return pos.Equals("Pengembangan Perangkat Lunak Dan Gim", StringComparison.OrdinalIgnoreCase) ||
                   pos.Equals("PPLG", StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }
}
