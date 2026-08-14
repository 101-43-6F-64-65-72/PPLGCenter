using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Data.Seeders;
using Xunit;

namespace StudentCenter.Tests;

public class UatDataInitializationTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task UatData_Seeding_InitializesCompleteMasterStructureAndRelations()
    {
        var context = GetInMemoryDbContext();
        var services = new ServiceCollection();
        services.AddSingleton(context);
        services.AddLogging();
        var provider = services.BuildServiceProvider();

        // 1. Seed Admin
        await SeedAdminData.SeedAsync(provider);

        // 2. Seed Master Data Structure
        await MasterDataSeeder.SeedAsync(provider);

        // 3. Seed Operation Data (Subjects, Teachers, Students, TeacherSubjects, ClassSubjects)
        await OperationDataSeeder.SeedAsync(provider);

        // ── Verification Assertions ──────────────────────────────────────────

        // AcademicYear & Semesters
        var ayCount = await context.AcademicYears.CountAsync();
        var semCount = await context.Semesters.CountAsync();
        Assert.True(ayCount >= 1, "AcademicYears count should be >= 1");
        Assert.True(semCount >= 2, "Semesters count should be >= 2");

        // Departments & SchoolClasses
        var deptCount = await context.Departments.CountAsync();
        var classCount = await context.SchoolClasses.CountAsync();
        Assert.True(deptCount >= 3, "Departments count should be >= 3");
        Assert.True(classCount >= 7, "SchoolClasses count should be >= 7");

        // Subjects (>= 12 mapel)
        var subjectCount = await context.Subjects.CountAsync();
        Assert.True(subjectCount >= 12, "Subjects count should be >= 12");

        // Teachers (>= 10 guru)
        var teacherCount = await context.Users.CountAsync(u => u.Role == UserRole.Teacher);
        Assert.True(teacherCount >= 10, "Teachers count should be >= 10");

        // Students (>= 40 siswa)
        var studentCount = await context.Users.CountAsync(u => u.Role == UserRole.Student);
        Assert.True(studentCount >= 40, "Students count should be >= 40");

        // TeacherSubjects (All teachers assigned to subjects)
        var teacherSubjectCount = await context.TeacherSubjects.CountAsync();
        Assert.True(teacherSubjectCount >= 10, "TeacherSubjects count should be >= 10");

        // ClassSubjects (All classes assigned subjects)
        var classSubjectCount = await context.ClassSubjects.CountAsync();
        Assert.True(classSubjectCount >= 50, "ClassSubjects count should be >= 50");

        // Every student belongs to a class
        var unassignedStudents = await context.Users
            .Where(u => u.Role == UserRole.Student && u.ClassId == null)
            .CountAsync();
        Assert.Equal(0, unassignedStudents);

        // Admin login check
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        Assert.NotNull(adminUser);
    }
}
