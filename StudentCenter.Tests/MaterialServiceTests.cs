using FluentAssertions;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class MaterialServiceTests
{
    private readonly AppDbContext _context;
    private readonly MaterialService _service;

    public MaterialServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new MaterialService(_context);
    }

    [Fact]
    public async Task CreateMaterialAsync_ValidRequest_ReturnsMaterial()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateMaterialRequest
        {
            Title = "Calculus Textbook",
            Description = "Chapter 1-10",
            FileUrl = "https://example.com/calculus.pdf",
            Subject = "Mathematics",
            Grade = "12"
        };

        var result = await _service.CreateMaterialAsync(request, userId);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Subject.Should().Be(request.Subject);
        result.Grade.Should().Be(request.Grade);
        result.UploadedByUserId.Should().Be(userId);
    }

    [Fact]
    public async Task CreateMaterialAsync_UploadedByUserName_IsCorrect()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Dr. Smith", Email = "smith@test.com" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateMaterialRequest
        {
            Title = "Physics Lab Guide",
            Description = "Experiments",
            FileUrl = "https://example.com/physics.pdf",
            Subject = "Physics",
            Grade = "11"
        };

        var result = await _service.CreateMaterialAsync(request, userId);

        result.UploadedByUserName.Should().Be("Dr. Smith");
    }

    [Fact]
    public async Task GetMaterialByIdAsync_ExistingId_ReturnsMaterial()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = "Biology Notes",
            Description = "Chapter 5",
            FileUrl = "https://example.com/biology.pdf",
            Subject = "Biology",
            Grade = "10",
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var result = await _service.GetMaterialByIdAsync(material.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be(material.Title);
        result.Subject.Should().Be(material.Subject);
    }

    [Fact]
    public async Task GetMaterialByIdAsync_NonExistingId_ReturnsNull()
    {
        var result = await _service.GetMaterialByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateMaterialAsync_TeacherOwner_SucceedsWithTeacherRole()
    {
        var teacherId = Guid.NewGuid();
        var teacher = new User { Id = teacherId, FullName = "Teacher", Email = "teacher@test.com" };
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = "Original Title",
            Description = "Original Desc",
            FileUrl = "https://example.com/original.pdf",
            Subject = "Mathematics",
            Grade = "9",
            UploadedByUserId = teacherId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(teacher);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var request = new UpdateMaterialRequest
        {
            Title = "Updated Title",
            Description = "Updated Desc",
            FileUrl = "https://example.com/updated.pdf",
            Subject = "Physics",
            Grade = "10"
        };

        var result = await _service.UpdateMaterialAsync(material.Id, request, teacherId, "Teacher");

        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
        result.Description.Should().Be(request.Description);
        result.Subject.Should().Be(request.Subject);
    }

    [Fact]
    public async Task UpdateMaterialAsync_TeacherNotOwner_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "Owner", Email = "owner@test.com" };
        var user2 = new User { Id = other, FullName = "Other", Email = "other@test.com" };
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = "Test Material",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Subject = "Math",
            Grade = "9",
            UploadedByUserId = owner,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var request = new UpdateMaterialRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            FileUrl = "https://example.com/new.pdf",
            Subject = "Physics",
            Grade = "10"
        };

        var act = async () => await _service.UpdateMaterialAsync(material.Id, request, other, "Teacher");

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("You can only update your own materials.");
    }

    [Fact]
    public async Task UpdateMaterialAsync_AdminCanUpdateOthersMaterials()
    {
        var owner = Guid.NewGuid();
        var admin = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "Owner", Email = "owner@test.com" };
        var user2 = new User { Id = admin, FullName = "Admin", Email = "admin@test.com" };
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = "Test Material",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Subject = "Math",
            Grade = "9",
            UploadedByUserId = owner,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var request = new UpdateMaterialRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            FileUrl = "https://example.com/new.pdf",
            Subject = "Physics",
            Grade = "10"
        };

        var result = await _service.UpdateMaterialAsync(material.Id, request, admin, "Admin");

        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
    }

    [Fact]
    public async Task DeleteMaterialAsync_TeacherOwner_SucceedsWithTeacherRole()
    {
        var teacherId = Guid.NewGuid();
        var teacher = new User { Id = teacherId, FullName = "Teacher", Email = "teacher@test.com" };
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = "Test Material",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Subject = "Math",
            Grade = "9",
            UploadedByUserId = teacherId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(teacher);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteMaterialAsync(material.Id, teacherId, "Teacher");

        result.Should().BeTrue();
        var deleted = await _context.Materials.FindAsync(material.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteMaterialAsync_TeacherNotOwner_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "Owner", Email = "owner@test.com" };
        var user2 = new User { Id = other, FullName = "Other", Email = "other@test.com" };
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = "Test Material",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Subject = "Math",
            Grade = "9",
            UploadedByUserId = owner,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        var act = async () => await _service.DeleteMaterialAsync(material.Id, other, "Teacher");

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("You can only delete your own materials.");
    }

    [Fact]
    public async Task GetMaterialsAsync_WithSubjectFilter_ReturnsFilteredResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        _context.Materials.Add(new Material
        {
            Id = Guid.NewGuid(),
            Title = "Math Notes",
            Description = "Desc",
            FileUrl = "https://example.com/math.pdf",
            Subject = "Mathematics",
            Grade = "9",
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.Materials.Add(new Material
        {
            Id = Guid.NewGuid(),
            Title = "Physics Notes",
            Description = "Desc",
            FileUrl = "https://example.com/physics.pdf",
            Subject = "Physics",
            Grade = "10",
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.GetMaterialsAsync(1, 10, "Mathematics", null);

        result.Items.Should().HaveCount(1);
        result.Items.First().Subject.Should().Be("Mathematics");
    }

    [Fact]
    public async Task GetMaterialsAsync_WithGradeFilter_ReturnsFilteredResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        _context.Materials.Add(new Material
        {
            Id = Guid.NewGuid(),
            Title = "Grade 9 Math",
            Description = "Desc",
            FileUrl = "https://example.com/g9.pdf",
            Subject = "Mathematics",
            Grade = "9",
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.Materials.Add(new Material
        {
            Id = Guid.NewGuid(),
            Title = "Grade 10 Math",
            Description = "Desc",
            FileUrl = "https://example.com/g10.pdf",
            Subject = "Mathematics",
            Grade = "10",
            UploadedByUserId = userId,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.GetMaterialsAsync(1, 10, null, "9");

        result.Items.Should().HaveCount(1);
        result.Items.First().Grade.Should().Be("9");
    }

    [Fact]
    public async Task GetMaterialsAsync_WithPagination_ReturnsPaginatedResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);

        for (int i = 0; i < 15; i++)
        {
            _context.Materials.Add(new Material
            {
                Id = Guid.NewGuid(),
                Title = $"Material {i}",
                Description = "Desc",
                FileUrl = "https://example.com/file.pdf",
                Subject = "Mathematics",
                Grade = "9",
                UploadedByUserId = userId,
                UploadedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var result = await _service.GetMaterialsAsync(1, 10, null, null);

        result.Items.Should().HaveCount(10);
        result.TotalCount.Should().Be(15);
        result.Page.Should().Be(1);
    }

    [Fact]
    public async Task GetMaterialsAsync_SortedByUploadedAtDescending()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        var now = DateTime.UtcNow;

        _context.Materials.Add(new Material
        {
            Id = Guid.NewGuid(),
            Title = "Old Material",
            Description = "Desc",
            FileUrl = "https://example.com/old.pdf",
            Subject = "Math",
            Grade = "9",
            UploadedByUserId = userId,
            UploadedAt = now.AddDays(-5),
            UpdatedAt = now.AddDays(-5)
        });

        _context.Materials.Add(new Material
        {
            Id = Guid.NewGuid(),
            Title = "New Material",
            Description = "Desc",
            FileUrl = "https://example.com/new.pdf",
            Subject = "Math",
            Grade = "9",
            UploadedByUserId = userId,
            UploadedAt = now,
            UpdatedAt = now
        });

        await _context.SaveChangesAsync();

        var result = await _service.GetMaterialsAsync(1, 10, null, null);

        result.Items[0].Title.Should().Be("New Material");
        result.Items[1].Title.Should().Be("Old Material");
    }

    [Fact]
    public async Task DeleteMaterialAsync_NonExistingId_ReturnsFalse()
    {
        var result = await _service.DeleteMaterialAsync(Guid.NewGuid(), Guid.NewGuid(), "Teacher");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateMaterialAsync_NonExistingId_ReturnsNull()
    {
        var request = new UpdateMaterialRequest
        {
            Title = "Title",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Subject = "Math",
            Grade = "9"
        };

        var result = await _service.UpdateMaterialAsync(Guid.NewGuid(), request, Guid.NewGuid(), "Teacher");

        result.Should().BeNull();
    }
}
