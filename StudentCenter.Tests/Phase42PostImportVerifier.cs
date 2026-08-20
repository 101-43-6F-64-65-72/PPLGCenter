using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase42PostImportVerifier

{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    [Fact]
    public async Task VerifyPhase42_LivePostgresDatabaseState()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        using var context = new AppDbContext(options);

        var totalUsers = await context.Users.CountAsync();
        var adminCount = await context.Users.CountAsync(u => u.Role == UserRole.Admin);
        var teacherCount = await context.Users.CountAsync(u => u.Role == UserRole.Teacher);
        var studentCount = await context.Users.CountAsync(u => u.Role == UserRole.Student);
        var classCount = await context.SchoolClasses.CountAsync();
        var departmentCount = await context.Departments.CountAsync();
        var scheduleCount = await context.Schedules.CountAsync();
        var rotationConfigCount = await context.ScheduleRotationConfigs.CountAsync();

        Assert.Equal(1, adminCount);
        Assert.Equal(139, teacherCount);
        Assert.Equal(216, studentCount);
        Assert.Equal(356, totalUsers);
        Assert.Equal(6, classCount);
        Assert.Equal(1, departmentCount);
        Assert.Equal(520, scheduleCount);
        Assert.Equal(2, rotationConfigCount);

        // Verify Student Class Distribution (36 students per class)
        var classes = await context.SchoolClasses.Include(c => c.Students).ToListAsync();
        Assert.Equal(6, classes.Count);
        foreach (var c in classes)
        {
            Assert.Equal(36, c.Students.Count);
        }

        // Verify zero orphans or duplicates
        var duplicateEmails = await context.Users.GroupBy(u => u.Email).Where(g => g.Count() > 1).CountAsync();
        var duplicateNis = await context.Users.Where(u => u.NIS != null).GroupBy(u => u.NIS).Where(g => g.Count() > 1).CountAsync();
        
        Assert.Equal(0, duplicateEmails);
        Assert.Equal(0, duplicateNis);
    }
}
