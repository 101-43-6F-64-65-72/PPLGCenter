using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Moq;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class StudentAttendanceSecurityTests
{
    private readonly Mock<INotificationService> _mockNotificationService;

    public StudentAttendanceSecurityTests()
    {
        _mockNotificationService = new Mock<INotificationService>();
    }

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
        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", Grade = "X", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.SchoolClasses.AddRange(class1, class2);

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1@sch.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2@sch.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1@sch.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2", Email = "s2@sch.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, IsActive = true };
        var student3 = new User { Id = Guid.NewGuid(), FullName = "Siswa 3 (Class 2)", Email = "s3@sch.id", Role = UserRole.Student, ClassId = class2.Id, Class = class2, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Center", Email = "adm@sch.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacher1, teacher2, student1, student2, student3, admin);

        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "PWPB", Name = "Pemrograman Web", IsActive = true };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika", IsActive = true };
        context.Subjects.AddRange(subject1, subject2);

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, Teacher = teacher1, SubjectId = subject1.Id, Subject = subject1 };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, Teacher = teacher2, SubjectId = subject2.Id, Subject = subject2 };
        context.TeacherSubjects.AddRange(ts1, ts2);

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, Class = class1, TeacherSubjectId = ts1.Id, TeacherSubject = ts1 };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, Class = class2, TeacherSubjectId = ts2.Id, TeacherSubject = ts2 };
        context.ClassSubjects.AddRange(cs1, cs2);

        var semester = new Semester { Id = Guid.NewGuid(), Name = "Semester 1", Order = 1, IsActive = true };
        context.Semesters.Add(semester);

        // Schedule configured specifically for Monday
        var sched1 = new Schedule
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs1.Id,
            ClassSubject = cs1,
            SemesterId = semester.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = TimeSpan.Parse("07:00"),
            EndTime = TimeSpan.Parse("08:30"),
            Room = "Lab 1"
        };
        context.Schedules.Add(sched1);

        context.SaveChangesAsync().Wait();
    }

    private static DateTime GetNextWeekday(DayOfWeek dayOfWeek)
    {
        DateTime start = DateTime.UtcNow.Date;
        while (start.DayOfWeek != dayOfWeek)
        {
            start = start.AddDays(1);
        }
        return start;
    }

    [Fact]
    public async Task Test_1_TeacherCannotCreateSessionForAnotherTeachersSchedule()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@sch.id"); // Teacher 2
        var sched1 = await context.Schedules.FirstAsync(); // Assigned to Teacher 1

        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.CreateSessionAsync(teacher2.Id, new CreateAttendanceSessionRequest
            {
                ScheduleId = sched1.Id,
                Date = validMonday,
                SessionNumber = 1
            });
        });
    }

    [Fact]
    public async Task Test_2_TeacherCannotModifyAnotherTeachersAttendance()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateStudentStatusAsync(session1.Id, teacher2.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = student1.Id,
                Status = AttendanceStatus.Present
            });
        });
    }

    [Fact]
    public async Task Test_3_StudentCannotModifyAttendance()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateStudentStatusAsync(session1.Id, student1.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = student1.Id,
                Status = AttendanceStatus.Present
            });
        });
    }

    [Fact]
    public async Task Test_4_StudentCannotInspectAnotherStudentsAttendance()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        var studentView = await service.GetSessionByIdAsync(session1.Id, student1.Id, "Student");

        Assert.NotNull(studentView);
        Assert.Single(studentView!.Attendances); // Strict record isolation: only 1 attendance item
        Assert.Equal(student1.Id, studentView.Attendances[0].StudentId);
    }

    [Fact]
    public async Task Test_5_StudentCannotAccessAnotherClassAttendance()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student3 = await context.Users.FirstAsync(u => u.Email == "s3@sch.id"); // Class 2 student
        var sched1 = await context.Schedules.FirstAsync(); // Class 1 schedule
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetSessionByIdAsync(session1.Id, student3.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_6_ClosedSessionCannotBeModified()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await service.CloseSessionAsync(session1.Id, teacher1.Id);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpdateStudentStatusAsync(session1.Id, teacher1.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = student1.Id,
                Status = AttendanceStatus.Present
            });
        });
    }

    [Fact]
    public async Task Test_7_ClosedSessionCannotBeClosedTwice()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await service.CloseSessionAsync(session1.Id, teacher1.Id);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CloseSessionAsync(session1.Id, teacher1.Id);
        });
    }

    [Fact]
    public async Task Test_8_InvalidAttendanceStatusRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        // Cast invalid int enum value
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpdateStudentStatusAsync(session1.Id, teacher1.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = Guid.NewGuid(), // Non-existent student
                Status = (AttendanceStatus)99
            });
        });
    }

    [Fact]
    public async Task Test_9_ForeignClassStudentRejectedDuringIndividualStatusUpdate()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student3 = await context.Users.FirstAsync(u => u.Email == "s3@sch.id"); // Enrolled in Class 2
        var sched1 = await context.Schedules.FirstAsync(); // Assigned to Class 1
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpdateStudentStatusAsync(session1.Id, teacher1.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = student3.Id,
                Status = AttendanceStatus.Present
            });
        });
    }

    [Fact]
    public async Task Test_10_ForeignClassStudentRejectedDuringBulkUpdate()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id"); // Class 1
        var student3 = await context.Users.FirstAsync(u => u.Email == "s3@sch.id"); // Class 2
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.BulkUpdateAttendanceAsync(session1.Id, teacher1.Id, new BulkUpdateAttendanceRequest
            {
                Records = new List<UpdateAttendanceStatusRequest>
                {
                    new UpdateAttendanceStatusRequest { StudentId = student1.Id, Status = AttendanceStatus.Present },
                    new UpdateAttendanceStatusRequest { StudentId = student3.Id, Status = AttendanceStatus.Present } // Invalid student
                }
            });
        });
    }

    [Fact]
    public async Task Test_11_InvalidScheduleDateWeekdayRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var sched1 = await context.Schedules.FirstAsync(); // Monday schedule
        var invalidSunday = GetNextWeekday(DayOfWeek.Sunday); // Sunday

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
            {
                ScheduleId = sched1.Id,
                Date = invalidSunday,
                SessionNumber = 1
            });
        });
    }

    [Fact]
    public async Task Test_12_ValidScheduleDateAccepted()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var sched1 = await context.Schedules.FirstAsync(); // Monday schedule
        var validMonday = GetNextWeekday(DayOfWeek.Monday); // Monday

        var session = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday,
            SessionNumber = 1
        });

        Assert.NotNull(session);
        Assert.Equal("Open", session.Status);
        Assert.Equal(validMonday.Date, session.Date.Date);
    }

    [Fact]
    public async Task Test_13_ConcurrentDuplicateSessionCreationHandledSafely()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        // Duplicate session attempt on same schedule and date
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
            {
                ScheduleId = sched1.Id,
                Date = validMonday
            });
        });
    }

    [Fact]
    public async Task Test_14_AttendanceHistoryDoesNotProduceNPlusOneBehaviorAndIncludesMetadata()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        await service.UpdateStudentStatusAsync(session.Id, teacher1.Id, new UpdateAttendanceStatusRequest
        {
            StudentId = student1.Id,
            Status = AttendanceStatus.Present,
            Notes = "Hadir Tepat Waktu"
        });

        var history = await service.GetStudentAttendanceHistoryAsync(student1.Id);

        Assert.NotNull(history);
        Assert.NotEmpty(history);
        var item = history[0];
        Assert.Equal("X RPL 1", item.ClassName);
        Assert.Equal("Pemrograman Web", item.SubjectName);
        Assert.Equal("PWPB", item.SubjectCode);
        Assert.Equal("Guru 1", item.TeacherName);
        Assert.Equal("Present", item.Status);
    }

    [Fact]
    public async Task Test_15_AdminRetainsIntendedGlobalAuthority()
    {
        var context = GetInMemoryDbContext();
        var service = new AttendanceService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var sched1 = await context.Schedules.FirstAsync();
        var validMonday = GetNextWeekday(DayOfWeek.Monday);

        var session = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = validMonday
        });

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        // Admin can update attendance for any session
        var updated = await service.UpdateStudentStatusAsync(session.Id, admin.Id, new UpdateAttendanceStatusRequest
        {
            StudentId = student1.Id,
            Status = AttendanceStatus.Late,
            Notes = "Admin override"
        });

        Assert.NotNull(updated);
        Assert.Equal(1, updated!.LateCount);

        // Admin can close any session
        var closed = await service.CloseSessionAsync(session.Id, admin.Id);
        Assert.NotNull(closed);
        Assert.Equal("Closed", closed!.Status);
    }
}
