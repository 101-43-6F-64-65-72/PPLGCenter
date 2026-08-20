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

    [Fact]
    public async Task AnnouncementService_StudentCannotCreateUpdateOrDelete()
    {
        var studentId = Guid.NewGuid();
        var student = new User { Id = studentId, FullName = "Student User", Email = "student@test.com", Role = Domain.Enums.UserRole.Student };
        var adminId = Guid.NewGuid();
        var adminUser = new User { Id = adminId, FullName = "Admin User", Email = "admin@test.com", Role = Domain.Enums.UserRole.Admin };
        _context.Users.AddRange(student, adminUser);
        await _context.SaveChangesAsync();

        var createReq = new CreateAnnouncementRequest
        {
            Title = "Student Post Attempt",
            Content = "Content",
            Category = "General",
            IsPinned = false
        };

        // 1. Student create -> UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.CreateAnnouncementAsync(createReq, studentId, "Student"));

        // Seed an announcement
        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Admin Post",
            Content = "Admin Content",
            Category = "General",
            CreatedByUserId = adminId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Announcements.Add(announcement);
        await _context.SaveChangesAsync();

        var updateReq = new UpdateAnnouncementRequest
        {
            Title = "Hacked Title",
            Content = "Hacked Content",
            Category = "General",
            IsPinned = false
        };

        // 2. Student update -> UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.UpdateAnnouncementAsync(announcement.Id, updateReq, studentId, "Student"));

        // 3. Student delete -> UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.DeleteAnnouncementAsync(announcement.Id, studentId, "Student"));
    }

    [Fact]
    public async Task AnnouncementService_TeacherCanOnlyModifyOwnAnnouncement()
    {
        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1@test.com", Role = Domain.Enums.UserRole.Teacher };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2@test.com", Role = Domain.Enums.UserRole.Teacher };
        _context.Users.AddRange(teacher1, teacher2);

        var ann1 = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Guru 1 Post",
            Content = "Content 1",
            Category = "General",
            CreatedByUserId = teacher1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Announcements.Add(ann1);
        await _context.SaveChangesAsync();

        // Teacher 1 can update own announcement
        var updateReq = new UpdateAnnouncementRequest
        {
            Title = "Guru 1 Updated Title",
            Content = "Content 1 Updated",
            Category = "General",
            IsPinned = false
        };
        var updated = await _service.UpdateAnnouncementAsync(ann1.Id, updateReq, teacher1.Id, "Teacher");
        updated.Should().NotBeNull();
        updated!.Title.Should().Be("Guru 1 Updated Title");

        // Teacher 2 CANNOT update Teacher 1's announcement
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.UpdateAnnouncementAsync(ann1.Id, updateReq, teacher2.Id, "Teacher"));

        // Teacher 2 CANNOT delete Teacher 1's announcement
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.DeleteAnnouncementAsync(ann1.Id, teacher2.Id, "Teacher"));

        // Teacher 1 CAN delete own announcement
        var deleted = await _service.DeleteAnnouncementAsync(ann1.Id, teacher1.Id, "Teacher");
        deleted.Should().BeTrue();
    }

    [Fact]
    public async Task AnnouncementService_OnlyAdminCanPinAnnouncement()
    {
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Pin", Email = "gpin@test.com", Role = Domain.Enums.UserRole.Teacher };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Pin", Email = "apin@test.com", Role = Domain.Enums.UserRole.Admin };
        _context.Users.AddRange(teacher, admin);
        await _context.SaveChangesAsync();

        // 1. Teacher cannot pin on create
        var teacherPinReq = new CreateAnnouncementRequest
        {
            Title = "Teacher Pin Attempt",
            Content = "Content",
            Category = "General",
            IsPinned = true
        };
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            _service.CreateAnnouncementAsync(teacherPinReq, teacher.Id, "Teacher"));

        // 2. Admin CAN pin on create
        var adminPinReq = new CreateAnnouncementRequest
        {
            Title = "Admin Pinned Notice",
            Content = "Content",
            Category = "General",
            IsPinned = true
        };
        var adminCreated = await _service.CreateAnnouncementAsync(adminPinReq, admin.Id, "Admin");
        adminCreated.IsPinned.Should().BeTrue();

        // 3. Teacher creates an announcement without pinning
        var teacherUnpinnedReq = new CreateAnnouncementRequest
        {
            Title = "Teacher Normal Notice",
            Content = "Content",
            Category = "General",
            IsPinned = false
        };
        var teacherCreated = await _service.CreateAnnouncementAsync(teacherUnpinnedReq, teacher.Id, "Teacher");
        teacherCreated.IsPinned.Should().BeFalse();

        // 4. Teacher cannot update own announcement to set IsPinned = true
        var teacherUpdatePinReq = new UpdateAnnouncementRequest
        {
            Title = "Teacher Normal Notice",
            Content = "Content",
            Category = "General",
            IsPinned = true
        };
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            _service.UpdateAnnouncementAsync(teacherCreated.Id, teacherUpdatePinReq, teacher.Id, "Teacher"));
    }

    [Fact]
    public async Task AnnouncementService_LockedCommentsRejectNewComments()
    {
        var commentService = new AnnouncementCommentService(_context, _mockNotificationService.Object);
        var author = new User { Id = Guid.NewGuid(), FullName = "Author", Email = "author@test.com" };
        var commenter = new User { Id = Guid.NewGuid(), FullName = "Commenter", Email = "commenter@test.com" };
        _context.Users.AddRange(author, commenter);

        var openAnn = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Open Announcement",
            Content = "Content",
            Category = "General",
            IsCommentsLocked = false,
            CreatedByUserId = author.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var lockedAnn = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Locked Announcement",
            Content = "Content",
            Category = "General",
            IsCommentsLocked = true,
            CreatedByUserId = author.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Announcements.AddRange(openAnn, lockedAnn);
        await _context.SaveChangesAsync();

        // Unlocked accepts comment
        var openComment = await commentService.AddCommentAsync(openAnn.Id, new CommentRequest { Content = "Nice post!" }, commenter.Id);
        openComment.Should().NotBeNull();

        // Locked rejects comment
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            commentService.AddCommentAsync(lockedAnn.Id, new CommentRequest { Content = "Blocked post!" }, commenter.Id));
    }

    [Fact]
    public async Task AnnouncementService_EmptyTitleOrContent_ThrowsValidation()
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Email = "admin_val@test.com", Role = Domain.Enums.UserRole.Admin };
        _context.Users.Add(admin);
        await _context.SaveChangesAsync();

        // Empty title create
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            _service.CreateAnnouncementAsync(new CreateAnnouncementRequest { Title = "  ", Content = "Valid Content" }, admin.Id, "Admin"));

        // Empty content create
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            _service.CreateAnnouncementAsync(new CreateAnnouncementRequest { Title = "Valid Title", Content = "  " }, admin.Id, "Admin"));
    }

    [Fact]
    public async Task CommentDeletion_AuthorizationRules_Enforced()
    {
        var commentService = new AnnouncementCommentService(_context, _mockNotificationService.Object);
        var author = new User { Id = Guid.NewGuid(), FullName = "Author", Email = "aut@test.com", Role = Domain.Enums.UserRole.Teacher };
        var commenter = new User { Id = Guid.NewGuid(), FullName = "Commenter", Email = "com@test.com", Role = Domain.Enums.UserRole.Student };
        var intruder = new User { Id = Guid.NewGuid(), FullName = "Intruder", Email = "int@test.com", Role = Domain.Enums.UserRole.Student };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin", Email = "adm@test.com", Role = Domain.Enums.UserRole.Admin };
        _context.Users.AddRange(author, commenter, intruder, admin);

        var ann = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Ann",
            Content = "Cont",
            Category = "General",
            CreatedByUserId = author.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Announcements.Add(ann);
        await _context.SaveChangesAsync();

        var comment = await commentService.AddCommentAsync(ann.Id, new CommentRequest { Content = "Test Comment" }, commenter.Id);

        // Intruder cannot delete comment
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            commentService.DeleteCommentAsync(comment.Id, intruder.Id, "Student"));

        // Announcement owner CAN delete comment
        var ownerDelete = await commentService.DeleteCommentAsync(comment.Id, author.Id, "Teacher");
        ownerDelete.Should().BeTrue();
    }
}
