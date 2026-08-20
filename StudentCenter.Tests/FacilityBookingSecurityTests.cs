using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using StudentCenter.Api.Controllers;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class FacilityBookingSecurityTests
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
        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Admin Principal",
            Email = "admin@fac.id",
            Role = UserRole.Admin,
            IsActive = true
        };

        var teacherManager = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Guru Manager Lab",
            Email = "manager@fac.id",
            Role = UserRole.Teacher,
            IsActive = true
        };

        var teacherUnassigned = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Guru Unassigned",
            Email = "unassigned@fac.id",
            Role = UserRole.Teacher,
            IsActive = true
        };

        var student1 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siswa Lab 1",
            Email = "siswa1@fac.id",
            Role = UserRole.Student,
            NIS = "3001",
            IsActive = true
        };

        var student2 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siswa Lab 2",
            Email = "siswa2@fac.id",
            Role = UserRole.Student,
            NIS = "3002",
            IsActive = true
        };

        context.Users.AddRange(admin, teacherManager, teacherUnassigned, student1, student2);

        var facility = new Facility
        {
            Id = Guid.NewGuid(),
            Name = "Lab Komputer 1",
            Description = "Laboratorium RPL",
            Location = "Lantai 2",
            Capacity = 36,
            IsActive = true,
            ManagerTeacherId = teacherManager.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Facilities.Add(facility);

        context.FacilityManagers.Add(new FacilityManager
        {
            Id = Guid.NewGuid(),
            FacilityId = facility.Id,
            ManagerUserId = teacherManager.Id,
            AssignedAt = DateTime.UtcNow
        });

        context.SaveChanges();
    }

    [Fact]
    public async Task Test_01_StudentCannotAccessAnotherUsersBooking()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var startTime = DateTime.UtcNow.AddDays(1);
        var endTime = startTime.AddHours(2);

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = startTime,
            EndTime = endTime,
            Purpose = "Praktikum Siswa 1"
        }, student1.Id);

        // Student2 attempts to retrieve Student1's booking by ID
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await bookingService.GetBookingByIdAsync(booking.Id, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_02_StudentCannotApproveOrRejectBooking()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = DateTime.UtcNow.AddDays(2),
            EndTime = DateTime.UtcNow.AddDays(2).AddHours(2),
            Purpose = "Kegiatan Belajar"
        }, student1.Id);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
            {
                Status = BookingStatus.Approved
            }, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_03_UnassignedTeacherCannotApproveBooking()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var teacherUnassigned = await context.Users.FirstAsync(u => u.Email == "unassigned@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = DateTime.UtcNow.AddDays(3),
            EndTime = DateTime.UtcNow.AddDays(3).AddHours(2),
            Purpose = "Kegiatan Uji Coba"
        }, student1.Id);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
            {
                Status = BookingStatus.Approved
            }, teacherUnassigned.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_04_AssignedFacilityManagerCanApproveBooking()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var teacherManager = await context.Users.FirstAsync(u => u.Email == "manager@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = DateTime.UtcNow.AddDays(4),
            EndTime = DateTime.UtcNow.AddDays(4).AddHours(2),
            Purpose = "Praktikum Multimedia"
        }, student1.Id);

        var response = await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
        {
            Status = BookingStatus.Approved
        }, teacherManager.Id, "Teacher");

        Assert.NotNull(response);
        Assert.Equal(BookingStatus.Approved, response.Status);
    }

    [Fact]
    public async Task Test_05_AdminCanManageBookingsGlobally()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = DateTime.UtcNow.AddDays(5),
            EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
            Purpose = "Kegiatan OSIS"
        }, student1.Id);

        var response = await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
        {
            Status = BookingStatus.Approved
        }, admin.Id, "Admin");

        Assert.NotNull(response);
        Assert.Equal(BookingStatus.Approved, response.Status);
    }

    [Fact]
    public async Task Test_06_ClientCannotSpoofBookedByUserIdInController()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@fac.id");
        var facilityService = new FacilityService(context, NullLogger<FacilityService>.Instance);

        var currentUserService = new MockCurrentUserService { UserId = student1.Id, Role = "Student" };
        var controller = new BookingController(bookingService, currentUserService, facilityService);

        var facility = await context.Facilities.FirstAsync();
        var request = new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = DateTime.UtcNow.AddDays(6),
            EndTime = DateTime.UtcNow.AddDays(6).AddHours(2),
            Purpose = "Tes Spoofing User ID"
        };

        var result = await controller.CreateBooking(request);
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var response = Assert.IsType<ApiResponse<BookingResponse>>(createdResult.Value);
        Assert.NotNull(response.Data);
        Assert.Equal(student1.Id, response.Data.BookedByUserId);
    }

    [Fact]
    public async Task Test_08_OverlappingBookingIsRejected()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var startTime = DateTime.UtcNow.AddDays(7);
        var endTime = startTime.AddHours(2);

        await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = startTime,
            EndTime = endTime,
            Purpose = "Booking Pertama"
        }, student1.Id);

        // Student2 attempts to book overlapping time window
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = facility.Id,
                StartTime = startTime.AddMinutes(30),
                EndTime = endTime.AddMinutes(30),
                Purpose = "Booking Tumpang Tindih"
            }, student2.Id);
        });
    }

    [Fact]
    public async Task Test_09_AdjacentNonOverlappingBookingRemainsAllowed()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var startTime1 = DateTime.UtcNow.AddDays(8);
        var endTime1 = startTime1.AddHours(2);

        await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = startTime1,
            EndTime = endTime1,
            Purpose = "Sesi 1"
        }, student1.Id);

        // Student2 books exactly adjacent window starting at endTime1
        var booking2 = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = endTime1,
            EndTime = endTime1.AddHours(2),
            Purpose = "Sesi 2 (Berdampingan)"
        }, student2.Id);

        Assert.NotNull(booking2);
        Assert.Equal(endTime1, booking2.StartTime);
    }

    [Fact]
    public async Task Test_10_InvalidTimeRangeIsRejected()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var startTime = DateTime.UtcNow.AddDays(9);

        // StartTime >= EndTime
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = facility.Id,
                StartTime = startTime,
                EndTime = startTime.AddHours(-1),
                Purpose = "Waktu Terbalik"
            }, student1.Id);
        });
    }

    [Fact]
    public async Task Test_11_PastBookingIsRejected()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var facility = await context.Facilities.FirstAsync();

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = facility.Id,
                StartTime = DateTime.UtcNow.AddDays(-2),
                EndTime = DateTime.UtcNow.AddDays(-2).AddHours(2),
                Purpose = "Peminjaman Masa Lalu"
            }, student1.Id);
        });
    }

    [Fact]
    public async Task Test_12_InvalidStateTransitionsAreRejected()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var facility = await context.Facilities.FirstAsync();

        var booking = await bookingService.CreateBookingAsync(new CreateBookingRequest
        {
            FacilityId = facility.Id,
            StartTime = DateTime.UtcNow.AddDays(10),
            EndTime = DateTime.UtcNow.AddDays(10).AddHours(2),
            Purpose = "Uji Transisi Status"
        }, student1.Id);

        // Pending -> Rejected
        await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
        {
            Status = BookingStatus.Rejected,
            RejectionReason = "Jadwal Penuh"
        }, admin.Id, "Admin");

        // Rejected -> Approved MUST FAIL
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await bookingService.UpdateStatusAsync(booking.Id, new UpdateBookingStatusRequest
            {
                Status = BookingStatus.Approved
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Test_13_ScheduleConflictRemainsEnforced()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@fac.id");
        var facility = await context.Facilities.FirstAsync();

        // Seed Active Academic Year, Semester, ClassSubject & Schedule matching Lab Komputer 1
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", IsActive = true };
        var semester = new Semester { Id = Guid.NewGuid(), AcademicYearId = year.Id, Name = "Ganjil", Order = 1, IsActive = true };
        context.AcademicYears.Add(year);
        context.Semesters.Add(semester);

        var scheduleDate = DateTime.UtcNow.AddDays(14);
        var dayOfWeek = scheduleDate.DayOfWeek;

        var schedule = new Schedule
        {
            Id = Guid.NewGuid(),
            SemesterId = semester.Id,
            DayOfWeek = dayOfWeek,
            StartTime = new TimeSpan(8, 0, 0),
            EndTime = new TimeSpan(10, 0, 0),
            Room = facility.Name,
            IsActive = true
        };
        context.Schedules.Add(schedule);
        await context.SaveChangesAsync();

        // Booking during 08:30 - 09:30 on dayOfWeek in Lab Komputer 1 MUST fail due to Schedule Conflict
        var bookingStartTime = new DateTime(scheduleDate.Year, scheduleDate.Month, scheduleDate.Day, 8, 30, 0, DateTimeKind.Utc);
        var bookingEndTime = new DateTime(scheduleDate.Year, scheduleDate.Month, scheduleDate.Day, 9, 30, 0, DateTimeKind.Utc);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await bookingService.CreateBookingAsync(new CreateBookingRequest
            {
                FacilityId = facility.Id,
                StartTime = bookingStartTime,
                EndTime = bookingEndTime,
                Purpose = "Uji Bentrok Jadwal Pelajaran"
            }, student1.Id);
        });

        Assert.Contains("Bentrok Jadwal Kelas", ex.Message);
    }

    [Fact]
    public async Task Test_15_PageSizeIsBoundedInGetBookings()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var logger = NullLogger<BookingService>.Instance;
        var bookingService = new BookingService(context, notificationService, logger);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        // Request pageSize = 1000, should be capped at 100
        var result = await bookingService.GetBookingsAsync(1, 1000, null, null, null, admin.Id, "Admin");

        Assert.Equal(100, result.PageSize);
    }

    private class MockCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; }
        public string? Role { get; set; }
        public string? Email { get; set; }
        public string? FullName { get; set; }
        public bool IsAuthenticated => UserId.HasValue;
    }
}
