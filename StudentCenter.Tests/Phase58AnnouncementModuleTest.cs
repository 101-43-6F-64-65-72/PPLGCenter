using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase58AnnouncementModuleTest
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
    public async Task VerifyAnnouncementMultiClassTargetingAndPermissions()
    {
        using var db = GetDbContext();

        // Ensure database schema has TargetClasses, PublishStart, PublishEnd columns
        await db.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""Announcements"" 
            ADD COLUMN IF NOT EXISTS ""TargetClasses"" text,
            ADD COLUMN IF NOT EXISTS ""PublishStart"" timestamp with time zone,
            ADD COLUMN IF NOT EXISTS ""PublishEnd"" timestamp with time zone;
        ");

        var notificationService = new NotificationService(db);
        var announcementService = new AnnouncementService(db, notificationService, NullLogger<AnnouncementService>.Instance);

        var classes = await db.SchoolClasses.ToListAsync();
        foreach (var c in classes)
        {
            Console.WriteLine($"[SchoolClass DB] Id={c.Id}, Name='{c.Name}'");
        }

        var students = await db.Users.Include(u => u.Class).Where(u => u.Role == Domain.Enums.UserRole.Student && u.ClassId != null).Take(5).ToListAsync();
        foreach (var s in students)
        {
            Console.WriteLine($"[Student DB] Name='{s.FullName}', ClassName='{s.Class?.Name}'");
        }

        // 1. Fetch teacher 197702222009021002 or NIP teacher
        var teacher1 = await db.Users.FirstOrDefaultAsync(u => u.NIP == "197702222009021002" || u.Username == "197702222009021002")
            ?? await db.Users.FirstOrDefaultAsync(u => u.Role == Domain.Enums.UserRole.Teacher);
        Assert.NotNull(teacher1);

        // 2. Teacher creates announcement with target "X PPLG A, X PPLG B"
        var createdAnn = await announcementService.CreateAnnouncementAsync(new CreateAnnouncementRequest
        {
            Title = "Pengumuman Ujian Khusus PPLG A & B",
            Content = "Pengumuman materi ujian khusus kelas X PPLG A dan B.",
            Category = "Pengumuman",
            TargetClasses = "X PPLG A, X PPLG B",
            PublishStart = DateTime.UtcNow.AddMinutes(-10),
            PublishEnd = DateTime.UtcNow.AddDays(30),
            CoverImageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg"
        }, teacher1.Id, "Teacher");

        Assert.NotNull(createdAnn);

        // 3. Fetch student in X PPLG A
        var studentA = await db.Users.Include(u => u.Class).FirstOrDefaultAsync(u => u.Role == Domain.Enums.UserRole.Student && u.Class != null && (u.Class.Name.Contains("X PPLG A") || u.Class.Name.Contains("X PPLG-A")));
        Assert.NotNull(studentA);

        var feed = await announcementService.GetAnnouncementsAsync(1, 20, null, studentA.Id, "Student", studentA.ClassId);
        Assert.Contains(feed.Items, a => a.Id == createdAnn.Id);

        // Cleanup
        await announcementService.DeleteAnnouncementAsync(createdAnn.Id, teacher1.Id, "Teacher");
    }

    [Fact]
    public async Task TestStudentLoginNis25013276()
    {
        using var db = GetDbContext();
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:SecretKey"] = "SuperSecretKeyForTestingPurpose12345678901234567890!",
            ["Jwt:Issuer"] = "PPLGCenter",
            ["Jwt:Audience"] = "PPLGCenterApp"
        }).Build());
        var userService = new UserService(db, jwtService, NullLogger<UserService>.Instance);

        var user = await db.Users.FirstOrDefaultAsync(u => u.NIS == "25.013276" || (u.NIS != null && u.NIS.Contains("013276")));
        if (user != null)
        {
            Console.WriteLine($"[DB RECORD] Id={user.Id}, Name='{user.FullName}', NIS='{user.NIS}', Role={user.Role}, IsActive={user.IsActive}, PasswordHash='{user.PasswordHash}'");
        }
        else
        {
            Console.WriteLine("[DB RECORD] User with NIS 25.013276 NOT FOUND!");
        }

        var loginResult = await userService.LoginAsync(new LoginRequest
        {
            Identifier = "25.013276",
            Password = "SiswaPPLG2026!",
            LoginType = "Student"
        });

        Console.WriteLine($"[LOGIN RESULT] Status={loginResult.Status}, Email={loginResult.Data?.Email}, Role={loginResult.Data?.Role}");
        Assert.Equal(Application.DTOs.LoginStatus.Success, loginResult.Status);
    }
}
