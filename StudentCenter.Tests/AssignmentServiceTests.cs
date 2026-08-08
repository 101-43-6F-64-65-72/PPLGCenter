using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class AssignmentServiceTests
{
    private readonly AppDbContext _context;
    private readonly AssignmentService _service;

    public AssignmentServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new AssignmentService(_context);
    }

    private async Task<(User teacher, ClassSubject cs)> SeedTeacherAndClassSubjectAsync()
    {
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Math", Email = "math@test.com", Role = UserRole.Teacher, IsActive = true };
        var cls = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X" };
        var subject = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika" };
        var ts = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher.Id, SubjectId = subject.Id };
        var cs = new ClassSubject { Id = Guid.NewGuid(), ClassId = cls.Id, TeacherSubjectId = ts.Id };

        _context.Users.Add(teacher);
        _context.SchoolClasses.Add(cls);
        _context.Subjects.Add(subject);
        _context.TeacherSubjects.Add(ts);
        _context.ClassSubjects.Add(cs);
        await _context.SaveChangesAsync();

        return (teacher, cs);
    }

    [Fact]
    public async Task CreateAsync_ValidRequest_ReturnsAssignment()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();

        var request = new CreateAssignmentRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Tugas Matematika 1",
            Description = "Latihan Bab 1",
            PublishAt = DateTime.UtcNow.AddMinutes(-5),
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100
        };

        var result = await _service.CreateAsync(teacher.Id, request);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.ClassSubjectId.Should().Be(cs.Id);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsAssignment()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();
        var assignment = await _service.CreateAsync(teacher.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Tugas Fisika",
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(3),
            MaxScore = 100
        });

        var result = await _service.GetByIdAsync(assignment.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be("Tugas Fisika");
    }

    [Fact]
    public async Task UpdateAsync_TeacherOwner_Succeeds()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();
        var assignment = await _service.CreateAsync(teacher.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Tugas Judul Asli",
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(3),
            MaxScore = 100
        });

        var updated = await _service.UpdateAsync(assignment.Id, teacher.Id, new UpdateAssignmentRequest
        {
            Title = "Tugas Judul Baru",
            Description = "Deskripsi Baru",
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(5),
            MaxScore = 100
        });

        updated.Should().NotBeNull();
        updated!.Title.Should().Be("Tugas Judul Baru");
    }

    [Fact]
    public async Task SoftDeleteAsync_Succeeds()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();
        var assignment = await _service.CreateAsync(teacher.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Tugas Dihapus",
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(3),
            MaxScore = 100
        });

        var deleted = await _service.SoftDeleteAsync(assignment.Id, teacher.Id);
        deleted.Should().BeTrue();

        var getResult = await _service.GetByIdAsync(assignment.Id);
        getResult.Should().BeNull();
    }
}
