using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class Phase41FullMvpAuditTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedTestData(context);
        return context;
    }

    private void SeedTestData(AppDbContext context)
    {
        var ay = new AcademicYear { Id = Guid.NewGuid(), Name = "2026/2027", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.AcademicYears.Add(ay);

        var dept = new Department { Id = Guid.NewGuid(), Code = "PPLG", Name = "Pengembangan Perangkat Lunak dan Gim" };
        context.Departments.Add(dept);

        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X PPLG A", Grade = "X", DepartmentId = dept.Id, AcademicYearId = ay.Id };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X PPLG B", Grade = "X", DepartmentId = dept.Id, AcademicYearId = ay.Id };
        context.SchoolClasses.AddRange(class1, class2);

        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Audit", Email = "admin@pplg.sch.id", Role = UserRole.Admin, IsActive = true };
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Teacher Audit", Email = "teacher@pplg.sch.id", Role = UserRole.Teacher, NIP = "198001012010011001", IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student One", Email = "student1@pplg.sch.id", Role = UserRole.Student, ClassId = class1.Id, NIS = "202601", IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Student Two", Email = "student2@pplg.sch.id", Role = UserRole.Student, ClassId = class2.Id, NIS = "202602", IsActive = true };

        context.Users.AddRange(admin, teacher, student1, student2);
        context.SaveChanges();
    }

    [Fact]
    public async Task Phase41_StudentIdentity_ImmutabilityEnforced()
    {
        using var context = GetInMemoryDbContext();
        var jwtMock = new Moq.Mock<IJwtService>();
        var loggerMock = new Moq.Mock<Microsoft.Extensions.Logging.ILogger<UserService>>();
        var userService = new UserService(context, jwtMock.Object, loggerMock.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "student1@pplg.sch.id");

        // Attempting to change immutable FullName as non-admin throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, new UpdateUserRequest
            {
                FullName = "Hacked Name",
                Email = student1.Email
            }, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Phase41_SchoolClassService_GetAll_EliminatesNPlusOne()
    {
        using var context = GetInMemoryDbContext();
        var classService = new SchoolClassService(context);

        var classes = await classService.GetAllAsync();

        Assert.NotNull(classes);
        Assert.Equal(2, classes.Count);
        Assert.Contains(classes, c => c.Name == "X PPLG A" && c.StudentCount == 1);
        Assert.Contains(classes, c => c.Name == "X PPLG B" && c.StudentCount == 1);
    }

    [Fact]
    public async Task Phase41_BookingService_NonManagerTeacher_CannotApprove()
    {
        using var context = GetInMemoryDbContext();
        var notificationMock = new Moq.Mock<INotificationService>();
        var loggerMock = new Moq.Mock<Microsoft.Extensions.Logging.ILogger<BookingService>>();
        var bookingService = new BookingService(context, notificationMock.Object, loggerMock.Object);

        var facility = new Facility
        {
            Id = Guid.NewGuid(),
            Name = "Lab PPLG 1",
            IsActive = true,
            ManagerTeacherId = Guid.NewGuid() // Different manager teacher
        };
        context.Facilities.Add(facility);
        context.SaveChanges();


        var student1 = await context.Users.FirstAsync(u => u.Role == UserRole.Student);
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            Purpose = "Koding Bersama",
            StartTime = DateTime.UtcNow.AddDays(1),
            EndTime = DateTime.UtcNow.AddDays(1).AddHours(2)
        }, student1.Id);

        // Non-manager teacher attempting status update throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
            {
                Status = BookingStatus.Approved
            }, teacher.Id, "Teacher");
        });
    }
}
