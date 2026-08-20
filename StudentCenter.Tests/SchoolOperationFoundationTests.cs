using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
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

    [Fact]
    public async Task ScheduleService_SecurityAndBoundaryRules_Enforced()
    {
        using var context = GetDbContext(nameof(ScheduleService_SecurityAndBoundaryRules_Enforced));
        var scheduleService = new ScheduleService(context);

        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var semester = new Semester { Id = Guid.NewGuid(), AcademicYearId = year.Id, Name = "Ganjil", Order = 1, IsActive = true };
        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "RPL" };

        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1_sched@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2_sched@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1_sched@test.com", Role = UserRole.Student, ClassId = class1.Id, PasswordHash = "hash" };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2", Email = "s2_sched@test.com", Role = UserRole.Student, ClassId = class2.Id, PasswordHash = "hash" };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Sched", Email = "admin_sched@test.com", Role = UserRole.Admin, PasswordHash = "hash" };

        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika" };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "BIN", Name = "Bahasa Indonesia" };

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, SubjectId = subject1.Id };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = subject2.Id };

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, TeacherSubjectId = ts1.Id };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, TeacherSubjectId = ts2.Id };

        context.AcademicYears.Add(year);
        context.Semesters.Add(semester);
        context.Departments.Add(dept);
        context.SchoolClasses.AddRange(class1, class2);
        context.Users.AddRange(teacher1, teacher2, student1, student2, admin);
        context.Subjects.AddRange(subject1, subject2);
        context.TeacherSubjects.AddRange(ts1, ts2);
        context.ClassSubjects.AddRange(cs1, cs2);
        await context.SaveChangesAsync();

        var schedClass1 = await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "07:00",
            EndTime = "08:30",
            Room = "R.101"
        });

        var schedClass2 = await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs2.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "08:30",
            EndTime = "10:00",
            Room = "R.102"
        });

        // 1. Student 1 can read own class schedules
        var s1List = await scheduleService.GetAllAsync(requestingUserId: student1.Id, requestingUserRole: "Student");
        Assert.Single(s1List);
        Assert.Equal(schedClass1.Id, s1List[0].Id);

        // 2. Student 1 cannot read Student 2's class schedule by passing class2.Id query param (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            scheduleService.GetAllAsync(classId: class2.Id, requestingUserId: student1.Id, requestingUserRole: "Student"));


        // 3. Student 1 cannot access schedClass2 detail (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            scheduleService.GetByIdAsync(schedClass2.Id, student1.Id, "Student"));

        // 4. Teacher 1 can read schedules within assigned teaching scope
        var t1List = await scheduleService.GetAllAsync(requestingUserId: teacher1.Id, requestingUserRole: "Teacher");
        Assert.Single(t1List);
        Assert.Equal(schedClass1.Id, t1List[0].Id);

        // 5. Teacher 1 cannot access Teacher 2's schedule detail (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            scheduleService.GetByIdAsync(schedClass2.Id, teacher1.Id, "Teacher"));

        // 6. Admin can view all schedules system-wide
        var adminList = await scheduleService.GetAllAsync(requestingUserId: admin.Id, requestingUserRole: "Admin");
        Assert.Equal(2, adminList.Count);

        // 7. Admin can access any schedule detail
        var adminDetail = await scheduleService.GetByIdAsync(schedClass2.Id, admin.Id, "Admin");
        Assert.NotNull(adminDetail);
    }

    [Fact]
    public async Task AcademicEvents_SecurityAndBoundaryRules_Enforced()
    {
        using var context = GetDbContext(nameof(AcademicEvents_SecurityAndBoundaryRules_Enforced));
        var eventService = new AcademicEventService(context);

        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "RPL" };
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };

        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1 Ev", Email = "s1_ev@test.com", Role = UserRole.Student, ClassId = class1.Id, PasswordHash = "hash" };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2 Ev", Email = "s2_ev@test.com", Role = UserRole.Student, ClassId = class2.Id, PasswordHash = "hash" };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Ev", Email = "admin_ev@test.com", Role = UserRole.Admin, PasswordHash = "hash" };

        context.Departments.Add(dept);
        context.AcademicYears.Add(year);
        context.SchoolClasses.AddRange(class1, class2);
        context.Users.AddRange(student1, student2, admin);
        await context.SaveChangesAsync();

        // 1. Create global event (TargetType = All)
        var globalEv = await eventService.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Libur Nasional",
            Type = "Holiday",
            TargetType = "All",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1),
            IsActive = true
        });

        // 2. Create class1 event (TargetType = Class)
        var class1Ev = await eventService.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Ujian Susulan Class 1",
            Type = "Exam",
            TargetType = "Class",
            TargetClassId = class1.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1),
            IsActive = true
        });

        // 3. Create class2 event (TargetType = Class)
        var class2Ev = await eventService.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Ujian Susulan Class 2",
            Type = "Exam",
            TargetType = "Class",
            TargetClassId = class2.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1),
            IsActive = true
        });

        // --- STUDENT VISIBILITY & ISOLATION TESTS ---
        // Student 1 can list "All" and own class events (2 events: globalEv + class1Ev)
        var s1List = await eventService.GetAllAsync(student1.Id, "Student");
        Assert.Equal(2, s1List.Count);
        Assert.Contains(s1List, e => e.Id == globalEv.Id);
        Assert.Contains(s1List, e => e.Id == class1Ev.Id);
        Assert.DoesNotContain(s1List, e => e.Id == class2Ev.Id);

        // Student 1 requesting classId=class2.Id query returns empty (does not bypass class isolation)
        var s1BypassList = await eventService.GetAllAsync(student1.Id, "Student", classId: class2.Id);
        Assert.Empty(s1BypassList);

        // Student 1 can access own class event detail
        var s1Class1Detail = await eventService.GetByIdAsync(class1Ev.Id, student1.Id, "Student");
        Assert.NotNull(s1Class1Detail);

        // Student 1 cannot access class2 event detail (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            eventService.GetByIdAsync(class2Ev.Id, student1.Id, "Student"));

        // --- ADMIN ACCESS TESTS ---
        // Admin can list all academic events (3 events)
        var adminList = await eventService.GetAllAsync(admin.Id, "Admin");
        Assert.Equal(3, adminList.Count);

        // Admin can access any event detail
        var adminClass2Detail = await eventService.GetByIdAsync(class2Ev.Id, admin.Id, "Admin");
        Assert.NotNull(adminClass2Detail);

        // --- VALIDATION BOUNDARY TESTS ---
        // Empty title rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "  ",
                Type = "Holiday",
                TargetType = "All",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }));

        // Invalid TargetType rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Invalid Target",
                Type = "Holiday",
                TargetType = "InvalidTarget",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }));

        // Class-targeted event without TargetClassId rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Class Event No Id",
                Type = "Exam",
                TargetType = "Class",
                TargetClassId = null,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }));

        // Class-targeted event with non-existent classId rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Fake Class Event",
                Type = "Exam",
                TargetType = "Class",
                TargetClassId = Guid.NewGuid(),
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }));

        // Invalid date range (StartDate > EndDate) rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Inverted Dates",
                Type = "Holiday",
                TargetType = "All",
                StartDate = DateTime.UtcNow.AddDays(2),
                EndDate = DateTime.UtcNow
            }));
    }

    [Fact]
    public async Task CalendarEvents_VisibilityAndOwnership_Enforced()
    {
        using var context = GetDbContext(nameof(CalendarEvents_VisibilityAndOwnership_Enforced));
        var calendarService = new CalendarService(context);

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru Cal 1", Email = "g1_cal@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru Cal 2", Email = "g2_cal@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa Cal 1", Email = "s1_cal@test.com", Role = UserRole.Student, PasswordHash = "hash" };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Cal", Email = "admin_cal@test.com", Role = UserRole.Admin, PasswordHash = "hash" };

        context.Users.AddRange(teacher1, teacher2, student1, admin);
        await context.SaveChangesAsync();

        // 1. Create Public event by Teacher 1
        var pubEv = await calendarService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Rapat Umum",
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddHours(2),
            Visibility = "Public"
        }, teacher1.Id);

        // 2. Create TeacherOnly event by Teacher 1
        var teachEv = await calendarService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Rapat Guru Intern",
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddHours(2),
            Visibility = "TeacherOnly"
        }, teacher1.Id);

        // 3. Create AdminOnly event by Admin
        var adminEv = await calendarService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Rapat Direksi",
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddHours(2),
            Visibility = "AdminOnly"
        }, admin.Id);

        // --- VISIBILITY FILTERING TESTS ---
        // Student sees Public ONLY in monthly query
        var studentMonth = await calendarService.GetMonthlyEventsAsync(DateTime.UtcNow.Year, DateTime.UtcNow.Month, "Student");
        Assert.Single(studentMonth);
        Assert.Equal(pubEv.Id, studentMonth[0].Id);

        // Student requesting non-public event detail throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            calendarService.GetEventByIdAsync(teachEv.Id, "Student"));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            calendarService.GetEventByIdAsync(adminEv.Id, "Student"));

        // Teacher sees Public and TeacherOnly in monthly query (2 events)
        var teacherMonth = await calendarService.GetMonthlyEventsAsync(DateTime.UtcNow.Year, DateTime.UtcNow.Month, "Teacher");
        Assert.Equal(2, teacherMonth.Count);
        Assert.DoesNotContain(teacherMonth, e => e.Id == adminEv.Id);

        // Teacher requesting AdminOnly event detail throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            calendarService.GetEventByIdAsync(adminEv.Id, "Teacher"));

        // Admin sees Public, TeacherOnly, and AdminOnly in monthly query (3 events)
        var adminMonth = await calendarService.GetMonthlyEventsAsync(DateTime.UtcNow.Year, DateTime.UtcNow.Month, "Admin");
        Assert.Equal(3, adminMonth.Count);

        // --- OWNERSHIP & MUTATION TESTS ---
        // Teacher 1 can update own event
        var t1Update = await calendarService.UpdateEventAsync(pubEv.Id, new UpdateCalendarEventRequest
        {
            Title = "Rapat Umum Terjadwal Ulang",
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddHours(3),
            Visibility = "Public"
        }, teacher1.Id, "Teacher");
        Assert.NotNull(t1Update);
        Assert.Equal("Rapat Umum Terjadwal Ulang", t1Update.Title);

        // Teacher 2 cannot update Teacher 1's event (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            calendarService.UpdateEventAsync(pubEv.Id, new UpdateCalendarEventRequest
            {
                Title = "Hijack Attempt",
                StartDate = DateTime.UtcNow.Date,
                EndDate = DateTime.UtcNow.Date.AddHours(3),
                Visibility = "Public"
            }, teacher2.Id, "Teacher"));

        // Teacher 2 cannot delete Teacher 1's event (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            calendarService.DeleteEventAsync(pubEv.Id, teacher2.Id, "Teacher"));

        // Admin CAN update Teacher 1's event
        var adminUpdate = await calendarService.UpdateEventAsync(pubEv.Id, new UpdateCalendarEventRequest
        {
            Title = "Rapat Diubah Admin",
            StartDate = DateTime.UtcNow.Date,
            EndDate = DateTime.UtcNow.Date.AddHours(3),
            Visibility = "Public"
        }, admin.Id, "Admin");
        Assert.NotNull(adminUpdate);

        // Admin CAN delete Teacher 1's event
        var adminDeleteSuccess = await calendarService.DeleteEventAsync(pubEv.Id, admin.Id, "Admin");
        Assert.True(adminDeleteSuccess);

        // --- VALIDATION TESTS ---
        // Empty calendar title rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            calendarService.CreateEventAsync(new CreateCalendarEventRequest
            {
                Title = "   ",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddHours(1)
            }, teacher1.Id));

        // StartDate > EndDate rejected
        await Assert.ThrowsAsync<ValidationException>(() =>
            calendarService.CreateEventAsync(new CreateCalendarEventRequest
            {
                Title = "Salah Tanggal",
                StartDate = DateTime.UtcNow.AddDays(2),
                EndDate = DateTime.UtcNow
            }, teacher1.Id));
    }

    [Fact]
    public async Task FacilityBooking_HardeningAndBoundaryRules_Enforced()
    {
        using var context = GetDbContext(nameof(FacilityBooking_HardeningAndBoundaryRules_Enforced));
        var mockNotificationService = new Moq.Mock<INotificationService>();
        var mockLogger = new Moq.Mock<Microsoft.Extensions.Logging.ILogger<BookingService>>();
        var bookingService = new BookingService(context, mockNotificationService.Object, mockLogger.Object);
        var facilityService = new FacilityService(context, new Moq.Mock<Microsoft.Extensions.Logging.ILogger<FacilityService>>().Object);

        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Book", Email = "admin_book@test.com", Role = UserRole.Admin, PasswordHash = "hash" };
        var managerTeacher = new User { Id = Guid.NewGuid(), FullName = "Manager Teacher", Email = "mgr_teach@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var otherTeacher = new User { Id = Guid.NewGuid(), FullName = "Other Teacher", Email = "oth_teach@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student 1 Book", Email = "s1_book@test.com", Role = UserRole.Student, PasswordHash = "hash" };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Student 2 Book", Email = "s2_book@test.com", Role = UserRole.Student, PasswordHash = "hash" };

        context.Users.AddRange(admin, managerTeacher, otherTeacher, student1, student2);

        var labA = new Facility
        {
            Id = Guid.NewGuid(),
            Name = "Lab RPL A",
            Location = "Lantai 2",
            Capacity = 36,
            IsActive = true,
            ManagerTeacherId = managerTeacher.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Facilities.Add(labA);
        await context.SaveChangesAsync();

        var baseTime = DateTime.UtcNow.Date.AddDays(1).AddHours(9); // Tomorrow 09:00

        // 1. Booking_OverlappingReservation_IsRejected
        var booking1 = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = labA.Id,
            Purpose = "Praktikum Web",
            StartTime = baseTime,
            EndTime = baseTime.AddHours(2) // 09:00 - 11:00
        }, student1.Id);

        Assert.NotNull(booking1);

        // Overlapping 09:30 - 10:30 MUST be rejected (InvalidOperationException)
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = labA.Id,
                Purpose = "Overlapping Request",
                StartTime = baseTime.AddMinutes(30),
                EndTime = baseTime.AddHours(1).AddMinutes(30)
            }, student2.Id));

        // 2. Booking_AdjacentReservations_AreAllowed (11:00 - 12:00 MUST be allowed)
        var adjacentBooking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = labA.Id,
            Purpose = "Praktikum Mobile",
            StartTime = baseTime.AddHours(2),
            EndTime = baseTime.AddHours(3)
        }, student2.Id);
        Assert.NotNull(adjacentBooking);

        // 3. CancelBooking_SetsCancelledStatus_InsteadOfDeleting & DoesNotBlockNewBooking
        var cancelSuccess = await bookingService.CancelBookingAsync(booking1.Id, student1.Id, "Student");
        Assert.True(cancelSuccess);

        // Verify cancelled booking remains in DB with Cancelled status
        var cancelledDbRecord = await context.Set<FacilityBooking>().FindAsync(booking1.Id);
        Assert.NotNull(cancelledDbRecord);
        Assert.Equal(BookingStatus.Cancelled, cancelledDbRecord!.Status);

        // Cancelled booking MUST NOT block a new booking for 09:00 - 11:00
        var newSlotBooking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = labA.Id,
            Purpose = "Pengganti Praktikum",
            StartTime = baseTime,
            EndTime = baseTime.AddHours(2)
        }, student2.Id);
        Assert.NotNull(newSlotBooking);

        // 4. Booking_RejectedReservation_DoesNotBlockNewBooking
        var rejectCandidate = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = labA.Id,
            Purpose = "Sesi Sore",
            StartTime = baseTime.AddHours(4),
            EndTime = baseTime.AddHours(5)
        }, student1.Id);

        // Manager approves/rejects: ManagerTeacher CAN approve
        var rejectedRes = await bookingService.UpdateStatusAsync(rejectCandidate.Id, new UpdateBookingStatusRequest
        {
            Status = BookingStatus.Rejected,
            RejectionReason = "Bentrokan Acara Sekolah"
        }, managerTeacher.Id, "Teacher");

        Assert.Equal(BookingStatus.Rejected, rejectedRes!.Status);

        // Rejected booking MUST NOT block 13:00 - 14:00
        var rebookedRes = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = labA.Id,
            Purpose = "Sesi Sore Pengganti",
            StartTime = baseTime.AddHours(4),
            EndTime = baseTime.AddHours(5)
        }, student2.Id);
        Assert.NotNull(rebookedRes);

        // --- AUTHORIZATION TESTS ---
        // 5. NonManagerTeacher CANNOT approve or reject (throws UnauthorizedAccessException)
        var pendingBooking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = labA.Id,
            Purpose = "Sesi Malam",
            StartTime = baseTime.AddHours(6),
            EndTime = baseTime.AddHours(7)
        }, student1.Id);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            bookingService.UpdateStatusAsync(pendingBooking.Id, new UpdateBookingStatusRequest { Status = BookingStatus.Approved }, otherTeacher.Id, "Teacher"));

        // 6. Student CANNOT approve or reject (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            bookingService.UpdateStatusAsync(pendingBooking.Id, new UpdateBookingStatusRequest { Status = BookingStatus.Approved }, student2.Id, "Student"));

        // 7. Admin CAN approve
        var adminApproved = await bookingService.UpdateStatusAsync(pendingBooking.Id, new UpdateBookingStatusRequest { Status = BookingStatus.Approved }, admin.Id, "Admin");
        Assert.Equal(BookingStatus.Approved, adminApproved!.Status);

        // --- INPUT VALIDATION TESTS ---
        // 8. Booking_InvalidDateRange_ThrowsValidation (StartTime >= EndTime)
        await Assert.ThrowsAsync<ValidationException>(() =>
            bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = labA.Id,
                Purpose = "Inverted Time",
                StartTime = baseTime.AddHours(2),
                EndTime = baseTime
            }, student1.Id));

        // 9. Booking_PastStartTime_ThrowsValidation
        await Assert.ThrowsAsync<ValidationException>(() =>
            bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = labA.Id,
                Purpose = "Past Booking",
                StartTime = DateTime.UtcNow.AddHours(-2),
                EndTime = DateTime.UtcNow.AddHours(-1)
            }, student1.Id));

        // 10. Booking_EmptyPurpose_ThrowsValidation
        await Assert.ThrowsAsync<ValidationException>(() =>
            bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = labA.Id,
                Purpose = "   ",
                StartTime = baseTime.AddDays(1),
                EndTime = baseTime.AddDays(1).AddHours(1)
            }, student1.Id));
    }
}
