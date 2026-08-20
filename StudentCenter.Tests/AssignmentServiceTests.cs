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

    [Fact]
    public async Task Assignment_AuthorizationAndValidationBoundaries_Enforced()
    {
        var (teacher1, cs1) = await SeedTeacherAndClassSubjectAsync();

        // Teacher 2 and Class 2 setup
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru Fisika", Email = "fis@test.com", Role = UserRole.Teacher, IsActive = true };
        var cls2 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 1", Grade = "XI" };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "FIS", Name = "Fisika" };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = subject2.Id };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = cls2.Id, TeacherSubjectId = ts2.Id };

        // Student 1 (Class 1) & Student 2 (Class 2)
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa One", Email = "s1@test.com", Role = UserRole.Student, ClassId = cs1.ClassId, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Two", Email = "s2@test.com", Role = UserRole.Student, ClassId = cls2.Id, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@test.com", Role = UserRole.Admin, IsActive = true };

        _context.Users.AddRange(teacher2, student1, student2, admin);
        _context.SchoolClasses.Add(cls2);
        _context.Subjects.Add(subject2);
        _context.TeacherSubjects.Add(ts2);
        _context.ClassSubjects.Add(cs2);
        await _context.SaveChangesAsync();

        // 1. Invalid DueDate <= PublishAt throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(() =>
            _service.CreateAsync(teacher1.Id, new CreateAssignmentRequest
            {
                ClassSubjectId = cs1.Id,
                Title = "Tugas Invalid Dates",
                PublishAt = DateTime.UtcNow.AddDays(2),
                DueDate = DateTime.UtcNow.AddDays(1),
                MaxScore = 100
            }));

        // 2. Teacher 1 creates published assignment for cs1
        var assignment1 = await _service.CreateAsync(teacher1.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs1.Id,
            Title = "Tugas 1 Web Dev",
            PublishAt = DateTime.UtcNow.AddMinutes(-5),
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100
        });

        // 3. Teacher 1 creates draft (future publish) assignment for cs1
        var draftAssignment = await _service.CreateAsync(teacher1.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs1.Id,
            Title = "Tugas Draft Masa Depan",
            PublishAt = DateTime.UtcNow.AddDays(5),
            DueDate = DateTime.UtcNow.AddDays(10),
            MaxScore = 100
        });

        // 4. Teacher 2 cannot create assignment for unauthorized cs1
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.CreateAsync(teacher2.Id, new CreateAssignmentRequest
            {
                ClassSubjectId = cs1.Id,
                Title = "Tugas Unauthorized",
                PublishAt = DateTime.UtcNow.AddMinutes(-5),
                DueDate = DateTime.UtcNow.AddDays(5),
                MaxScore = 100
            }));

        // 5. Teacher 2 cannot edit teacher 1's assignment1
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.UpdateAsync(assignment1.Id, teacher2.Id, new UpdateAssignmentRequest
            {
                Title = "Tugas Hacked",
                PublishAt = DateTime.UtcNow.AddMinutes(-5),
                DueDate = DateTime.UtcNow.AddDays(5),
                MaxScore = 100
            }));

        // 6. Student 1 (in Class 1) can read published assignment1
        var resStudent1 = await _service.GetByIdAsync(assignment1.Id, student1.Id, "Student");
        resStudent1.Should().NotBeNull();
        resStudent1!.Title.Should().Be("Tugas 1 Web Dev");

        // 7. Student 1 cannot read draftAssignment (future publish date)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.GetByIdAsync(draftAssignment.Id, student1.Id, "Student"));

        // 8. Student 2 (in Class 2) cannot read assignment1 (belongs to Class 1)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.GetByIdAsync(assignment1.Id, student2.Id, "Student"));

        // 9. Admin can update assignment1
        var adminUpdated = await _service.UpdateAsync(assignment1.Id, admin.Id, new UpdateAssignmentRequest
        {
            Title = "Tugas Admin Edit",
            PublishAt = DateTime.UtcNow.AddMinutes(-5),
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100
        });
        adminUpdated.Should().NotBeNull();
        adminUpdated!.Title.Should().Be("Tugas Admin Edit");
    }
}
