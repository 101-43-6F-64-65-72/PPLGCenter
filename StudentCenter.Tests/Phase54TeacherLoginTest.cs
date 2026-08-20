using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase54TeacherLoginTest
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task TestTeacherLoginCredentials()
    {
        using var db = GetDbContext();

        var teachers = await db.Users
            .Where(u => u.Role == Domain.Enums.UserRole.Teacher)
            .ToListAsync();

        Assert.NotEmpty(teachers);

        var dummyJwt = new DummyJwtService();
        var logger = Microsoft.Extensions.Logging.Abstractions.NullLogger<UserService>.Instance;
        var userService = new UserService(db, dummyJwt, logger);

        foreach (var teacher in teachers)
        {
            if (string.IsNullOrWhiteSpace(teacher.NIP)) continue;

            // Test login with exact NIP
            var result1 = await userService.LoginAsync(new LoginRequest
            {
                LoginType = "Teacher",
                Identifier = teacher.NIP,
                Password = "GuruPPLG2026!"
            });

            Assert.Equal(LoginStatus.Success, result1.Status);

            // Test login with formatted NIP with spaces
            var formattedNip = string.Join(" ", teacher.NIP);
            var result2 = await userService.LoginAsync(new LoginRequest
            {
                LoginType = "Teacher",
                Identifier = formattedNip,
                Password = "GuruPPLG2026!"
            });

            Assert.Equal(LoginStatus.Success, result2.Status);
        }
    }

    private class DummyJwtService : IJwtService
    {
        public string GenerateToken(Domain.Entities.User user) => "test_token";
        public string GenerateToken(Domain.Entities.User user, string primaryIdentifier, string userType) => "test_token";
        public System.Security.Claims.ClaimsPrincipal? GetPrincipalFromExpiredToken(string token) => null;
    }
}
