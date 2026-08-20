using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class CctvSecurityTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);

        var adminUser = new User
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Username = "admin_test",
            Email = "admin@pplg.sch.id",
            PasswordHash = "hash",
            FullName = "Admin Test",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        var teacherUser = new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Username = "teacher_test",
            Email = "teacher@pplg.sch.id",
            PasswordHash = "hash",
            FullName = "Teacher Test",
            Role = UserRole.Teacher,
            CreatedAt = DateTime.UtcNow
        };

        var studentUser = new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Username = "student_test",
            Email = "student@pplg.sch.id",
            PasswordHash = "hash",
            FullName = "Student Test",
            Role = UserRole.Student,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(adminUser, teacherUser, studentUser);
        context.SaveChanges();
        return context;
    }

    [Fact]
    public async Task Student_Cannot_Access_Cctv_Endpoints()
    {
        var context = GetInMemoryDbContext();
        var service = new CctvService(context);
        var studentId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetCamerasAsync(studentId));
    }

    [Fact]
    public async Task Teacher_Can_Access_Cctv_Listing()
    {
        var context = GetInMemoryDbContext();
        var service = new CctvService(context);
        var teacherId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        var cameras = await service.GetCamerasAsync(teacherId);
        Assert.NotNull(cameras);
    }

    [Fact]
    public async Task Admin_Can_Create_Camera_With_Encrypted_Password()
    {
        var context = GetInMemoryDbContext();
        var service = new CctvService(context);
        var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var request = new CreateCctvCameraRequest
        {
            Name = "Lab PPLG Cam 1",
            Location = "Lab Komputer 1",
            Host = "192.168.10.101",
            Port = 554,
            Username = "admin",
            Password = "SuperSecretCameraPassword123!"
        };

        var camera = await service.CreateCameraAsync(request, adminId);
        Assert.NotNull(camera);
        Assert.Equal("Lab PPLG Cam 1", camera.Name);

        // Verify password is NOT exposed in response
        var cameraEntity = await context.CctvCameras.FirstAsync(c => c.Id == camera.Id);
        Assert.NotEqual("SuperSecretCameraPassword123!", cameraEntity.EncryptedPassword);
    }

    [Fact]
    public async Task Ssrf_Host_Loopback_Rejected()
    {
        var context = GetInMemoryDbContext();
        var service = new CctvService(context);
        var adminId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var request = new CreateCctvCameraRequest
        {
            Name = "Malicious SSRF Cam",
            Location = "Lab",
            Host = "127.0.0.1",
            Port = 554,
            Password = "pass"
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateCameraAsync(request, adminId));
    }
}
