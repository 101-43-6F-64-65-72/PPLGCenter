using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Data.Seeders;

namespace StudentCenter.Tests;

public class SeedAdminDataTests
{
    [Fact]
    public async Task SeedAsync_ExistingAdmin_RehashesPasswordAndKeepsAdminAccount()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var context = new AppDbContext(options);
        var existingAdmin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Old Admin",
            Email = "admin@studentcenter.id",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            PasswordHash = "old-hash"
        };
        context.Users.Add(existingAdmin);
        await context.SaveChangesAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DEFAULT_ADMIN_PASSWORD"] = "admin1234"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton(context);
        var provider = services.BuildServiceProvider();

        await SeedAdminData.SeedAsync(provider);

        var admin = await context.Users.SingleAsync(u => u.Email == "admin@studentcenter.id");
        admin.Role.Should().Be(UserRole.Admin);
        admin.FullName.Should().Be("Administrator");
        admin.IsActive.Should().BeTrue();
        admin.PasswordHash.Should().NotBe("old-hash");

        var hasher = new PasswordHasher<User>();
        var result = hasher.VerifyHashedPassword(admin, admin.PasswordHash, "admin1234");
        result.Should().Be(PasswordVerificationResult.Success);
    }
}
