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

public class MaterialServiceTests
{
    private readonly AppDbContext _context;
    private readonly LessonMaterialService _service;

    public MaterialServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new LessonMaterialService(_context);
    }

    private async Task<(User teacher, ClassSubject cs)> SeedTeacherAndClassSubjectAsync()
    {
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Dr. Smith", Email = "smith@test.com", Role = UserRole.Teacher, IsActive = true };
        var cls = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X" };
        var subject = new Subject { Id = Guid.NewGuid(), Code = "FIS", Name = "Fisika" };
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
    public async Task CreateAsync_ValidRequest_ReturnsMaterial()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();

        var request = new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Calculus Textbook",
            Description = "Chapter 1-10",
            FileUrl = "https://example.com/calculus.pdf",
            Visibility = "Published"
        };

        var result = await _service.CreateAsync(teacher.Id, request);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.ClassSubjectId.Should().Be(cs.Id);
    }

    [Fact]
    public async Task GetByIdAsync_ExistingId_ReturnsMaterial()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();
        var material = await _service.CreateAsync(teacher.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Biology Notes",
            Visibility = "Published"
        });

        var result = await _service.GetByIdAsync(material.Id, isStudent: false);

        result.Should().NotBeNull();
        result!.Title.Should().Be("Biology Notes");
    }

    [Fact]
    public async Task UpdateAsync_TeacherOwner_Succeeds()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();
        var material = await _service.CreateAsync(teacher.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Original Title",
            Visibility = "Published"
        });

        var updated = await _service.UpdateAsync(material.Id, teacher.Id, new UpdateLessonMaterialRequest
        {
            Title = "Updated Title",
            Description = "Updated Desc",
            Visibility = "Published"
        });

        updated.Should().NotBeNull();
        updated!.Title.Should().Be("Updated Title");
    }

    [Fact]
    public async Task SoftDeleteAsync_Succeeds()
    {
        var (teacher, cs) = await SeedTeacherAndClassSubjectAsync();
        var material = await _service.CreateAsync(teacher.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Test Material",
            Visibility = "Published"
        });

        var result = await _service.SoftDeleteAsync(material.Id, teacher.Id);
        result.Should().BeTrue();

        var getResult = await _service.GetByIdAsync(material.Id);
        getResult.Should().BeNull();
    }
}
