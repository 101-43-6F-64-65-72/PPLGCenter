using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class ClassOperationsSecurityTests
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

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru Wali Kelas 1", Email = "gw1@pplg.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru Wali Kelas 2", Email = "gw2@pplg.id", Role = UserRole.Teacher, IsActive = true };
        var teacher3 = new User { Id = Guid.NewGuid(), FullName = "Guru Unassigned", Email = "g3@pplg.id", Role = UserRole.Teacher, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin System", Email = "admin@pplg.id", Role = UserRole.Admin, IsActive = true };

        var class1 = new SchoolClass
        {
            Id = Guid.NewGuid(),
            Name = "X PPLG A",
            Grade = "X",
            AcademicYearId = ay.Id,
            AcademicYear = ay,
            HomeroomTeacherId = teacher1.Id,
            HomeroomTeacher = teacher1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var class2 = new SchoolClass
        {
            Id = Guid.NewGuid(),
            Name = "X PPLG B",
            Grade = "X",
            AcademicYearId = ay.Id,
            AcademicYear = ay,
            HomeroomTeacherId = teacher2.Id,
            HomeroomTeacher = teacher2,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.SchoolClasses.AddRange(class1, class2);

        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student Class 1", Email = "s1@pplg.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, NIS = "1001", IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Student Class 2", Email = "s2@pplg.id", Role = UserRole.Student, ClassId = class2.Id, Class = class2, NIS = "1002", IsActive = true };

        context.Users.AddRange(teacher1, teacher2, teacher3, admin, student1, student2);

        var leadership1 = new ClassLeadership
        {
            Id = Guid.NewGuid(),
            SchoolClassId = class1.Id,
            SchoolClass = class1,
            HomeroomTeacherId = teacher1.Id,
            HomeroomTeacher = teacher1,
            ClassLeaderStudentId = student1.Id,
            ClassLeaderStudent = student1,
            AcademicYearId = ay.Id,
            AcademicYear = ay,
            AppointedByUserId = admin.Id,
            IsActive = true,
            EffectiveDate = DateTime.UtcNow
        };

        context.ClassLeadership.Add(leadership1);
        context.SaveChanges();
    }

    [Fact]
    public async Task Admin_CanAppointLeadershipGlobally()
    {
        var context = GetInMemoryDbContext();
        var leadershipService = new ClassLeadershipService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var ay = await context.AcademicYears.FirstAsync();

        var result = await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
        {
            SchoolClassId = class1.Id,
            HomeroomTeacherId = teacher1.Id,
            ClassLeaderStudentId = student1.Id,
            AcademicYearId = ay.Id
        }, admin.Id, "Admin");

        Assert.NotNull(result);
        Assert.True(result.IsActive);
        Assert.Equal(student1.Id, result.ClassLeaderStudentId);
    }

    [Fact]
    public async Task WaliKelas_CanAppointLeadershipForOwnClass()
    {
        var context = GetInMemoryDbContext();
        var leadershipService = new ClassLeadershipService(context);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id");
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var ay = await context.AcademicYears.FirstAsync();

        var result = await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
        {
            SchoolClassId = class1.Id,
            HomeroomTeacherId = teacher1.Id,
            ClassLeaderStudentId = student1.Id,
            AcademicYearId = ay.Id
        }, teacher1.Id, "Teacher");

        Assert.NotNull(result);
        Assert.Equal(student1.Id, result.ClassLeaderStudentId);
    }

    [Fact]
    public async Task NonWaliTeacher_CannotAppointLeadershipForAnotherClass()
    {
        var context = GetInMemoryDbContext();
        var leadershipService = new ClassLeadershipService(context);

        var teacher3 = await context.Users.FirstAsync(u => u.Email == "g3@pplg.id"); // Not Wali Kelas of Class 1
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var ay = await context.AcademicYears.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
            {
                SchoolClassId = class1.Id,
                HomeroomTeacherId = teacher1.Id,
                ClassLeaderStudentId = student1.Id,
                AcademicYearId = ay.Id
            }, teacher3.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Student_CannotAppointLeadership()
    {
        var context = GetInMemoryDbContext();
        var leadershipService = new ClassLeadershipService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id");
        var ay = await context.AcademicYears.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
            {
                SchoolClassId = class1.Id,
                HomeroomTeacherId = teacher1.Id,
                ClassLeaderStudentId = student1.Id,
                AcademicYearId = ay.Id
            }, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task StudentFromAnotherClass_CannotBecomeKetuaKelas()
    {
        var context = GetInMemoryDbContext();
        var leadershipService = new ClassLeadershipService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@pplg.id"); // Enrolled in Class 2
        var ay = await context.AcademicYears.FirstAsync();

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
            {
                SchoolClassId = class1.Id,
                HomeroomTeacherId = teacher1.Id,
                ClassLeaderStudentId = student2.Id, // Cross-class student attempt
                AcademicYearId = ay.Id
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task ReassigningHomeroomTeacher_UpdatesAuthorizationStateAndDualStateModel()
    {
        var context = GetInMemoryDbContext();
        var leadershipService = new ClassLeadershipService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id"); // Old Wali
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "gw2@pplg.id"); // New Wali
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var ay = await context.AcademicYears.FirstAsync();

        // Admin appoints teacher2 as new Wali Kelas for Class 1
        var appointed = await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
        {
            SchoolClassId = class1.Id,
            HomeroomTeacherId = teacher2.Id,
            ClassLeaderStudentId = student1.Id,
            AcademicYearId = ay.Id
        }, admin.Id, "Admin");

        Assert.Equal(teacher2.Id, appointed.HomeroomTeacherId);

        // Verify SchoolClass.HomeroomTeacherId is synchronized
        var updatedClass = await context.SchoolClasses.FindAsync(class1.Id);
        Assert.Equal(teacher2.Id, updatedClass!.HomeroomTeacherId);

        // New Wali (teacher2) CAN now appoint leadership for Class 1
        var appointedByNewWali = await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
        {
            SchoolClassId = class1.Id,
            HomeroomTeacherId = teacher2.Id,
            ClassLeaderStudentId = student1.Id,
            AcademicYearId = ay.Id
        }, teacher2.Id, "Teacher");
        Assert.NotNull(appointedByNewWali);

        // Old Wali (teacher1) CANNOT appoint leadership for Class 1 anymore
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await leadershipService.AppointLeadershipAsync(new AppointLeadershipRequest
            {
                SchoolClassId = class1.Id,
                HomeroomTeacherId = teacher2.Id,
                ClassLeaderStudentId = student1.Id,
                AcademicYearId = ay.Id
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task ClassDivisionManagement_FollowsStrictRoleAndScopeRules()
    {
        var context = GetInMemoryDbContext();
        var divisionService = new ClassDivisionService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "gw1@pplg.id"); // Wali Kelas 1
        var teacher3 = await context.Users.FirstAsync(u => u.Email == "g3@pplg.id"); // Unassigned
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id"); // Ketua Kelas 1
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@pplg.id"); // General Student Class 2
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "X PPLG A");

        // Admin -> TRUE
        Assert.True(await divisionService.IsUserAuthorizedToManageClassTreeAsync(admin.Id, class1.Id));

        // Wali Kelas 1 -> TRUE
        Assert.True(await divisionService.IsUserAuthorizedToManageClassTreeAsync(teacher1.Id, class1.Id));

        // Ketua Kelas 1 -> TRUE
        Assert.True(await divisionService.IsUserAuthorizedToManageClassTreeAsync(student1.Id, class1.Id));

        // Unassigned Teacher3 -> FALSE
        Assert.False(await divisionService.IsUserAuthorizedToManageClassTreeAsync(teacher3.Id, class1.Id));

        // General Student2 -> FALSE
        Assert.False(await divisionService.IsUserAuthorizedToManageClassTreeAsync(student2.Id, class1.Id));
    }
}
