using FluentAssertions;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class MembershipServiceTests
{
    private readonly AppDbContext _context;
    private readonly MembershipService _service;

    private static Guid _adminUserId = Guid.NewGuid();

    public MembershipServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new MembershipService(_context);
    }

    private async Task<(User student, User teacher, Extracurricular extra)> SeedBaseDataAsync()
    {
        var admin = new User
        {
            Id = _adminUserId,
            Email = "admin@test.com",
            FullName = "Admin",
            PasswordHash = string.Empty,
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var student = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@test.com",
            FullName = "Ahmad Rizky",
            NIS = "54321",
            NISN = "0051234567",
            PasswordHash = string.Empty,
            Role = UserRole.Student,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var teacher = new User
        {
            Id = Guid.NewGuid(),
            Email = "teacher@test.com",
            FullName = "Pak Budi",
            NIP = "198501012010011001",
            PasswordHash = string.Empty,
            Role = UserRole.Teacher,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var extra = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "OSIS",
            Category = "General",
            IsActive = true,
            ManagedByUserId = admin.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.AddRange(admin, student, teacher);
        _context.Extracurriculars.Add(extra);
        await _context.SaveChangesAsync();

        return (student, teacher, extra);
    }

    // ─────────────────────────────────────────────────────────
    // IsMemberOfExtracurricularAsync
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task IsMember_ReturnsFalse_WhenNotMember()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        var result = await _service.IsMemberOfExtracurricularAsync(student.Id, extra.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsMember_ReturnsTrue_WhenActiveMember()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        _context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ExtracurricularId = extra.Id,
            Position = ExtracurricularMemberPosition.Member,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.IsMemberOfExtracurricularAsync(student.Id, extra.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsMember_ReturnsFalse_WhenInactiveMember()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        _context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ExtracurricularId = extra.Id,
            Position = ExtracurricularMemberPosition.Member,
            Status = "Inactive",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.IsMemberOfExtracurricularAsync(student.Id, extra.Id);

        result.Should().BeFalse();
    }

    // ─────────────────────────────────────────────────────────
    // IsAdvisorOfExtracurricularAsync
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task IsAdvisor_ReturnsFalse_WhenNotAdvisor()
    {
        var (_, teacher, extra) = await SeedBaseDataAsync();

        var result = await _service.IsAdvisorOfExtracurricularAsync(teacher.Id, extra.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsAdvisor_ReturnsTrue_WhenAssignedAsAdvisor()
    {
        var (_, teacher, extra) = await SeedBaseDataAsync();

        _context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher.Id,
            ExtracurricularId = extra.Id,
            AssignedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.IsAdvisorOfExtracurricularAsync(teacher.Id, extra.Id);

        result.Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────
    // IsLeaderOfExtracurricularAsync
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task IsLeader_ReturnsFalse_WhenMemberIsNotLeader()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        _context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ExtracurricularId = extra.Id,
            Position = ExtracurricularMemberPosition.Member,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.IsLeaderOfExtracurricularAsync(student.Id, extra.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsLeader_ReturnsTrue_WhenLeader()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        _context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ExtracurricularId = extra.Id,
            Position = ExtracurricularMemberPosition.Leader,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.IsLeaderOfExtracurricularAsync(student.Id, extra.Id);

        result.Should().BeTrue();
    }

    // ─────────────────────────────────────────────────────────
    // GetPositionInExtracurricularAsync
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task GetPosition_ReturnsNull_WhenNotMember()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        var result = await _service.GetPositionInExtracurricularAsync(student.Id, extra.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetPosition_ReturnsCorrectPosition()
    {
        var (student, _, extra) = await SeedBaseDataAsync();

        _context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            ExtracurricularId = extra.Id,
            Position = ExtracurricularMemberPosition.Secretary,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.GetPositionInExtracurricularAsync(student.Id, extra.Id);

        result.Should().Be("Secretary");
    }
}
