using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Api.Controllers;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class ScheduleSecurityTests
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

        var semester = new Semester { Id = Guid.NewGuid(), AcademicYearId = ay.Id, AcademicYear = ay, Name = "Ganjil", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.Semesters.Add(semester);

        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 1", Grade = "XI", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 2", Grade = "XI", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.SchoolClasses.AddRange(class1, class2);

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1@test.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2@test.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa Class 1", Email = "s1@test.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, NIS = "3001", IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Class 2", Email = "s2@test.id", Role = UserRole.Student, ClassId = class2.Id, Class = class2, NIS = "3002", IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Center", Email = "adm@test.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacher1, teacher2, student1, student2, admin);

        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika", IsActive = true };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "IPA", Name = "Fisika", IsActive = true };
        context.Subjects.AddRange(subject1, subject2);

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, Teacher = teacher1, SubjectId = subject1.Id, Subject = subject1, CreatedAt = DateTime.UtcNow };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, Teacher = teacher2, SubjectId = subject2.Id, Subject = subject2, CreatedAt = DateTime.UtcNow };
        context.TeacherSubjects.AddRange(ts1, ts2);

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, Class = class1, TeacherSubjectId = ts1.Id, TeacherSubject = ts1, CreatedAt = DateTime.UtcNow };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, Class = class2, TeacherSubjectId = ts2.Id, TeacherSubject = ts2, CreatedAt = DateTime.UtcNow };
        context.ClassSubjects.AddRange(cs1, cs2);

        var facility = new Facility { Id = Guid.NewGuid(), Name = "Lab RPL 1", Category = "Lab", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.Facilities.Add(facility);

        context.SaveChanges();
    }

    [Fact]
    public async Task Student_CannotReadAnotherClassSchedule()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@test.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await scheduleService.GetAllAsync(
                classId: class2.Id,
                requestingUserId: student1.Id,
                requestingUserRole: "Student"
            );
        });
    }


    [Fact]
    public async Task Student_CannotReadAnotherClassRotationConfig()
    {
        var context = GetInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@test.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await rotationService.GetConfigByClassIdAsync(class2.Id, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Teacher_CannotModifyAnotherTeachersSchedule()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@test.id");
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@test.id");
        var cs2 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacher2.Id);
        var semester = await context.Semesters.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs2.Id,
                SemesterId = semester.Id,
                DayOfWeek = 1,
                StartTime = "08:00",
                EndTime = "09:30",
                Room = "R101"
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Teacher_CannotModifyAnotherClassRotationConfig()
    {
        var context = GetInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@test.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await rotationService.SaveConfigAsync(new SaveScheduleRotationConfigRequest
            {
                SchoolClassId = class2.Id,
                AnchorStartDate = DateTime.UtcNow,
                InitialCategory = SubjectCategory.KK,
                CycleWeeks = 2,
                IsActive = true
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task AssignedTeacher_CanModifyAuthorizedSchedule()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@test.id");
        var cs1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacher1.Id);
        var semester = await context.Semesters.FirstAsync();

        var created = await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "08:00",
            EndTime = "09:30",
            Room = "Lab RPL 1"
        }, teacher1.Id, "Teacher");

        Assert.NotNull(created);
        Assert.Equal("Lab RPL 1", created.Room);
    }

    [Fact]
    public async Task Admin_CanModifyAnySchedule()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var cs1 = await context.ClassSubjects.FirstAsync();
        var semester = await context.Semesters.FirstAsync();

        var created = await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 2,
            StartTime = "10:00",
            EndTime = "11:30",
            Room = "R102"
        }, admin.Id, "Admin");

        Assert.NotNull(created);
    }

    [Fact]
    public async Task GetSchedules_SundayDayOfWeek7_ReturnsSundaySchedules()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var cs1 = await context.ClassSubjects.FirstAsync();
        var semester = await context.Semesters.FirstAsync();

        // Create Sunday schedule (dayOfWeek = 7 in request)
        await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 7,
            StartTime = "08:00",
            EndTime = "09:30",
            Room = "R103"
        }, admin.Id, "Admin");

        var sundayList = await scheduleService.GetAllAsync(dayOfWeek: 7, requestingUserId: admin.Id, requestingUserRole: "Admin");
        Assert.NotEmpty(sundayList);
        Assert.Equal(7, sundayList[0].DayOfWeek);
    }

    [Fact]
    public async Task GetSchedules_AllDayValues1Through7_MapCorrectly()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var cs1 = await context.ClassSubjects.FirstAsync();
        var semester = await context.Semesters.FirstAsync();

        for (int day = 1; day <= 7; day++)
        {
            var created = await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs1.Id,
                SemesterId = semester.Id,
                DayOfWeek = day,
                StartTime = "07:00",
                EndTime = "07:45",
                Room = $"R20{day}"
            }, admin.Id, "Admin");

            Assert.Equal(day, created.DayOfWeek);
        }
    }

    [Fact]
    public async Task RotationConfig_InvalidCycleWeeks_ThrowsValidationException()
    {
        var context = GetInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class1 = await context.SchoolClasses.FirstAsync();

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await rotationService.SaveConfigAsync(new SaveScheduleRotationConfigRequest
            {
                SchoolClassId = class1.Id,
                AnchorStartDate = DateTime.UtcNow,
                InitialCategory = SubjectCategory.KK,
                CycleWeeks = 0,
                IsActive = true
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task RotationConfig_InvalidCategory_ThrowsValidationException()
    {
        var context = GetInMemoryDbContext();
        var rotationService = new ScheduleRotationService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class1 = await context.SchoolClasses.FirstAsync();

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await rotationService.SaveConfigAsync(new SaveScheduleRotationConfigRequest
            {
                SchoolClassId = class1.Id,
                AnchorStartDate = DateTime.UtcNow,
                InitialCategory = (SubjectCategory)999,
                CycleWeeks = 2,
                IsActive = true
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task CreateSchedule_ClassOverlap_ReturnsConflict()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var cs1 = await context.ClassSubjects.FirstAsync();
        var semester = await context.Semesters.FirstAsync();

        await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "08:00",
            EndTime = "10:00",
            Room = "R101"
        }, admin.Id, "Admin");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs1.Id,
                SemesterId = semester.Id,
                DayOfWeek = 1,
                StartTime = "09:00",
                EndTime = "11:00",
                Room = "R102"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task CreateSchedule_TeacherOverlap_ReturnsConflict()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@test.id");
        var cs1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacher1.Id);
        var semester = await context.Semesters.FirstAsync();

        await scheduleService.CreateAsync(new CreateScheduleRequest
        {
            ClassSubjectId = cs1.Id,
            SemesterId = semester.Id,
            DayOfWeek = 3,
            StartTime = "08:00",
            EndTime = "10:00",
            Room = "R101"
        }, admin.Id, "Admin");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs1.Id,
                SemesterId = semester.Id,
                DayOfWeek = 3,
                StartTime = "09:30",
                EndTime = "11:00",
                Room = "R105"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task CreateSchedule_FacilityBookingConflict_ReturnsConflict()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var facility = await context.Facilities.FirstAsync(f => f.Name == "Lab RPL 1");
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@test.id");
        var cs1 = await context.ClassSubjects.FirstAsync();
        var semester = await context.Semesters.FirstAsync();

        // Create an approved facility booking on a future Monday
        var nextMonday = DateTime.UtcNow.Date.AddDays(((int)DayOfWeek.Monday - (int)DateTime.UtcNow.DayOfWeek + 7) % 7 + 7);
        var booking = new FacilityBooking
        {
            Id = Guid.NewGuid(),
            FacilityId = facility.Id,
            BookedByUserId = teacher1.Id,
            Purpose = "Workshop",
            StartTime = nextMonday.AddHours(8),
            EndTime = nextMonday.AddHours(11),
            Status = BookingStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.FacilityBookings.Add(booking);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await scheduleService.CreateAsync(new CreateScheduleRequest
            {
                ClassSubjectId = cs1.Id,
                SemesterId = semester.Id,
                DayOfWeek = 1, // Monday
                StartTime = "09:00",
                EndTime = "10:00",
                Room = "Lab RPL 1"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Student_CannotModifyUnauthorizedAcademicEvent()
    {
        var context = GetInMemoryDbContext();
        var eventService = new AcademicEventService(context);
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@test.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Agenda Student Attempt",
                TargetType = "All",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Teacher_CannotModifyUnauthorizedAcademicEvent()
    {
        var context = GetInMemoryDbContext();
        var eventService = new AcademicEventService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@test.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await eventService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Agenda Teacher Attempt",
                TargetType = "All",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }, teacher1.Id, "Teacher");
        });
    }

    private static void SetControllerUser(ControllerBase controller, Guid userId, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    [Fact]
    public async Task GetAllAsync_WhenSemesterIdOmitted_DefaultsToActiveSemester()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var admin = await context.Users.FirstAsync(u => u.Email == "adm@test.id");
        var activeSemester = await context.Semesters.FirstAsync(s => s.IsActive);

        var schedules = await scheduleService.GetAllAsync(
            semesterId: null,
            requestingUserId: admin.Id,
            requestingUserRole: "Admin"
        );

        Assert.NotNull(schedules);
        Assert.All(schedules, s => Assert.Equal(activeSemester.Id, s.SemesterId));
    }

    [Fact]
    public async Task ValidateScheduleRulesAsync_AdjacentTimeSlots_AreAllowed()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var admin = await context.Users.FirstAsync(u => u.Email == "adm@test.id");
        var semester = await context.Semesters.FirstAsync(s => s.IsActive);
        var classSubject = await context.ClassSubjects.FirstAsync();

        // Create initial schedule 09:00 - 10:00
        var req1 = new CreateScheduleRequest
        {
            ClassSubjectId = classSubject.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "09:00",
            EndTime = "10:00",
            Room = "Lab 1",
            IsActive = true
        };
        var s1 = await scheduleService.CreateAsync(req1, admin.Id, "Admin");
        Assert.NotNull(s1);

        // Create adjacent schedule 10:00 - 11:00 in same room
        var req2 = new CreateScheduleRequest
        {
            ClassSubjectId = classSubject.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "10:00",
            EndTime = "11:00",
            Room = "Lab 1",
            IsActive = true
        };
        var s2 = await scheduleService.CreateAsync(req2, admin.Id, "Admin");
        Assert.NotNull(s2);
    }

    [Fact]
    public async Task ValidateScheduleRulesAsync_OverlappingTimeSlots_TriggerConflictException()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var admin = await context.Users.FirstAsync(u => u.Email == "adm@test.id");
        var semester = await context.Semesters.FirstAsync(s => s.IsActive);
        var classSubject = await context.ClassSubjects.FirstAsync();

        var req1 = new CreateScheduleRequest
        {
            ClassSubjectId = classSubject.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "09:00",
            EndTime = "10:00",
            Room = "Lab 1",
            IsActive = true
        };
        await scheduleService.CreateAsync(req1, admin.Id, "Admin");

        // Overlapping schedule 09:30 - 10:30
        var req2 = new CreateScheduleRequest
        {
            ClassSubjectId = classSubject.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "09:30",
            EndTime = "10:30",
            Room = "Lab 1",
            IsActive = true
        };

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await scheduleService.CreateAsync(req2, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task UpdateAsync_SelfUpdate_DoesNotConflictWithItself()
    {
        var context = GetInMemoryDbContext();
        var scheduleService = new ScheduleService(context);

        var admin = await context.Users.FirstAsync(u => u.Email == "adm@test.id");
        var semester = await context.Semesters.FirstAsync(s => s.IsActive);
        var classSubject = await context.ClassSubjects.FirstAsync();

        var req1 = new CreateScheduleRequest
        {
            ClassSubjectId = classSubject.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "09:00",
            EndTime = "10:00",
            Room = "Lab 1",
            IsActive = true
        };
        var s1 = await scheduleService.CreateAsync(req1, admin.Id, "Admin");

        // Update s1 without changing times
        var updateReq = new UpdateScheduleRequest
        {
            ClassSubjectId = classSubject.Id,
            SemesterId = semester.Id,
            DayOfWeek = 1,
            StartTime = "09:00",
            EndTime = "10:00",
            Room = "Lab 1 Renamed",
            IsActive = true
        };

        var updated = await scheduleService.UpdateAsync(s1.Id, updateReq, admin.Id, "Admin");
        Assert.NotNull(updated);
        Assert.Equal("Lab 1 Renamed", updated!.Room);
    }
}
