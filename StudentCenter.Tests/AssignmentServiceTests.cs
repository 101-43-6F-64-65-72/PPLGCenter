using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class AssignmentServiceTests
{
    private readonly AppDbContext _context;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ILogger<AssignmentService>> _mockLogger;
    private readonly AssignmentService _service;

    public AssignmentServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _mockNotificationService = new Mock<INotificationService>();
        _mockLogger = new Mock<ILogger<AssignmentService>>();
        _service = new AssignmentService(_context, _mockNotificationService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateAssignmentAsync_ValidRequest_ReturnsAssignment()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com", Role = UserRole.Teacher };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateAssignmentRequest
        {
            Title = "Math Homework",
            Description = "Chapter 5 exercises",
            Subject = "Mathematics",
            Grade = "10",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100
        };

        var result = await _service.CreateAssignmentAsync(request, userId);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Subject.Should().Be(request.Subject);
        result.CreatedByUserId.Should().Be(userId);
    }

    [Fact]
    public async Task CreateAssignmentAsync_NotifiesStudents()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com", Role = UserRole.Teacher };
        var student = new User { Id = Guid.NewGuid(), FullName = "Student", Email = "student@test.com", Role = UserRole.Student };
        _context.Users.AddRange(user, student);
        await _context.SaveChangesAsync();

        var request = new CreateAssignmentRequest
        {
            Title = "Physics Assignment",
            Description = "Newton's Laws",
            Subject = "Physics",
            Grade = "11",
            DueDate = DateTime.UtcNow.AddDays(5),
            MaxScore = 50
        };

        await _service.CreateAssignmentAsync(request, userId);

        _mockNotificationService.Verify(
            x => x.NotifyUsersAsync(
                It.IsAny<IEnumerable<Guid>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                NotificationType.Assignment,
                It.IsAny<string>(),
                "Assignment"),
            Times.Once);
    }

    [Fact]
    public async Task GetAssignmentByIdAsync_ExistingId_ReturnsAssignment()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Test Assignment",
            Description = "Description",
            Subject = "Math",
            Grade = "9",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var result = await _service.GetAssignmentByIdAsync(assignment.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be(assignment.Title);
    }

    [Fact]
    public async Task GetAssignmentByIdAsync_NonExistingId_ReturnsNull()
    {
        var result = await _service.GetAssignmentByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAssignmentAsync_TeacherOwner_SucceedsWithTeacherRole()
    {
        var teacherId = Guid.NewGuid();
        var teacher = new User { Id = teacherId, FullName = "Teacher", Email = "teacher@test.com", Role = UserRole.Teacher };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Original",
            Description = "Desc",
            Subject = "Math",
            Grade = "9",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = teacherId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(teacher);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var request = new UpdateAssignmentRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            Subject = "Physics",
            Grade = "10",
            DueDate = DateTime.UtcNow.AddDays(10),
            MaxScore = 150
        };

        var result = await _service.UpdateAssignmentAsync(assignment.Id, request, teacherId, "Teacher");

        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
    }

    [Fact]
    public async Task UpdateAssignmentAsync_TeacherNotOwner_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "Owner", Email = "owner@test.com" };
        var user2 = new User { Id = other, FullName = "Other", Email = "other@test.com" };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Description = "Desc",
            Subject = "Math",
            Grade = "9",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var request = new UpdateAssignmentRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            Subject = "Physics",
            Grade = "10",
            DueDate = DateTime.UtcNow.AddDays(10),
            MaxScore = 150
        };

        var act = async () => await _service.UpdateAssignmentAsync(assignment.Id, request, other, "Teacher");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task UpdateAssignmentAsync_AdminCanUpdateOthersAssignments()
    {
        var owner = Guid.NewGuid();
        var admin = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "Owner", Email = "owner@test.com" };
        var user2 = new User { Id = admin, FullName = "Admin", Email = "admin@test.com" };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Description = "Desc",
            Subject = "Math",
            Grade = "9",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var request = new UpdateAssignmentRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            Subject = "Physics",
            Grade = "10",
            DueDate = DateTime.UtcNow.AddDays(10),
            MaxScore = 150
        };

        var result = await _service.UpdateAssignmentAsync(assignment.Id, request, admin, "Admin");

        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
    }

    [Fact]
    public async Task DeleteAssignmentAsync_TeacherOwner_SucceedsWithTeacherRole()
    {
        var teacherId = Guid.NewGuid();
        var teacher = new User { Id = teacherId, FullName = "Teacher", Email = "teacher@test.com" };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Description = "Desc",
            Subject = "Math",
            Grade = "9",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = teacherId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(teacher);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAssignmentAsync(assignment.Id, teacherId, "Teacher");

        result.Should().BeTrue();
        var deleted = await _context.Assignments.FindAsync(assignment.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAssignmentAsync_TeacherNotOwner_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "Owner", Email = "owner@test.com" };
        var user2 = new User { Id = other, FullName = "Other", Email = "other@test.com" };
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Description = "Desc",
            Subject = "Math",
            Grade = "9",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        var act = async () => await _service.DeleteAssignmentAsync(assignment.Id, other, "Teacher");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetAssignmentsAsync_WithFilters_ReturnsFilteredResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        _context.Assignments.Add(new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Math 1",
            Description = "Desc",
            Subject = "Mathematics",
            Grade = "9",
            DueDate = DateTime.UtcNow,
            MaxScore = 100,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.Assignments.Add(new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Physics 1",
            Description = "Desc",
            Subject = "Physics",
            Grade = "10",
            DueDate = DateTime.UtcNow,
            MaxScore = 100,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.GetAssignmentsAsync(1, 10, "Mathematics", null);

        result.Items.Should().HaveCount(1);
        result.Items.First().Subject.Should().Be("Mathematics");
    }
}
