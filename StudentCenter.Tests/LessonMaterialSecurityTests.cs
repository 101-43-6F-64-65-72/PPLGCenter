using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Moq;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Interfaces;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class LessonMaterialSecurityTests
{
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<IFileStorageService> _mockStorageService;

    public LessonMaterialSecurityTests()
    {
        _mockNotificationService = new Mock<INotificationService>();
        _mockStorageService = new Mock<IFileStorageService>();

        _mockStorageService
            .Setup(s => s.CreateSignedUrlAsync(It.IsAny<string>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string path, TimeSpan? expires, CancellationToken ct) => $"https://storage.pplg.sch.id/signed/{path}");
    }

    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedTestData(context);
        return context;
    }

    private void SeedTestData(AppDbContext context)
    {
        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", Grade = "X", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.SchoolClasses.AddRange(class1, class2);

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1_mat@sch.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2_mat@sch.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1_mat@sch.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2 (Class 2)", Email = "s2_mat@sch.id", Role = UserRole.Student, ClassId = class2.Id, Class = class2, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Material", Email = "adm_mat@sch.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacher1, teacher2, student1, student2, admin);

        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "PWPB", Name = "Pemrograman Web", IsActive = true };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika", IsActive = true };
        context.Subjects.AddRange(subject1, subject2);

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, Teacher = teacher1, SubjectId = subject1.Id, Subject = subject1 };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, Teacher = teacher2, SubjectId = subject2.Id, Subject = subject2 };
        context.TeacherSubjects.AddRange(ts1, ts2);

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, Class = class1, TeacherSubjectId = ts1.Id, TeacherSubject = ts1 };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, Class = class2, TeacherSubjectId = ts2.Id, TeacherSubject = ts2 };
        context.ClassSubjects.AddRange(cs1, cs2);

        // Seed Published & Draft materials for Class 1
        var m1Published = new LessonMaterial
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs1.Id,
            ClassSubject = cs1,
            Title = "Modul HTML Published",
            FileUrl = "documents/html.pdf",
            Visibility = "Published",
            IsDeleted = false,
            CreatedBy = teacher1.Id,
            UpdatedBy = teacher1.Id
        };

        var m1Draft = new LessonMaterial
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs1.Id,
            ClassSubject = cs1,
            Title = "Soal Ujian Draft",
            FileUrl = "documents/exam_draft.pdf",
            Visibility = "Draft",
            IsDeleted = false,
            CreatedBy = teacher1.Id,
            UpdatedBy = teacher1.Id
        };

        // Seed Published material for Class 2
        var m2Published = new LessonMaterial
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs2.Id,
            ClassSubject = cs2,
            Title = "Modul Matematika Class 2",
            FileUrl = "documents/mtk.pdf",
            Visibility = "Published",
            IsDeleted = false,
            CreatedBy = teacher2.Id,
            UpdatedBy = teacher2.Id
        };

        context.LessonMaterials.AddRange(m1Published, m1Draft, m2Published);
        context.SaveChangesAsync().Wait();
    }

    [Fact]
    public async Task Test_1_StudentCannotListAnotherClassMaterials()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_mat@sch.id"); // Class 1

        var list = await service.GetAllAsync(requestingUserId: student1.Id, userRole: "Student");

        Assert.Single(list);
        Assert.Equal("Modul HTML Published", list[0].Title);
    }

    [Fact]
    public async Task Test_2_StudentCannotRetrieveAnotherClassMaterialById()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_mat@sch.id"); // Class 1
        var class2Material = await context.LessonMaterials.FirstAsync(m => m.Title == "Modul Matematika Class 2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetByIdAsync(class2Material.Id, isStudent: true, requestingUserId: student1.Id, userRole: "Student");
        });
    }

    [Fact]
    public async Task Test_3_StudentCannotRetrieveDraftMaterial()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_mat@sch.id");
        var draftMaterial = await context.LessonMaterials.FirstAsync(m => m.Visibility == "Draft");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.GetByIdAsync(draftMaterial.Id, isStudent: true, requestingUserId: student1.Id, userRole: "Student");
        });
    }

    [Fact]
    public async Task Test_4_StudentCannotUseVisibilityDraftToBypassFiltering()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_mat@sch.id");

        // Attempting to request visibility="Draft" as Student MUST still return ONLY Published materials!
        var list = await service.GetAllAsync(visibility: "Draft", requestingUserId: student1.Id, userRole: "Student");

        Assert.Single(list);
        Assert.Equal("Published", list[0].Visibility);
        Assert.Equal("Modul HTML Published", list[0].Title);
    }

    [Fact]
    public async Task Test_5_TeacherCannotMutateMaterialOutsideAssignedClassSubject()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id"); // Teacher 1
        var class2Material = await context.LessonMaterials.FirstAsync(m => m.Title == "Modul Matematika Class 2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateAsync(class2Material.Id, teacher1.Id, new UpdateLessonMaterialRequest
            {
                Title = "Illegal Update"
            });
        });
    }

    [Fact]
    public async Task Test_6_TeacherScopeViolationReturns403()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id");
        var class2Subject = await context.ClassSubjects.FirstAsync(cs => cs.Class.Name == "X RPL 2");

        // Teacher 1 creating material for Teacher 2's ClassSubject throws UnauthorizedAccessException (which controller maps to 403)
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.CreateAsync(teacher1.Id, new CreateLessonMaterialRequest
            {
                ClassSubjectId = class2Subject.Id,
                Title = "Cross-Teacher Material"
            });
        });

        Assert.Contains("Teacher is not authorized", ex.Message);
    }

    [Fact]
    public async Task Test_7_AdminRetainsGlobalMaterialAccess()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class2Subject = await context.ClassSubjects.FirstAsync(cs => cs.Class.Name == "X RPL 2");

        var material = await service.CreateAsync(admin.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = class2Subject.Id,
            Title = "Admin Master Material"
        });

        Assert.NotNull(material);
        Assert.Equal("Admin Master Material", material.Title);
    }

    [Fact]
    public async Task Test_8_LegacyApiMaterialsCannotBypassAuthorization()
    {
        var context = GetInMemoryDbContext();
        var lessonService = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);
        var legacyService = new MaterialService(context, _mockStorageService.Object, lessonService);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_mat@sch.id"); // Class 1

        // Calling legacy GetMaterialsAsync with Student role MUST return ONLY Class 1 published materials
        var paged = await legacyService.GetMaterialsAsync(1, 10, null, null, student1.Id, "Student");

        Assert.NotNull(paged);
        Assert.Single(paged.Items);
        Assert.Equal("Modul HTML Published", paged.Items[0].Title);
        Assert.Equal("X RPL 1", paged.Items[0].Grade);
    }

    [Fact]
    public async Task Test_9_LegacyMaterialDetailCannotBypassAuthorization()
    {
        var context = GetInMemoryDbContext();
        var lessonService = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);
        var legacyService = new MaterialService(context, _mockStorageService.Object, lessonService);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1_mat@sch.id"); // Class 1
        var class2Material = await context.LessonMaterials.FirstAsync(m => m.Title == "Modul Matematika Class 2");

        // Attempting to retrieve Class 2 material via legacy service throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await legacyService.GetMaterialByIdAsync(class2Material.Id, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_10_MaliciousFileUrlIsRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id");
        var cs1 = await context.ClassSubjects.FirstAsync(cs => cs.Class.Name == "X RPL 1");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(teacher1.Id, new CreateLessonMaterialRequest
            {
                ClassSubjectId = cs1.Id,
                Title = "Malicious Payload",
                FileUrl = "javascript:alert(1)"
            });
        });
    }

    [Fact]
    public async Task Test_11_UnsupportedExternalStorageUrlIsRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id");
        var cs1 = await context.ClassSubjects.FirstAsync(cs => cs.Class.Name == "X RPL 1");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(teacher1.Id, new CreateLessonMaterialRequest
            {
                ClassSubjectId = cs1.Id,
                Title = "Unsupported Protocol",
                FileUrl = "ftp://malicious-server.com/payload.exe"
            });
        });
    }

    [Fact]
    public async Task Test_12_AuthorizedStorageUrlRemainsValid()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id");
        var cs1 = await context.ClassSubjects.FirstAsync(cs => cs.Class.Name == "X RPL 1");

        var material = await service.CreateAsync(teacher1.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs1.Id,
            Title = "Valid Material",
            FileUrl = "documents/valid_module.pdf",
            YoutubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        });

        Assert.NotNull(material);
        Assert.Equal("Valid Material", material.Title);
        Assert.Contains("signed/documents/valid_module.pdf", material.FileUrl);
    }

    [Fact]
    public async Task Test_13_ExistingMaterialBehaviorRemainsFunctional()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id");
        var m1Published = await context.LessonMaterials.FirstAsync(m => m.Title == "Modul HTML Published");

        var updated = await service.UpdateAsync(m1Published.Id, teacher1.Id, new UpdateLessonMaterialRequest
        {
            Title = "Modul HTML Published (Updated)",
            Description = "Deskripsi baru",
            Visibility = "Published"
        });

        Assert.NotNull(updated);
        Assert.Equal("Modul HTML Published (Updated)", updated!.Title);
        Assert.Equal(2, updated.Version);
    }

    [Fact]
    public async Task Test_14_SignedUrlGenerationDoesNotBreakResponseMapping()
    {
        var context = GetInMemoryDbContext();
        var service = new LessonMaterialService(context, _mockNotificationService.Object, _mockStorageService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1_mat@sch.id");
        var teacherMaterials = await service.GetTeacherMaterialsAsync(teacher1.Id);

        Assert.NotEmpty(teacherMaterials);
        foreach (var mat in teacherMaterials)
        {
            if (!string.IsNullOrEmpty(mat.FileUrl))
            {
                Assert.StartsWith("https://storage.pplg.sch.id/signed/", mat.FileUrl);
            }
        }
    }
}
