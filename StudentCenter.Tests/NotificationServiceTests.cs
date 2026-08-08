using FluentAssertions;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class NotificationServiceTests
{
    private readonly AppDbContext _context;
    private readonly NotificationService _service;

    public NotificationServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new NotificationService(_context);
    }

    private async Task<User> CreateActiveUserAsync(Guid? id = null, UserRole role = UserRole.Student)
    {
        var userId = id ?? Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = $"user_{userId.ToString().Substring(0, 8)}",
            PasswordHash = "hash",
            FullName = "Test User",
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesNotification()
    {
        var user = await CreateActiveUserAsync();
        var request = new CreateNotificationRequest
        {
            UserId = user.Id,
            Title = "Test Notification",
            Message = "This is a test",
            Type = NotificationType.Announcement,
            ReferenceId = Guid.NewGuid().ToString(),
            ReferenceType = NotificationReferenceType.Announcement
        };

        await _service.CreateAsync(request);

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == user.Id);
        notification.Should().NotBeNull();
        notification!.Title.Should().Be(request.Title);
        notification.IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task NotifyUserAsync_ValidUser_CreatesNotification()
    {
        var user = await CreateActiveUserAsync();

        await _service.NotifyUserAsync(
            user.Id,
            "Test Title",
            "Test Message",
            NotificationType.Assignment,
            "ref-123",
            "Assignment"
        );

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == user.Id);
        notification.Should().NotBeNull();
        notification!.Title.Should().Be("Test Title");
        notification.Body.Should().Be("Test Message");
    }

    [Fact]
    public async Task Cooldown_DuplicateNotificationWithin30s_IgnoresDuplicate()
    {
        var user = await CreateActiveUserAsync();

        await _service.NotifyUserAsync(
            user.Id,
            "Title",
            "Duplicate Content",
            NotificationType.Announcement,
            "ref-1",
            "Announcement"
        );

        await _service.NotifyUserAsync(
            user.Id,
            "Title",
            "Duplicate Content",
            NotificationType.Announcement,
            "ref-1",
            "Announcement"
        );

        var notifications = await _context.Notifications.Where(n => n.UserId == user.Id).ToListAsync();
        notifications.Should().HaveCount(1);
    }

    [Fact]
    public async Task NotifyUsersAsync_MultipleUsers_CreatesNotificationsForAll()
    {
        var user1 = await CreateActiveUserAsync();
        var user2 = await CreateActiveUserAsync();
        var user3 = await CreateActiveUserAsync();
        var userIds = new[] { user1.Id, user2.Id, user3.Id };

        await _service.NotifyUsersAsync(
            userIds,
            "Bulk Notification",
            "This goes to multiple users",
            NotificationType.Announcement,
            "ref-456",
            "Announcement"
        );

        var notifications = await _context.Notifications.Where(n => userIds.Contains(n.UserId)).ToListAsync();
        notifications.Should().HaveCount(3);
        notifications.All(n => n.Title == "Bulk Notification").Should().BeTrue();
    }

    [Fact]
    public async Task BroadcastAsync_ValidRole_SendsToMatchingActiveUsers()
    {
        var student1 = await CreateActiveUserAsync(role: UserRole.Student);
        var student2 = await CreateActiveUserAsync(role: UserRole.Student);
        var teacher = await CreateActiveUserAsync(role: UserRole.Teacher);

        await _service.BroadcastAsync(
            "Broadcast Title",
            "Broadcast Message",
            NotificationType.Announcement,
            "Student"
        );

        var studentNotifications = await _context.Notifications.Where(n => n.UserId == student1.Id || n.UserId == student2.Id).ToListAsync();
        studentNotifications.Should().HaveCount(2);

        var teacherNotifications = await _context.Notifications.Where(n => n.UserId == teacher.Id).ToListAsync();
        teacherNotifications.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_OwnerDeleting_SoftDeletesNotification()
    {
        var user = await CreateActiveUserAsync();
        var notificationId = Guid.NewGuid();

        _context.Notifications.Add(new Notification
        {
            Id = notificationId,
            UserId = user.Id,
            Title = "To Delete",
            Body = "Body",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var deleted = await _service.DeleteAsync(notificationId, user.Id);
        deleted.Should().BeTrue();

        var unreadCount = await _service.GetUnreadCountAsync(user.Id);
        unreadCount.Should().Be(0);
    }
}
