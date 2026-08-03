using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class AnnouncementServiceTests
{
    private readonly AppDbContext _context;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ILogger<AnnouncementService>> _mockLogger;
    private readonly AnnouncementService _service;

    public AnnouncementServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _mockNotificationService = new Mock<INotificationService>();
        _mockLogger = new Mock<ILogger<AnnouncementService>>();
        _service = new AnnouncementService(_context, _mockNotificationService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateAnnouncementAsync_ValidRequest_ReturnsAnnouncement()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateAnnouncementRequest
        {
            Title = "Test Announcement",
            Content = "Test Content",
            Category = "General",
            CoverImageUrl = "https://example.com/image.jpg",
            IsPinned = false
        };

        var result = await _service.CreateAnnouncementAsync(request, userId);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Content.Should().Be(request.Content);
        result.CreatedByUserId.Should().Be(userId);
        result.CreatedByUserName.Should().Be(user.FullName);
    }

    [Fact]
    public async Task CreateAnnouncementAsync_NoUsers_StillCreatesAnnouncement()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateAnnouncementRequest
        {
            Title = "Test Announcement",
            Content = "Test Content",
            Category = "General",
            CoverImageUrl = null,
            IsPinned = false
        };

        var result = await _service.CreateAnnouncementAsync(request, userId);

        result.Should().NotBeNull();
        result.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task GetAnnouncementByIdAsync_ExistingId_ReturnsAnnouncement()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Content = "Content",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        var result = await _service.GetAnnouncementByIdAsync(announcement.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be(announcement.Title);
    }

    [Fact]
    public async Task GetAnnouncementByIdAsync_NonExistingId_ReturnsNull()
    {
        var result = await _service.GetAnnouncementByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAnnouncementAsync_ValidUpdate_ReturnsUpdatedAnnouncement()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Original Title",
            Content = "Original Content",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        var request = new UpdateAnnouncementRequest
        {
            Title = "Updated Title",
            Content = "Updated Content",
            Category = "Updated",
            CoverImageUrl = "https://example.com/new.jpg",
            IsPinned = true
        };

        var result = await _service.UpdateAnnouncementAsync(announcement.Id, request);

        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
        result.Content.Should().Be(request.Content);
        result.IsPinned.Should().Be(true);
    }

    [Fact]
    public async Task UpdateAnnouncementAsync_NonExistingId_ReturnsNull()
    {
        var request = new UpdateAnnouncementRequest
        {
            Title = "Title",
            Content = "Content",
            Category = "General",
            CoverImageUrl = null,
            IsPinned = false
        };

        var result = await _service.UpdateAnnouncementAsync(Guid.NewGuid(), request);

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAnnouncementAsync_ExistingId_ReturnsTrue()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Content = "Content",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteAnnouncementAsync(announcement.Id);

        result.Should().BeTrue();
        var deleted = await _context.Announcements.FindAsync(announcement.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAnnouncementAsync_NonExistingId_ReturnsFalse()
    {
        var result = await _service.DeleteAnnouncementAsync(Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetAnnouncementsAsync_WithPagination_ReturnsPaginatedResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        _context.Users.Add(user);

        for (int i = 0; i < 15; i++)
        {
            _context.Announcements.Add(new Announcement
            {
                Id = Guid.NewGuid(),
                Title = $"Announcement {i}",
                Content = "Content",
                Category = "General",
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var result = await _service.GetAnnouncementsAsync(1, 10, null);

        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(15);
        result.Page.Should().Be(1);
    }

    [Fact]
    public async Task SearchAsync_WithKeyword_ReturnsMatchingResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };
        _context.Users.Add(user);
        _context.Announcements.Add(new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Important Notice",
            Content = "Please read this",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.Announcements.Add(new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Random Post",
            Content = "Some other content",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync(1, 10, "Important");

        result.Items.Should().HaveCount(1);
        result.Items.First().Title.Should().Contain("Important");
    }
}
