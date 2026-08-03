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

    [Fact]
    public async Task CreateAsync_ValidRequest_CreatesNotification()
    {
        var userId = Guid.NewGuid();
        var request = new CreateNotificationRequest
        {
            UserId = userId,
            Title = "Test Notification",
            Message = "This is a test",
            Type = NotificationType.Announcement,
            ReferenceId = Guid.NewGuid().ToString(),
            ReferenceType = "Announcement"
        };

        await _service.CreateAsync(request);

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == userId);
        notification.Should().NotBeNull();
        notification!.Title.Should().Be(request.Title);
        notification.IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task NotifyUserAsync_ValidUser_CreatesNotification()
    {
        var userId = Guid.NewGuid();

        await _service.NotifyUserAsync(
            userId,
            "Test Title",
            "Test Message",
            NotificationType.Assignment,
            "ref-123",
            "Assignment"
        );

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.UserId == userId);
        notification.Should().NotBeNull();
        notification!.Title.Should().Be("Test Title");
        notification.Message.Should().Be("Test Message");
    }

    [Fact]
    public async Task NotifyUsersAsync_MultipleUsers_CreatesNotificationsForAll()
    {
        var userIds = new[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

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
    public async Task NotifyUsersAsync_EmptyUserList_DoesNotCreateNotifications()
    {
        var initialCount = await _context.Notifications.CountAsync();

        await _service.NotifyUsersAsync(
            new List<Guid>(),
            "Title",
            "Message",
            NotificationType.Assignment
        );

        var finalCount = await _context.Notifications.CountAsync();
        finalCount.Should().Be(initialCount);
    }

    [Fact]
    public async Task GetMyNotificationsAsync_ValidUser_ReturnsUserNotifications()
    {
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        _context.Notifications.AddRange(
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Mine 1", Message = "msg", IsRead = false, CreatedAt = DateTime.UtcNow, Type = NotificationType.Announcement },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Mine 2", Message = "msg", IsRead = true, CreatedAt = DateTime.UtcNow, Type = NotificationType.Assignment },
            new Notification { Id = Guid.NewGuid(), UserId = otherUserId, Title = "Others", Message = "msg", IsRead = false, CreatedAt = DateTime.UtcNow, Type = NotificationType.Proposal }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetMyNotificationsAsync(userId, 1, 10);

        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
        result.Items.All(n => n.UserId == userId).Should().BeTrue();
    }

    [Fact]
    public async Task GetMyNotificationsAsync_WithPagination_ReturnsPaginatedResults()
    {
        var userId = Guid.NewGuid();

        for (int i = 0; i < 25; i++)
        {
            _context.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = $"Notification {i}",
                Message = "msg",
                IsRead = false,
                CreatedAt = DateTime.UtcNow.AddHours(-i),
                Type = NotificationType.Announcement
            });
        }
        await _context.SaveChangesAsync();

        var result = await _service.GetMyNotificationsAsync(userId, 1, 10);

        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(25);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ValidUser_ReturnsCorrectCount()
    {
        var userId = Guid.NewGuid();

        _context.Notifications.AddRange(
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Unread 1", Message = "msg", IsRead = false, CreatedAt = DateTime.UtcNow, Type = NotificationType.Announcement },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Read", Message = "msg", IsRead = true, CreatedAt = DateTime.UtcNow, Type = NotificationType.Assignment },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Unread 2", Message = "msg", IsRead = false, CreatedAt = DateTime.UtcNow, Type = NotificationType.Proposal }
        );
        await _context.SaveChangesAsync();

        var count = await _service.GetUnreadCountAsync(userId);

        count.Should().Be(2);
    }

    [Fact]
    public async Task MarkAsReadAsync_OwnerMarkingTheirNotification_Succeeds()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = userId,
            Title = "Test",
            Message = "msg",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Type = NotificationType.Announcement
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var result = await _service.MarkAsReadAsync(notificationId, userId);

        result.Should().BeTrue();
        var updated = await _context.Notifications.FindAsync(notificationId);
        updated!.IsRead.Should().BeTrue();
    }

    [Fact]
    public async Task MarkAsReadAsync_NonOwnerMarkingOthersNotification_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = owner,
            Title = "Test",
            Message = "msg",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            Type = NotificationType.Announcement
        };
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        var act = async () => await _service.MarkAsReadAsync(notificationId, other);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("You do not own this notification.");
    }

    [Fact]
    public async Task MarkAsReadAsync_NonExistingNotification_ReturnsFalse()
    {
        var result = await _service.MarkAsReadAsync(Guid.NewGuid(), Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task MarkAllAsReadAsync_UserWithMultipleUnreadNotifications_MarksAllAsRead()
    {
        var userId = Guid.NewGuid();

        _context.Notifications.AddRange(
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "1", Message = "msg", IsRead = false, CreatedAt = DateTime.UtcNow, Type = NotificationType.Announcement },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "2", Message = "msg", IsRead = false, CreatedAt = DateTime.UtcNow, Type = NotificationType.Assignment },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "3", Message = "msg", IsRead = true, CreatedAt = DateTime.UtcNow, Type = NotificationType.Proposal }
        );
        await _context.SaveChangesAsync();

        await _service.MarkAllAsReadAsync(userId);

        var allNotifications = await _context.Notifications.Where(n => n.UserId == userId).ToListAsync();
        allNotifications.All(n => n.IsRead).Should().BeTrue();
    }

    [Fact]
    public async Task GetMyNotificationsAsync_SortedByCreatedAtDescending()
    {
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        _context.Notifications.AddRange(
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Old", Message = "msg", IsRead = false, CreatedAt = now.AddHours(-2), Type = NotificationType.Announcement },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "New", Message = "msg", IsRead = false, CreatedAt = now, Type = NotificationType.Assignment },
            new Notification { Id = Guid.NewGuid(), UserId = userId, Title = "Middle", Message = "msg", IsRead = false, CreatedAt = now.AddHours(-1), Type = NotificationType.Proposal }
        );
        await _context.SaveChangesAsync();

        var result = await _service.GetMyNotificationsAsync(userId, 1, 10);

        result.Items[0].Title.Should().Be("New");
        result.Items[1].Title.Should().Be("Middle");
        result.Items[2].Title.Should().Be("Old");
    }
}
