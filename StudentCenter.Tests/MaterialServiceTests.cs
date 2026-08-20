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

    [Fact]
    public async Task LessonMaterial_AuthorizationBoundaries_EnforcedForTeacherAndStudent()
    {
        var (teacher1, cs1) = await SeedTeacherAndClassSubjectAsync();

        // Teacher 2 and Class 2 setup
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Prof. Jane", Email = "jane@test.com", Role = UserRole.Teacher, IsActive = true };
        var cls2 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 1", Grade = "XI" };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika" };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = subject2.Id };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = cls2.Id, TeacherSubjectId = ts2.Id };

        // Student 1 (in Class 1) & Student 2 (in Class 2)
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student One", Email = "s1@test.com", Role = UserRole.Student, ClassId = cs1.ClassId, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Student Two", Email = "s2@test.com", Role = UserRole.Student, ClassId = cls2.Id, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@test.com", Role = UserRole.Admin, IsActive = true };

        _context.Users.AddRange(teacher2, student1, student2, admin);
        _context.SchoolClasses.Add(cls2);
        _context.Subjects.Add(subject2);
        _context.TeacherSubjects.Add(ts2);
        _context.ClassSubjects.Add(cs2);
        await _context.SaveChangesAsync();

        // 1. Teacher 1 creates material for cs1
        var material1 = await _service.CreateAsync(teacher1.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs1.Id,
            Title = "Web Dev Basics",
            Visibility = "Published"
        });

        // 2. Teacher 2 cannot publish material to unauthorized cs1
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.CreateAsync(teacher2.Id, new CreateLessonMaterialRequest
            {
                ClassSubjectId = cs1.Id,
                Title = "Unauthorized Publish",
                Visibility = "Published"
            }));

        // 3. Teacher 2 cannot update Teacher 1's material1
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.UpdateAsync(material1.Id, teacher2.Id, new UpdateLessonMaterialRequest
            {
                Title = "Hacked Title",
                Visibility = "Published"
            }));

        // 4. Student 1 (in Class 1) can read material1
        var resStudent1 = await _service.GetByIdAsync(material1.Id, isStudent: true, requestingUserId: student1.Id, userRole: "Student");
        resStudent1.Should().NotBeNull();
        resStudent1!.Title.Should().Be("Web Dev Basics");

        // 5. Student 2 (in Class 2) cannot read material1 (belongs to Class 1)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.GetByIdAsync(material1.Id, isStudent: true, requestingUserId: student2.Id, userRole: "Student"));

        // 6. Admin can update material1
        var adminUpdated = await _service.UpdateAsync(material1.Id, admin.Id, new UpdateLessonMaterialRequest
        {
            Title = "Admin Updated Title",
            Visibility = "Published"
        });
        adminUpdated.Should().NotBeNull();
        adminUpdated!.Title.Should().Be("Admin Updated Title");
    }
}
