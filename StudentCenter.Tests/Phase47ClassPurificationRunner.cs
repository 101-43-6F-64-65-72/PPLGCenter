using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase47ClassPurificationRunner
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
    public async Task CleanupDummyUsersAndNonPplgClasses()
    {
        using var db = GetDbContext();

        // 1. Remove unwanted dummy users: "Agus Setiawan", "Siti Rahma OSIS", "Ahmad Rizky Pratama"
        var dummyNames = new[] { "Agus Setiawan", "Siti Rahma OSIS", "Ahmad Rizky Pratama" };
        var dummyUsers = await db.Users
            .Where(u => dummyNames.Contains(u.FullName))
            .ToListAsync();

        if (dummyUsers.Count > 0)
        {
            db.Users.RemoveRange(dummyUsers);
            await db.SaveChangesAsync();
        }

        // 2. Remove non-PPLG classes (e.g. RPL classes)
        var nonPplgClasses = await db.SchoolClasses
            .Where(c => c.Name.Contains("RPL") || (!c.Name.Contains("PPLG") && !c.Name.Contains("PPLG-")))
            .ToListAsync();

        if (nonPplgClasses.Count > 0)
        {
            var nonPplgIds = nonPplgClasses.Select(c => c.Id).ToList();

            // Unlink any users tied to these classes
            var usersInNonPplg = await db.Users.Where(u => u.ClassId.HasValue && nonPplgIds.Contains(u.ClassId.Value)).ToListAsync();
            foreach (var u in usersInNonPplg)
            {
                u.ClassId = null;
            }

            db.SchoolClasses.RemoveRange(nonPplgClasses);
            await db.SaveChangesAsync();
        }

        // 3. Verify exactly 6 PPLG classes remain
        var remainingClasses = await db.SchoolClasses.OrderBy(c => c.Name).ToListAsync();
        Assert.True(remainingClasses.Count == 6, $"Expected exactly 6 PPLG classes, but found {remainingClasses.Count}");

        // 4. Verify each class has 36 students
        foreach (var sc in remainingClasses)
        {
            var studentCount = await db.Users.CountAsync(u => u.ClassId == sc.Id && u.Role == UserRole.Student);
            Assert.Equal(36, studentCount);
        }
    }
}
