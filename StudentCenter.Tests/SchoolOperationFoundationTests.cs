using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Data.Seeders;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class SchoolOperationFoundationTests
{
    private AppDbContext GetDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SubjectCRUD_And_UniqueCodeEnforcement()
    {
        using var context = GetDbContext(nameof(SubjectCRUD_And_UniqueCodeEnforcement));
        var service = new SubjectService(context);

        // Create
        var s1 = await service.CreateAsync(new CreateSubjectRequest
        {
            Code = "MTK",
            Name = "Matematika Utama",
            Description = "Mata Pelajaran Matematika"
        });

        Assert.NotNull(s1);
        Assert.Equal("MTK", s1.Code);

        // Duplicate code throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(new CreateSubjectRequest
            {
                Code = "mtk", // case insensitive check
                Name = "Matematika Lain"
            });
        });

        // Update
        var updated = await service.UpdateAsync(s1.Id, new UpdateSubjectRequest
        {
            Code = "MTK-EDIT",
            Name = "Matematika Terapan",
            IsActive = true
        });

        Assert.Equal("MTK-EDIT", updated!.Code);

        // Delete
        var deleted = await service.DeleteAsync(s1.Id);
        Assert.True(deleted);
    }

    [Fact]
    public async Task TeacherSubject_UniqueConstraint()
    {
        using var context = GetDbContext(nameof(TeacherSubject_UniqueConstraint));
        var service = new TeacherSubjectService(context);

        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru A", Email = "guruA@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var subject = new Subject { Id = Guid.NewGuid(), Code = "FIS", Name = "Fisika" };

        context.Users.Add(teacher);
        context.Subjects.Add(subject);
        await context.SaveChangesAsync();

        // First assignment succeeds
        var ts = await service.CreateAsync(new CreateTeacherSubjectRequest
        {
            TeacherId = teacher.Id,
            SubjectId = subject.Id
        });

        Assert.NotNull(ts);

        // Second assignment throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(new CreateTeacherSubjectRequest
            {
                TeacherId = teacher.Id,
                SubjectId = subject.Id
            });
        });
    }

    [Fact]
    public async Task ClassSubject_UniqueConstraint()
    {
        using var context = GetDbContext(nameof(ClassSubject_UniqueConstraint));
        var service = new ClassSubjectService(context);

        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "RPL" };
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        var cls = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };

        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru B", Email = "guruB@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var subject = new Subject { Id = Guid.NewGuid(), Code = "KIM", Name = "Kimia" };
        var ts = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher.Id, SubjectId = subject.Id };

        context.Departments.Add(dept);
        context.AcademicYears.Add(year);
        context.SchoolClasses.Add(cls);
        context.Users.Add(teacher);
        context.Subjects.Add(subject);
        context.TeacherSubjects.Add(ts);
        await context.SaveChangesAsync();

        var cs1 = await service.CreateAsync(new CreateClassSubjectRequest
        {
            ClassId = cls.Id,
            TeacherSubjectId = ts.Id
        });

        Assert.NotNull(cs1);

        // Duplicate Class + TeacherSubject throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(new CreateClassSubjectRequest
            {
                ClassId = cls.Id,
                TeacherSubjectId = ts.Id
            });
        });
    }

    [Fact]
    public async Task Schedule_InvalidTimeRange_ThrowsValidation()
    {
        using var context = GetDbContext(nameof(Schedule_InvalidTimeRange_ThrowsValidation));
        var scheduleService = new ScheduleService(context);

        // StartTime >= EndTime
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = Guid.NewGuid(),
                SemesterId = Guid.NewGuid(),
                DayOfWeek = 1,
                StartTime = "09:00",
                EndTime = "08:00",
                Room = "R.101"
            });
        });
    }

    [Fact]
    public async Task Schedule_ConflictDetection_Teacher_Class_Room()
    {
        using var context = GetDbContext(nameof(Schedule_ConflictDetection_Teacher_Class_Room));
        var scheduleService = new ScheduleService(context);

        // Seed Active AcademicYear & Semester
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var semester = new Semester { Id = Guid.NewGuid(), AcademicYearId = year.Id, Name = "Ganjil", Order = 1, IsActive = true };
        context.AcademicYears.Add(year);
        context.Semesters.Add(semester);

        // Seed Class 1 and Class 2
        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "RPL" };
        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };
        context.Departments.Add(dept);
        context.SchoolClasses.AddRange(class1, class2);

        // Seed Teacher 1 and Teacher 2, Subject 1 and Subject 2
        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "MAPEL1", Name = "Mapel 1" };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "MAPEL2", Name = "Mapel 2" };

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, SubjectId = subject1.Id };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = subject2.Id };

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, TeacherSubjectId = ts1.Id };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, TeacherSubjectId = ts2.Id };

        context.Users.AddRange(teacher1, teacher2);
        context.Subjects.AddRange(subject1, subject2);
        context.TeacherSubjects.AddRange(ts1, ts2);
        context.ClassSubjects.AddRange(cs1, cs2);
        await context.SaveChangesAsync();

        // 1. Create Base Schedule: Class 1, Teacher 1, Room R.101, Day Monday, 07:00-08:30
        var baseSched = await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1, // Monday
            StartTime = "07:00",
            EndTime = "08:30",
            Room = "R.101"
        });

        Assert.NotNull(baseSched);

        // 2. Teacher Conflict Test: Teacher 1 scheduled for Class 2 at 08:00-09:30 (overlaps 07:00-08:30)
        var csTeacherOverlap = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, TeacherSubjectId = ts1.Id };
        context.ClassSubjects.Add(csTeacherOverlap);
        await context.SaveChangesAsync();

        var teacherEx = await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = csTeacherOverlap.Id,
                SemesterId = semester.Id,
                DayOfWeek = 1,
                StartTime = "08:00",
                EndTime = "09:30",
                Room = "R.102"
            });
        });
        Assert.Contains("Bentrok Guru", teacherEx.Message);

        // 3. Class Conflict Test: Class 1 scheduled for Subject 2 (Teacher 2) at 07:30-09:00 (overlaps 07:00-08:30)
        var csClassOverlap = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, TeacherSubjectId = ts2.Id };
        context.ClassSubjects.Add(csClassOverlap);
        await context.SaveChangesAsync();

        var classEx = await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = csClassOverlap.Id,
                SemesterId = semester.Id,
                DayOfWeek = 1,
                StartTime = "07:30",
                EndTime = "09:00",
                Room = "R.103"
            });
        });
        Assert.Contains("Bentrok Kelas", classEx.Message);

        // 4. Room Conflict Test: Room R.101 used by Class 2 & Teacher 2 at 08:00-09:00 (overlaps 07:00-08:30)
        var roomEx = await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs2.Id,
                SemesterId = semester.Id,
                DayOfWeek = 1,
                StartTime = "08:00",
                EndTime = "09:00",
                Room = "R.101"
            });
        });
        Assert.Contains("Bentrok Ruangan", roomEx.Message);

        // 5. Adjacent Schedule Allowed Test (08:30-10:00 does NOT conflict with 07:00-08:30)
        var adjacentSched = await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs2.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "08:30",
            EndTime = "10:00",
            Room = "R.101"
        });
        Assert.NotNull(adjacentSched);

        // 6. Update Schedule Self-Non-Conflict Test: updating baseSched without changing time should succeed
        var updatedBase = await scheduleService.UpdateAsync(baseSched.Id, new UpdateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "07:00",
            EndTime = "08:30",
            Room = "R.101",
            Color = "#ff0000"
        });
        Assert.NotNull(updatedBase);
    }

    [Fact]
    public async Task Schedule_InactiveSemester_And_InactiveAcademicYear_Rejection()
    {
        using var context = GetDbContext(nameof(Schedule_InactiveSemester_And_InactiveAcademicYear_Rejection));
        var scheduleService = new ScheduleService(context);

        // Active year but inactive semester
        var year1 = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var inactSem = new Semester { Id = Guid.NewGuid(), AcademicYearId = year1.Id, Name = "Semester Inaktif", Order = 1, IsActive = false };

        // Inactive year with active semester
        var year2 = new AcademicYear { Id = Guid.NewGuid(), Name = "2024/2025", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = false };
        var actSemInactYear = new Semester { Id = Guid.NewGuid(), AcademicYearId = year2.Id, Name = "Semester 1", Order = 1, IsActive = true };

        context.AcademicYears.AddRange(year1, year2);
        context.Semesters.AddRange(inactSem, actSemInactYear);
        await context.SaveChangesAsync();

        var cs = new ClassSubject { Id = Guid.NewGuid() };
        context.ClassSubjects.Add(cs);
        await context.SaveChangesAsync();

        // Attempt on inactive semester -> throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs.Id,
                SemesterId = inactSem.Id,
                DayOfWeek = 1,
                StartTime = "07:00",
                EndTime = "08:30",
                Room = "R.101"
            });
        });

        // Attempt on active semester with inactive academic year -> throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs.Id,
                SemesterId = actSemInactYear.Id,
                DayOfWeek = 1,
                StartTime = "07:00",
                EndTime = "08:30",
                Room = "R.101"
            });
        });
    }

    [Fact]
    public async Task AcademicEvent_TargetingValidation()
    {
        using var context = GetDbContext(nameof(AcademicEvent_TargetingValidation));
        var service = new AcademicEventService(context);

        // Global Event (TargetType = All) -> TargetClassId null
        var globalEv = await service.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Libur Nasional",
            Type = "Holiday",
            TargetType = "All",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1)
        });

        Assert.NotNull(globalEv);
        Assert.Null(globalEv.TargetClassId);

        // Class Event (TargetType = Class) without TargetClassId -> throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Ujian Susulan Kelas",
                Type = "Exam",
                TargetType = "Class",
                TargetClassId = null,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            });
        });
    }

    [Fact]
    public async Task Idempotent_SubjectSeeder_Execution()
    {
        using var context = GetDbContext(nameof(Idempotent_SubjectSeeder_Execution));

        var serviceProvider = new ServiceCollection()
            .AddSingleton(context)
            .BuildServiceProvider();

        // Seed first time
        await OperationDataSeeder.SeedAsync(serviceProvider);
        var initialCount = await context.Subjects.CountAsync();
        Assert.True(initialCount >= 9); // 9 default subjects

        // Seed second time (Idempotent)
        await OperationDataSeeder.SeedAsync(serviceProvider);
        var secondCount = await context.Subjects.CountAsync();
        Assert.Equal(initialCount, secondCount);
    }
}
