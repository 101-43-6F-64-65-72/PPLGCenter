using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class CalendarTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedData(context);
        return context;
    }

    private void SeedData(AppDbContext context)
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Calendar", Email = "admin@cal.id", Role = UserRole.Admin, IsActive = true };
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Calendar", Email = "guru@cal.id", Role = UserRole.Teacher, IsActive = true };
        var student = new User { Id = Guid.NewGuid(), FullName = "Siswa Calendar", Email = "siswa@cal.id", Role = UserRole.Student, IsActive = true };

        context.Users.AddRange(admin, teacher, student);
        context.SaveChanges();
    }

    [Fact]
    public async Task Calendar_CRUD_SoftDelete_MonthlyDaily_Succeeds()
    {
        var context = GetInMemoryDbContext();
        var service = new CalendarService(context);
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var created = await service.CreateEventAsync(new CreateCalendarEventRequest
        {
            Title = "Ujian Akhir Semester 2026",
            Description = "UAS Serentak Seluruh Kelas",
            EventDate = new DateTime(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            StartTime = "08:00",
            EndTime = "12:00",
            Location = "Aula Utama",
            Category = "Exam",
            Visibility = "Public"
        }, admin.Id);

        Assert.NotNull(created);
        Assert.Equal("Ujian Akhir Semester 2026", created.Title);

        // Update
        var updated = await service.UpdateEventAsync(created.Id, new UpdateCalendarEventRequest
        {
            Title = "Ujian Akhir Semester 2026 (Updated)",
            Description = "Deskripsi baru UAS",
            EventDate = new DateTime(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc),
            Category = "Exam",
            Visibility = "Public"
        }, admin.Id, "Admin");

        Assert.Equal("Ujian Akhir Semester 2026 (Updated)", updated?.Title);

        // Monthly
        var monthly = await service.GetMonthlyEventsAsync(2026, 8, "Student");
        Assert.Single(monthly);

        // Daily
        var daily = await service.GetDailyEventsAsync(new DateTime(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc), "Student");
        Assert.Single(daily);

        // Soft Delete
        var deleted = await service.DeleteEventAsync(created.Id, admin.Id, "Admin");
        Assert.True(deleted);

        var getAfterDelete = await service.GetEventByIdAsync(created.Id);
        Assert.Null(getAfterDelete);
    }
}
