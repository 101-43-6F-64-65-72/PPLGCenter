using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.Services;
using StudentCenter.Infrastructure.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;

namespace StudentCenter.Tests;

public class BusinessRulesTests
{
    private readonly AppDbContext _context;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ILogger<BookingService>> _mockBookingLogger;
    private readonly Mock<ILogger<AttendanceService>> _mockAttendanceLogger;

    public BusinessRulesTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _mockNotificationService = new Mock<INotificationService>();
        _mockBookingLogger = new Mock<ILogger<BookingService>>();
        _mockAttendanceLogger = new Mock<ILogger<AttendanceService>>();
    }

    [Fact]
    public async Task Submission_CannotBeSubmittedAfterDeadline()
    {
        // Arrange
        var assignmentId = Guid.NewGuid();
        var assignment = new Assignment { Id = assignmentId, DueDate = DateTime.UtcNow.AddDays(-1), MaxScore = 100 };
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var service = new SubmissionService(_context, _mockNotificationService.Object);

        // Act
        var act = async () => await service.SubmitAsync(assignmentId, new SubmitAssignmentRequest { }, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task GradeSubmission_UnauthorizedTeacher_ThrowsException()
    {
        // Arrange
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var student = new User { Id = studentId, FullName = "Student" };
        var teacher = new User { Id = teacherId, FullName = "Teacher" };
        _context.Users.AddRange(student, teacher);
        
        var assignmentId = Guid.NewGuid();
        var assignment = new Assignment { Id = assignmentId, CreatedByUserId = Guid.NewGuid(), MaxScore = 100 }; // Different teacher
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();
        
        var submission = new Submission { Id = Guid.NewGuid(), AssignmentId = assignmentId, StudentId = studentId };
        _context.Submissions.Add(submission);
        await _context.SaveChangesAsync();

        var service = new SubmissionService(_context, _mockNotificationService.Object);

        // Act
        var act = async () => await service.GradeSubmissionAsync(submission.Id, new GradeSubmissionRequest { Score = 10 }, teacherId, "Teacher");

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task BookingStatus_InvalidTransition_ThrowsException()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var user = new User { Id = Guid.NewGuid(), FullName = "Test User" };
        _context.Users.Add(user);
        var facility = new Facility { Id = Guid.NewGuid(), Name = "Gym" };
        _context.Facilities.Add(facility);
        var booking = new FacilityBooking { Id = bookingId, FacilityId = facility.Id, BookedByUserId = user.Id, Status = BookingStatus.Approved }; // Already approved
        _context.FacilityBookings.Add(booking);
        await _context.SaveChangesAsync();

        var service = new BookingService(_context, _mockNotificationService.Object, _mockBookingLogger.Object);

        // Act
        var act = async () => await service.UpdateStatusAsync(bookingId, new UpdateBookingStatusRequest { Status = BookingStatus.Approved }, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Attendance_CannotCreateFutureAttendance()
    {
        // Arrange
        var service = new AttendanceService(_context, _mockAttendanceLogger.Object);
        var futureDate = DateTime.UtcNow.AddDays(1);

        // Act
        var act = async () => await service.CreateAsync(new CreateAttendanceRequest { StudentId = Guid.NewGuid(), AttendanceDate = futureDate }, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Attendance_DuplicateForDate_ThrowsException()
    {
        // Arrange
        var studentId = Guid.NewGuid();
        var student = new User { Id = studentId, FullName = "Student" };
        var recorder = new User { Id = Guid.NewGuid(), FullName = "Recorder" };
        _context.Users.AddRange(student, recorder);
        
        var date = DateTime.UtcNow.Date;
        _context.Attendances.Add(new Attendance { Id = Guid.NewGuid(), StudentId = studentId, AttendanceDate = date, RecordedByUserId = recorder.Id });
        await _context.SaveChangesAsync();
        var service = new AttendanceService(_context, _mockAttendanceLogger.Object);

        // Act
        var act = async () => await service.CreateAsync(new CreateAttendanceRequest { StudentId = studentId, AttendanceDate = date }, Guid.NewGuid());

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
