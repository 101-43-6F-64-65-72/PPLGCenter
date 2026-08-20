using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Helpers;
using StudentCenter.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase57PplgTeacherAuthTest
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
    public async Task VerifyPplgTeacherHasAdminPrivileges()
    {
        using var db = GetDbContext();
        var config = new ConfigurationBuilder().Build();
        var jwtService = new JwtService(config, db);
        var userService = new UserService(db, jwtService, NullLogger<UserService>.Instance);

        // 1. Verify Sidik Pramono (PPLG Teacher) gets Admin Role in Login
        var sidikPramono = await db.Users.FirstOrDefaultAsync(u => u.FullName.Contains("Sidik Pramono"));
        Assert.NotNull(sidikPramono);
        Assert.True(sidikPramono.IsAdminOrPplgTeacher(), "Sidik Pramono should be recognized as Admin/PPLG Teacher");

        var loginRes = await userService.LoginAsync(new LoginRequest
        {
            Identifier = sidikPramono.Username,
            Password = "GuruPPLG2026!",
            LoginType = "Teacher"
        });

        Assert.Equal(LoginStatus.Success, loginRes.Status);
        Assert.Equal("Admin", loginRes.Data.Role);
        Assert.Equal("Admin", loginRes.Data.UserType);

        // 2. Verify Sutarno (TKJ Teacher - Non-PPLG) does NOT get Admin Role in Login
        var sutarno = await db.Users.FirstOrDefaultAsync(u => u.FullName.Contains("Sutarno"));
        Assert.NotNull(sutarno);
        Assert.False(sutarno.IsAdminOrPplgTeacher(), "Sutarno (TKJ) should NOT be Admin/PPLG Teacher");

        var sutarnoLoginRes = await userService.LoginAsync(new LoginRequest
        {
            Identifier = sutarno.Username,
            Password = "GuruPPLG2026!",
            LoginType = "Teacher"
        });

        Assert.Equal(LoginStatus.Success, sutarnoLoginRes.Status);
        Assert.Equal("Teacher", sutarnoLoginRes.Data.Role);
        Assert.Equal("Teacher", sutarnoLoginRes.Data.UserType);
    }
}
