using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Infrastructure.Data.Seeders;

public static class SeedAdminData
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var configuration = scope.ServiceProvider.GetService<IConfiguration>();
        var passwordHasher = new PasswordHasher<User>();

        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }

        var defaultPassword = configuration?["DEFAULT_ADMIN_PASSWORD"]?.Trim();
        if (string.IsNullOrWhiteSpace(defaultPassword))
        {
            defaultPassword = "Admin123!";
        }

        var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@studentcenter.id" || u.Role == UserRole.Admin);

        if (admin is null)
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Administrator",
                Email = "admin@studentcenter.id",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);
        }

        admin.FullName = "Administrator";
        admin.Email = "admin@studentcenter.id";
        admin.Role = UserRole.Admin;
        admin.IsActive = true;
        admin.PasswordHash = passwordHasher.HashPassword(admin, defaultPassword);
        admin.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
    }
}
