using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class StudentCalendarSecurityTests
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
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Cal", Email = "adm_cal@sch.id", Role = UserRole.Admin, IsActive = true };
        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "guru1@sch.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "guru2@sch.id", Role = UserRole.Teacher, IsActive = true };

        var classA = new SchoolClass { Id = Guid.NewGuid(), Name = "X-PPLG-1", Grade = "X", HomeroomTeacherId = teacher1.Id };
        var classB = new SchoolClass { Id = Guid.NewGuid(), Name = "X-PPLG-2", Grade = "X", HomeroomTeacherId = teacher2.Id };

        var studentA = new User { Id = Guid.NewGuid(), FullName = "Siswa Class A", Email = "s_a@sch.id", Role = UserRole.Student, ClassId = classA.Id, IsActive = true };
        var studentB = new User { Id = Guid.NewGuid(), FullName = "Siswa Class B", Email = "s_b@sch.id", Role = UserRole.Student, ClassId = classB.Id, IsActive = true };

        context.Users.AddRange(admin, teacher1, teacher2, studentA, studentB);
        context.SchoolClasses.AddRange(classA, classB);

        var subject = new Subject { Id = Guid.NewGuid(), Code = "RPL", Name = "Pemrograman", IsActive = true };
        context.Subjects.Add(subject);

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, SubjectId = subject.Id };
        context.TeacherSubjects.Add(ts1);

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = classA.Id, TeacherSubjectId = ts1.Id };
        context.ClassSubjects.Add(cs1);

        context.SaveChangesAsync().Wait();
    }

    [Fact]
    public async Task Test_1_StudentCannotAccessAdminOnlyEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var adminEv = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Rapat Rahasia Kerahasiaan",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(2),
            Category = "Meeting",
            Visibility = "AdminOnly"
        }, admin.Id, "Admin");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.GetEventByIdAsync(adminEv.Id, userRole: "Student");
        });
    }

    [Fact]
    public async Task Test_2_TeacherCannotAccessUnauthorizedAdminOnlyEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var adminEv = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Rapat Manajemen Eksekutif",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(2),
            Category = "Meeting",
            Visibility = "AdminOnly"
        }, admin.Id, "Admin");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.GetEventByIdAsync(adminEv.Id, userRole: "Teacher");
        });
    }

    [Fact]
    public async Task Test_3_TeacherCannotCreateAdminOnlyEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "guru1@sch.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.CreateEventAsync(new CreateCalendarEventRequest
            {
                Title = "Kegiatan Ilegal AdminOnly",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddHours(1),
                Category = "Academic",
                Visibility = "AdminOnly"
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_4_TeacherCannotUpdateEventToAdminOnly()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "guru1@sch.id");

        var created = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Agenda Biasa Guru",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(1),
            Category = "Academic",
            Visibility = "TeacherOnly"
        }, teacher1.Id, "Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.UpdateEventAsync(created.Id, new UpdateCalendarEventRequest
            {
                Title = "Agenda Biasa Guru",
                Category = "Academic",
                Visibility = "AdminOnly"
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_5_AdminCanCreateAdminOnlyEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var created = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Rapat Anggaran",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(2),
            Category = "Meeting",
            Visibility = "AdminOnly"
        }, admin.Id, "Admin");

        Assert.NotNull(created);
        Assert.Equal("AdminOnly", created.Visibility);
    }

    [Fact]
    public async Task Test_6_TeacherCannotTargetArbitraryClass()
    {
        var context = GetInMemoryDbContext();
        var acadService = new AcademicEventService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "guru1@sch.id"); // Homeroom for Class A
        var classB = await context.SchoolClasses.FirstAsync(c => c.Name == "X-PPLG-2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await acadService.CreateAsync(new CreateAcademicEventRequest
            {
                Title = "Kuis Dadakan",
                TargetType = "Class",
                TargetClassId = classB.Id,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(1)
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_7_TeacherCanTargetClassTheyTeach()
    {
        var context = GetInMemoryDbContext();
        var acadService = new AcademicEventService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "guru1@sch.id"); // Teaches Class A
        var classA = await context.SchoolClasses.FirstAsync(c => c.Name == "X-PPLG-1");

        var created = await acadService.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Ujian Praktek RPL",
            TargetType = "Class",
            TargetClassId = classA.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(2)
        }, teacher1.Id, "Teacher");

        Assert.NotNull(created);
        Assert.Equal(classA.Id, created.TargetClassId);
    }

    [Fact]
    public async Task Test_8_StudentCannotAccessAnotherClassTargetedEvent()
    {
        var context = GetInMemoryDbContext();
        var acadService = new AcademicEventService(context);
        var studentB = await context.Users.FirstAsync(u => u.Email == "s_b@sch.id"); // Belongs to Class B
        var classA = await context.SchoolClasses.FirstAsync(c => c.Name == "X-PPLG-1");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var eventClassA = await acadService.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Agenda Khusus Kelas A",
            TargetType = "Class",
            TargetClassId = classA.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1)
        }, admin.Id, "Admin");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await acadService.GetByIdAsync(eventClassA.Id, studentB.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_9_UnauthorizedUserCannotRetrieveTargetedEventById()
    {
        var context = GetInMemoryDbContext();
        var acadService = new AcademicEventService(context);
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "guru2@sch.id"); // Teaches Class B, not Class A
        var classA = await context.SchoolClasses.FirstAsync(c => c.Name == "X-PPLG-1");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var eventClassA = await acadService.CreateAsync(new CreateAcademicEventRequest
        {
            Title = "Agenda Rahasia Kelas A",
            TargetType = "Class",
            TargetClassId = classA.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1)
        }, admin.Id, "Admin");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await acadService.GetByIdAsync(eventClassA.Id, teacher2.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_10_UnauthorizedTeacherCannotUpdateAnotherTeacherEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "guru1@sch.id");
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "guru2@sch.id");

        var event1 = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Agenda Guru 1",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(1),
            Category = "Academic",
            Visibility = "TeacherOnly"
        }, teacher1.Id, "Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.UpdateEventAsync(event1.Id, new UpdateCalendarEventRequest
            {
                Title = "Agenda Hijack Guru 2",
                Category = "Academic",
                Visibility = "TeacherOnly"
            }, teacher2.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_11_UnauthorizedTeacherCannotDeleteAnotherTeacherEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var teacher1 = await context.Users.FirstAsync(u => u.Email == "guru1@sch.id");
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "guru2@sch.id");

        var event1 = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Agenda Guru 1 Untuk Dihapus",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(1),
            Category = "Academic",
            Visibility = "Public"
        }, teacher1.Id, "Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.DeleteEventAsync(event1.Id, teacher2.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_12_PageSizeIsCappedServerSide()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);

        var paged = await calService.GetEventsAsync(page: 1, pageSize: 999, category: null, userRole: "Admin");
        Assert.Equal(100, paged.PageSize);
    }

    [Fact]
    public async Task Test_13_PaginationOccursAfterFiltering()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        for (int i = 0; i < 15; i++)
        {
            await calService.CreateEventAsync(new CreateCalendarEventRequest
            {
                Title = $"Event {i}",
                StartDate = DateTime.UtcNow.AddDays(i),
                EndDate = DateTime.UtcNow.AddDays(i).AddHours(1),
                Category = "Academic",
                Visibility = "Public"
            }, admin.Id, "Admin");
        }

        var paged = await calService.GetEventsAsync(page: 1, pageSize: 5, category: "Academic", userRole: "Student");
        Assert.Equal(15, paged.TotalCount);
        Assert.Equal(5, paged.Items.Count);
    }

    [Fact]
    public async Task Test_14_DateRangeFilteringRemainsCorrect()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Event Agustus 2026",
            StartDate = new DateTime(2026, 8, 10, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 8, 12, 0, 0, 0, DateTimeKind.Utc),
            Category = "Academic",
            Visibility = "Public"
        }, admin.Id, "Admin");

        var monthly = await calService.GetMonthlyEventsAsync(2026, 8, "Student");
        Assert.Single(monthly);
        Assert.Equal("Event Agustus 2026", monthly[0].Title);
    }

    [Fact]
    public async Task Test_15_InvalidStartDateAfterEndDateIsRejected()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await calService.CreateEventAsync(new CreateCalendarEventRequest
            {
                Title = "Event Tanggal Terbalik",
                StartDate = DateTime.UtcNow.AddDays(5),
                EndDate = DateTime.UtcNow.AddDays(1),
                Category = "Academic"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Test_16_ExistingHistoricalEventsRemainReadable()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var pastEv = await calService.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Event Lampau Tahun 2024",
            StartDate = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2024, 5, 2, 0, 0, 0, DateTimeKind.Utc),
            Category = "Academic",
            Visibility = "Public"
        }, admin.Id, "Admin");

        var retrieved = await calService.GetEventByIdAsync(pastEv.Id, "Student");
        Assert.NotNull(retrieved);
        Assert.Equal("Event Lampau Tahun 2024", retrieved!.Title);
    }

    [Fact]
    public async Task Test_17_MalformedCategoryVisibilityMetadataCannotBypassAuthorization()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        // Manually seed a row with multiplexed category string in database
        var rawEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Title = "Event Legacy Multiplexed AdminOnly",
            Category = "Academic|Visibility:AdminOnly",
            Visibility = "Public", // Mismatched legacy column
            CreatedByUserId = admin.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddHours(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.CalendarEvents.Add(rawEvent);
        await context.SaveChangesAsync();

        // Student query must filter out row because category contains |Visibility:AdminOnly
        var studentEvents = await calService.GetEventsAsync(1, 10, null, "Student");
        Assert.Empty(studentEvents.Items);

        // Student direct lookup by ID must fail with UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.GetEventByIdAsync(rawEvent.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_18_StudentCannotCreateOrUpdateCalendarEvent()
    {
        var context = GetInMemoryDbContext();
        var calService = new CalendarService(context);
        var studentA = await context.Users.FirstAsync(u => u.Email == "s_a@sch.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await calService.CreateEventAsync(new CreateCalendarEventRequest
            {
                Title = "Event Siswa Ilegal",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddHours(1)
            }, studentA.Id, "Student");
        });
    }
}
