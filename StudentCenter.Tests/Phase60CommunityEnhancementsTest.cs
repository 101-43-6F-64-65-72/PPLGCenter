using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase60CommunityEnhancementsTest
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
    public async Task VerifyPhase60DeleteGroupAndEnhancements()
    {
        using var db = GetDbContext();
        var communityService = new CommunityGroupService(db);

        var student = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student);
        var teacher = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Teacher);

        Assert.NotNull(student);
        Assert.NotNull(teacher);

        // 1. Create a group to test deletion
        var testGroupName = "Grup Uji Hapus " + Guid.NewGuid().ToString("N")[..6];
        var createdGroup = await communityService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = testGroupName,
            Description = "Grup Uji coba fitur hapus"
        }, student.Id);

        Assert.NotNull(createdGroup);

        // 2. Perform deletion by Group Creator (Student)
        var deleteSuccess = await communityService.DeleteGroupAsync(createdGroup.Id, student.Id);
        Assert.True(deleteSuccess);

        // 3. Verify group no longer exists
        var fetched = await communityService.GetGroupByIdAsync(createdGroup.Id, student.Id);
        Assert.Null(fetched);
    }
}
