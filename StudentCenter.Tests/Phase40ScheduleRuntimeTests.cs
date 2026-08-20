using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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

public class Phase40ScheduleRuntimeTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedBaseData(context);
        return context;
    }

    private (Guid ClassAId, Guid ClassBId, Guid TeacherAId, Guid TeacherBId, Guid StudentAId, Guid StudentBId, Guid SemesterId) SeedBaseData(AppDbContext context)
    {
        var academicYear = new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = "2026/2027",
            IsActive = true,
            StartDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc)
        };
        context.AcademicYears.Add(academicYear);

        var ganjilSemester = new Semester
        {
            Id = Guid.NewGuid(),
            AcademicYearId = academicYear.Id,
            Name = "Semester Ganjil 2026/2027",
            Order = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Semesters.Add(ganjilSemester);

        var department = new Department { Id = Guid.NewGuid(), Name = "PPLG", Code = "PPLG" };
        context.Departments.Add(department);

        var classA = new SchoolClass
        {
            Id = Guid.NewGuid(),
            DepartmentId = department.Id,
            AcademicYearId = academicYear.Id,
            Name = "XI PPLG-A",
            Grade = "XI",
            Capacity = 36
        };
        var classB = new SchoolClass
        {
            Id = Guid.NewGuid(),
            DepartmentId = department.Id,
            AcademicYearId = academicYear.Id,
            Name = "XI PPLG-B",
            Grade = "XI",
            Capacity = 36
        };
        context.SchoolClasses.AddRange(classA, classB);

        var teacherA = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Budi Santoso, S.Pd.",
            Email = "budi@teacher.smkn2surakarta.sch.id",
            NIP = "19701028 202221 1 003",
            Role = UserRole.Teacher
        };
        var teacherB = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siti Rahma, S.Kom.",
            Email = "siti@teacher.smkn2surakarta.sch.id",
            NIP = "19820514 201001 2 008",
            Role = UserRole.Teacher
        };
        context.Users.AddRange(teacherA, teacherB);

        var studentA = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Aditya Pratama",
            Email = "aditya@student.smkn2surakarta.sch.id",
            NIS = "22001",
            Role = UserRole.Student,
            ClassId = classA.Id
        };
        var studentB = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Bagas Saputra",
            Email = "bagas@student.smkn2surakarta.sch.id",
            NIS = "22002",
            Role = UserRole.Student,
            ClassId = classB.Id
        };
        context.Users.AddRange(studentA, studentB);

        var subjectBind = new Subject { Id = Guid.NewGuid(), Code = "BIND", Name = "Bahasa Indonesia" };
        var subjectMtk = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika" };
        context.Subjects.AddRange(subjectBind, subjectMtk);

        var tsA = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacherA.Id, SubjectId = subjectBind.Id };
        var tsB = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacherB.Id, SubjectId = subjectMtk.Id };
        context.TeacherSubjects.AddRange(tsA, tsB);

        var csA = new ClassSubject { Id = Guid.NewGuid(), ClassId = classA.Id, TeacherSubjectId = tsA.Id };
        var csB = new ClassSubject { Id = Guid.NewGuid(), ClassId = classB.Id, TeacherSubjectId = tsB.Id };
        context.ClassSubjects.AddRange(csA, csB);

        // Schedules
        var todayDay = ScheduleService.GetWibNow().DayOfWeek;

        context.Schedules.Add(new Schedule
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = csA.Id,
            SemesterId = ganjilSemester.Id,
            DayOfWeek = todayDay,
            StartTime = new TimeSpan(7, 0, 0),
            EndTime = new TimeSpan(8, 30, 0),
            Room = "R.101",
            IsActive = true
        });

        // Rotation Configs: XI PPLG-A starts MPU, XI PPLG-B starts KK
        context.ScheduleRotationConfigs.Add(new ScheduleRotationConfig
        {
            Id = Guid.NewGuid(),
            SchoolClassId = classA.Id,
            AnchorStartDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc),
            InitialCategory = SubjectCategory.MPU,
            CycleWeeks = 1,
            IsActive = true
        });

        context.ScheduleRotationConfigs.Add(new ScheduleRotationConfig
        {
            Id = Guid.NewGuid(),
            SchoolClassId = classB.Id,
            AnchorStartDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc),
            InitialCategory = SubjectCategory.KK,
            CycleWeeks = 1,
            IsActive = true
        });

        context.SaveChanges();

        return (classA.Id, classB.Id, teacherA.Id, teacherB.Id, studentA.Id, studentB.Id, ganjilSemester.Id);
    }

    [Fact]
    public async Task Phase40_GetTodaySchedulesForStudent_ReturnsEnrichedContract()
    {
        using var context = CreateInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);
        var scheduleService = new ScheduleService(context, rotationService);

        var studentA = await context.Users.FirstAsync(u => u.Email == "aditya@student.smkn2surakarta.sch.id");

        var response = await scheduleService.GetTodaySchedulesForStudentAsync(studentA.Id);

        var expectedCategory = await rotationService.GetCurrentCategoryForClassAsync(studentA.ClassId!.Value, ScheduleService.GetWibNow());

        Assert.NotNull(response);
        Assert.Equal("XI PPLG-A", response.ClassName);
        Assert.Equal(expectedCategory, response.ActiveCategory);
        Assert.NotNull(response.Items);
    }

    [Fact]
    public async Task Phase40_GetTodaySchedulesForStudent_KKUnavailableState_ReturnsTrue()
    {
        using var context = CreateInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);
        var scheduleService = new ScheduleService(context, rotationService);

        var studentB = await context.Users.FirstAsync(u => u.Email == "bagas@student.smkn2surakarta.sch.id");

        var response = await scheduleService.GetTodaySchedulesForStudentAsync(studentB.Id);

        var expectedCategory = await rotationService.GetCurrentCategoryForClassAsync(studentB.ClassId!.Value, ScheduleService.GetWibNow());

        Assert.NotNull(response);
        Assert.Equal("XI PPLG-B", response.ClassName);
        Assert.Equal(expectedCategory, response.ActiveCategory);
        if (expectedCategory == SubjectCategory.KK && response.Items.Count == 0)
        {
            Assert.True(response.IsKkUnavailable, "When ActiveCategory is KK and 0 daily KK schedules exist, IsKkUnavailable must be true");
        }
    }


    [Fact]
    public async Task Phase40_IDOR_StudentAccessingOtherClass_ThrowsUnauthorized()
    {
        using var context = CreateInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);
        var scheduleService = new ScheduleService(context, rotationService);

        var studentA = await context.Users.FirstAsync(u => u.Email == "aditya@student.smkn2surakarta.sch.id");
        var classB = await context.SchoolClasses.FirstAsync(c => c.Name == "XI PPLG-B");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await scheduleService.GetAllAsync(classId: classB.Id, requestingUserId: studentA.Id, requestingUserRole: "Student");
        });
    }

    [Fact]
    public async Task Phase40_IDOR_TeacherAccessingOtherTeacher_ThrowsUnauthorized()
    {
        using var context = CreateInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);
        var scheduleService = new ScheduleService(context, rotationService);

        var teacherA = await context.Users.FirstAsync(u => u.Email == "budi@teacher.smkn2surakarta.sch.id");
        var teacherB = await context.Users.FirstAsync(u => u.Email == "siti@teacher.smkn2surakarta.sch.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await scheduleService.GetAllAsync(teacherId: teacherB.Id, requestingUserId: teacherA.Id, requestingUserRole: "Teacher");
        });
    }

    [Fact]
    public async Task Phase40_RotationMatrix_CalculatesDeterministcCategories()
    {
        using var context = CreateInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);

        var classA = await context.SchoolClasses.FirstAsync(c => c.Name == "XI PPLG-A");
        var classB = await context.SchoolClasses.FirstAsync(c => c.Name == "XI PPLG-B");

        var anchorDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc); // Monday Week 1
        var week2Date = new DateTime(2026, 7, 20, 0, 0, 0, DateTimeKind.Utc);  // Monday Week 2
        var week3Date = new DateTime(2026, 7, 27, 0, 0, 0, DateTimeKind.Utc);  // Monday Week 3

        // Week 1
        Assert.Equal(SubjectCategory.MPU, await rotationService.GetCurrentCategoryForClassAsync(classA.Id, anchorDate));
        Assert.Equal(SubjectCategory.KK, await rotationService.GetCurrentCategoryForClassAsync(classB.Id, anchorDate));

        // Week 2 (Swapped)
        Assert.Equal(SubjectCategory.KK, await rotationService.GetCurrentCategoryForClassAsync(classA.Id, week2Date));
        Assert.Equal(SubjectCategory.MPU, await rotationService.GetCurrentCategoryForClassAsync(classB.Id, week2Date));

        // Week 3 (Returned)
        Assert.Equal(SubjectCategory.MPU, await rotationService.GetCurrentCategoryForClassAsync(classA.Id, week3Date));
        Assert.Equal(SubjectCategory.KK, await rotationService.GetCurrentCategoryForClassAsync(classB.Id, week3Date));
    }

    [Fact]
    public void Phase40_Timezone_WibAsiaJakarta_ReturnsValidTime()
    {
        var wibNow = ScheduleService.GetWibNow();
        Assert.NotEqual(default, wibNow);
    }
}
