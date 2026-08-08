using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class BusinessRulesTests
{
    private readonly AppDbContext _context;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ILogger<BookingService>> _mockBookingLogger;

    public BusinessRulesTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _mockNotificationService = new Mock<INotificationService>();
        _mockBookingLogger = new Mock<ILogger<BookingService>>();
    }

    [Fact]
    public async Task Submission_CannotBeSubmittedAfterDeadline_IfLateNotAllowed()
    {
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru", Role = UserRole.Teacher };
        var cs = new ClassSubject { Id = Guid.NewGuid() };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs.Id,
            TeacherId = teacher.Id,
            DueDate = DateTime.UtcNow.AddDays(-1),
            AllowLateSubmission = false,
            MaxScore = 100
        };

        _context.Users.Add(teacher);
        _context.ClassSubjects.Add(cs);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var service = new SubmissionService(_context);

        var act = async () => await service.SubmitAssignmentAsync(Guid.NewGuid(), new CreateSubmissionRequest
        {
            AssignmentId = assignment.Id,
            SubmissionType = "FILE",
            FileUrl = "https://example.com/sub.pdf"
        });

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task BookingStatus_InvalidTransition_ThrowsException()
    {
        var bookingId = Guid.NewGuid();
        var user = new User { Id = Guid.NewGuid(), FullName = "Test User" };
        _context.Users.Add(user);
        var facility = new Facility { Id = Guid.NewGuid(), Name = "Gym" };
        _context.Facilities.Add(facility);
        var booking = new FacilityBooking { Id = bookingId, FacilityId = facility.Id, BookedByUserId = user.Id, Status = BookingStatus.Approved };
        _context.FacilityBookings.Add(booking);
        await _context.SaveChangesAsync();

        var service = new BookingService(_context, _mockNotificationService.Object, _mockBookingLogger.Object);

        var act = async () => await service.UpdateStatusAsync(bookingId, new UpdateBookingStatusRequest { Status = BookingStatus.Approved }, Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
