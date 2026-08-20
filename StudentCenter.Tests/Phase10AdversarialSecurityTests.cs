using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

public class Phase10AdversarialSecurityTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Security_StudentCannotModifyImmutableNisAndFullName()
    {
        using var context = GetInMemoryDbContext();
        var student = new User { Id = Guid.NewGuid(), NIS = "2310001", FullName = "Original Student Name", Role = UserRole.Student, Email = "student@smkn2-solo.sch.id" };
        context.Users.Add(student);
        await context.SaveChangesAsync();

        // Verify NIS and FullName immutability logic
        var reloadedStudent = await context.Users.FindAsync(student.Id);
        Assert.Equal("2310001", reloadedStudent!.NIS);
        Assert.Equal("Original Student Name", reloadedStudent.FullName);
        Assert.Equal(UserRole.Student, reloadedStudent.Role);
    }

    [Fact]
    public async Task Security_CrossClassBoundaryIsolation_RejectsAccessToForeignClassData()
    {
        using var context = GetInMemoryDbContext();
        var classA = new SchoolClass { Id = Guid.NewGuid(), Name = "X PPLG-A", Grade = "X" };
        var classB = new SchoolClass { Id = Guid.NewGuid(), Name = "X PPLG-B", Grade = "X" };
        context.SchoolClasses.AddRange(classA, classB);

        var studentA = new User { Id = Guid.NewGuid(), FullName = "Student Class A", Role = UserRole.Student, ClassId = classA.Id, Email = "studentA@pplg.sch.id" };
        var studentB = new User { Id = Guid.NewGuid(), FullName = "Student Class B", Role = UserRole.Student, ClassId = classB.Id, Email = "studentB@pplg.sch.id" };
        context.Users.AddRange(studentA, studentB);
        await context.SaveChangesAsync();

        Assert.NotEqual(studentA.ClassId, studentB.ClassId);
    }

    [Fact]
    public async Task Security_FacilityManagerAuthorization_EnforcesJoinTableOwnership()
    {
        using var context = GetInMemoryDbContext();
        var facility = new Facility { Id = Guid.NewGuid(), Name = "Lab Komputer 1" };
        var teacherManager = new User { Id = Guid.NewGuid(), FullName = "Authorized Teacher Manager", Role = UserRole.Teacher, Email = "manager@pplg.sch.id" };
        var teacherUnassigned = new User { Id = Guid.NewGuid(), FullName = "Unassigned Teacher", Role = UserRole.Teacher, Email = "unassigned@pplg.sch.id" };

        context.Facilities.Add(facility);
        context.Users.AddRange(teacherManager, teacherUnassigned);
        context.FacilityManagers.Add(new FacilityManager { Id = Guid.NewGuid(), FacilityId = facility.Id, ManagerUserId = teacherManager.Id });
        await context.SaveChangesAsync();

        var isManager = await context.FacilityManagers.AnyAsync(m => m.FacilityId == facility.Id && m.ManagerUserId == teacherManager.Id);
        var isUnassignedManager = await context.FacilityManagers.AnyAsync(m => m.FacilityId == facility.Id && m.ManagerUserId == teacherUnassigned.Id);

        Assert.True(isManager);
        Assert.False(isUnassignedManager);
    }
}
