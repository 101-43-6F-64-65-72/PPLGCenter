using FluentAssertions;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class SearchServiceTests
{
    private readonly AppDbContext _context;
    private readonly SearchService _service;

    public SearchServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new SearchService(_context);
    }

    [Fact]
    public async Task SearchAsync_SearchInAnnouncements_ReturnsMatchingAnnouncements()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Admin", Email = "admin@test.com" };
        _context.Users.Add(user);
        _context.Announcements.AddRange(
            new Announcement { Id = Guid.NewGuid(), Title = "Important Notice", Content = "Please read", Category = "General", CreatedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Announcement { Id = Guid.NewGuid(), Title = "Random Post", Content = "Some content", Category = "General", CreatedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Important", 1, 10);

        result.Announcements.Should().HaveCount(1);
        result.Announcements.First().Title.Should().Contain("Important");
    }

    [Fact]
    public async Task SearchAsync_SearchInMaterials_ReturnsMatchingMaterials()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        _context.Materials.AddRange(
            new Material { Id = Guid.NewGuid(), Title = "Calculus Notes", Description = "Chapter 1-5", Subject = "Mathematics", Grade = "12", FileUrl = "https://example.com/file.pdf", UploadedByUserId = userId, UploadedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Material { Id = Guid.NewGuid(), Title = "Physics Lab", Description = "Experiments", Subject = "Physics", Grade = "11", FileUrl = "https://example.com/file.pdf", UploadedByUserId = userId, UploadedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Calculus", 1, 10);

        result.Materials.Should().HaveCount(1);
        result.Materials.First().Title.Should().Contain("Calculus");
    }

    [Fact]
    public async Task SearchAsync_SearchInAssignments_ReturnsMatchingAssignments()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Teacher", Email = "teacher@test.com" };
        _context.Users.Add(user);
        _context.Assignments.AddRange(
            new Assignment { Id = Guid.NewGuid(), Title = "Algebra Problem Set", Description = "Equations and inequalities", Subject = "Mathematics", Grade = "9", DueDate = DateTime.UtcNow.AddDays(7), MaxScore = 100, CreatedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Assignment { Id = Guid.NewGuid(), Title = "Essay Writing", Description = "3000 words", Subject = "English", Grade = "10", DueDate = DateTime.UtcNow.AddDays(14), MaxScore = 100, CreatedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Algebra", 1, 10);

        result.Assignments.Should().HaveCount(1);
        result.Assignments.First().Title.Should().Contain("Algebra");
    }

    [Fact]
    public async Task SearchAsync_SearchInCalendarEvents_ReturnsMatchingEvents()
    {
        var calendarId = Guid.NewGuid();
        _context.CalendarEvents.AddRange(
            new CalendarEvent { Id = Guid.NewGuid(), Title = "Annual Sports Day", Description = "Field day", Category = "Sports", StartDate = DateTime.UtcNow.AddDays(30), EndDate = DateTime.UtcNow.AddDays(30), CreatedAt = DateTime.UtcNow },
            new CalendarEvent { Id = Guid.NewGuid(), Title = "Parent Meeting", Description = "Q&A", Category = "Meeting", StartDate = DateTime.UtcNow.AddDays(15), EndDate = DateTime.UtcNow.AddDays(15), CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Sports", 1, 10);

        result.CalendarEvents.Should().HaveCount(1);
        result.CalendarEvents.First().Title.Should().Contain("Sports");
    }

    [Fact]
    public async Task SearchAsync_SearchInFacilities_ReturnsMatchingFacilities()
    {
        _context.Facilities.AddRange(
            new Facility { Id = Guid.NewGuid(), Name = "Basketball Court", Description = "Indoor court", Capacity = 100, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Facility { Id = Guid.NewGuid(), Name = "Library", Description = "Central library", Capacity = 200, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Facility { Id = Guid.NewGuid(), Name = "Closed Gym", Description = "Under renovation", Capacity = 150, IsActive = false, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Court", 1, 10);

        result.Facilities.Should().HaveCount(1);
        result.Facilities.First().Title.Should().Be("Basketball Court");
    }

    [Fact]
    public async Task SearchAsync_SearchInFacilities_OnlyReturnsActiveFacilities()
    {
        _context.Facilities.AddRange(
            new Facility { Id = Guid.NewGuid(), Name = "Active Court", Description = "Indoor court", Capacity = 100, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Facility { Id = Guid.NewGuid(), Name = "Active Gym", Description = "Indoor gym", Capacity = 200, IsActive = true, CreatedAt = DateTime.UtcNow },
            new Facility { Id = Guid.NewGuid(), Name = "Inactive Gym", Description = "Closed gym", Capacity = 150, IsActive = false, CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Gym", 1, 10);

        result.Facilities.Should().HaveCount(1);
        result.Facilities.First().Title.Should().Be("Active Gym");
    }

    [Fact]
    public async Task SearchAsync_SearchInExtracurriculars_ReturnsMatchingExtracurriculars()
    {
        _context.Extracurriculars.AddRange(
            new Extracurricular { Id = Guid.NewGuid(), Name = "Debate Club", Description = "Public speaking", IsActive = true, Category = "Academic", MaxMembers = 30, ManagedByUserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow },
            new Extracurricular { Id = Guid.NewGuid(), Name = "Chess Club", Description = "Strategic games", IsActive = true, Category = "Games", MaxMembers = 20, ManagedByUserId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Debate", 1, 10);

        result.Extracurriculars.Should().HaveCount(1);
        result.Extracurriculars.First().Title.Should().Contain("Debate");
    }

    [Fact]
    public async Task SearchAsync_SearchInProposals_ReturnsMatchingProposals()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "OSIS", Email = "osis@test.com" };
        _context.Users.Add(user);
        _context.Proposals.AddRange(
            new Proposal { Id = Guid.NewGuid(), Title = "Concert Event", Description = "Music concert", FileUrl = "https://example.com/file.pdf", Status = ProposalStatus.Pending, SubmittedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Proposal { Id = Guid.NewGuid(), Title = "Study Tour", Description = "Educational trip", FileUrl = "https://example.com/file.pdf", Status = ProposalStatus.Pending, SubmittedByUserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Concert", 1, 10);

        result.Proposals.Should().HaveCount(1);
        result.Proposals.First().Title.Should().Contain("Concert");
    }

    [Fact]
    public async Task SearchAsync_CaseInsensitiveSearch_ReturnsResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Admin", Email = "admin@test.com" };
        _context.Users.Add(user);
        _context.Announcements.Add(new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "IMPORTANT NOTICE",
            Content = "Please read",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("important", 1, 10);

        result.Announcements.Should().HaveCount(1);
    }

    [Fact]
    public async Task SearchAsync_NoMatches_ReturnsEmptyResults()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Admin", Email = "admin@test.com" };
        _context.Users.Add(user);
        _context.Announcements.Add(new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Test",
            Content = "Content",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("NonExistentKeyword", 1, 10);

        result.Announcements.Should().BeEmpty();
        result.Materials.Should().BeEmpty();
        result.Assignments.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchAsync_WithPagination_RespectsPageSize()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Admin", Email = "admin@test.com" };
        _context.Users.Add(user);

        for (int i = 0; i < 15; i++)
        {
            _context.Announcements.Add(new Announcement
            {
                Id = Guid.NewGuid(),
                Title = $"Test Announcement {i}",
                Content = "Content",
                Category = "General",
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Test", 1, 5);

        result.Announcements.Should().HaveCount(5);
    }

    [Fact]
    public async Task SearchAsync_SearchesMultipleCategoriesSimultaneously()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Admin", Email = "admin@test.com" };
        _context.Users.Add(user);

        _context.Announcements.Add(new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Meeting",
            Content = "Announcement",
            Category = "General",
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        _context.Assignments.Add(new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Meeting Notes",
            Description = "Assignment",
            Subject = "English",
            Grade = "10",
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        _context.CalendarEvents.Add(new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Title = "Team Meeting",
            Description = "Event",
            Category = "Meeting",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var result = await _service.SearchAsync("Meeting", 1, 10);

        result.Announcements.Should().HaveCount(1);
        result.Assignments.Should().HaveCount(1);
        result.CalendarEvents.Should().HaveCount(1);
    }
}
