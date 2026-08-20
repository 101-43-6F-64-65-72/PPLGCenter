using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class AnnouncementSecurityTests
{
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<ILogger<AnnouncementService>> _mockLogger;

    public AnnouncementSecurityTests()
    {
        _mockNotificationService = new Mock<INotificationService>();
        _mockLogger = new Mock<ILogger<AnnouncementService>>();
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
        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 1", Grade = "XI", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 2", Grade = "XI", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.SchoolClasses.AddRange(class1, class2);

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru Pengajar 1", Email = "g1@sch.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru Lain 2", Email = "g2@sch.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa Kelas 1", Email = "s1@sch.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Kelas 2", Email = "s2@sch.id", Role = UserRole.Student, ClassId = class2.Id, Class = class2, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Center", Email = "adm@sch.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacher1, teacher2, student1, student2, admin);

        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "PWPB", Name = "Pemrograman Web", IsActive = true };
        context.Subjects.Add(subject1);

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, Teacher = teacher1, SubjectId = subject1.Id, Subject = subject1, CreatedAt = DateTime.UtcNow };
        context.TeacherSubjects.Add(ts1);

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, Class = class1, TeacherSubjectId = ts1.Id, TeacherSubject = ts1, CreatedAt = DateTime.UtcNow };
        context.ClassSubjects.Add(cs1);

        // General announcement
        var annGeneral = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Pengumuman Umum Sekolah",
            Content = "Isi pengumuman umum",
            Category = "General",
            CreatedByUserId = admin.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Teacher targeted announcement
        var annTeacher = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Pengumuman Rapat Guru",
            Content = "Isi rapat guru",
            Category = "Role:Teacher",
            CreatedByUserId = admin.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Admin targeted announcement
        var annAdmin = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Pengumuman Internal Admin",
            Content = "Isi admin",
            Category = "Role:Admin",
            CreatedByUserId = admin.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Class 1 targeted announcement
        var annClass1 = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Pengumuman Kelas XI RPL 1",
            Content = "Isi khusus XI RPL 1",
            Category = $"Class:{class1.Id}",
            CreatedByUserId = teacher1.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Class 2 targeted announcement
        var annClass2 = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = "Pengumuman Kelas XI RPL 2",
            Content = "Isi khusus XI RPL 2",
            Category = $"Class:{class2.Id}",
            CreatedByUserId = teacher2.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Announcements.AddRange(annGeneral, annTeacher, annAdmin, annClass1, annClass2);
        context.SaveChangesAsync().Wait();
    }

    [Fact]
    public async Task Test_1_StudentCanReadGeneralPublishedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annGeneral = await context.Announcements.FirstAsync(a => a.Category == "General");

        var res = await service.GetAnnouncementByIdAsync(annGeneral.Id, student1.Id, "Student", student1.ClassId);
        Assert.NotNull(res);
        Assert.Equal("Pengumuman Umum Sekolah", res!.Title);
    }

    [Fact]
    public async Task Test_2_StudentCannotReadTeacherTargetedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annTeacher = await context.Announcements.FirstAsync(a => a.Category == "Role:Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annTeacher.Id, student1.Id, "Student", student1.ClassId);
        });
    }

    [Fact]
    public async Task Test_3_StudentCannotReadAdminTargetedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annAdmin = await context.Announcements.FirstAsync(a => a.Category == "Role:Admin");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annAdmin.Id, student1.Id, "Student", student1.ClassId);
        });
    }

    [Fact]
    public async Task Test_4_StudentCanReadOwnClassTargetedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var class1 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 1");
        var annClass1 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class1.Id}");

        var res = await service.GetAnnouncementByIdAsync(annClass1.Id, student1.Id, "Student", student1.ClassId);
        Assert.NotNull(res);
        Assert.Equal("Pengumuman Kelas XI RPL 1", res!.Title);
    }

    [Fact]
    public async Task Test_5_StudentCannotReadAnotherClassTargetedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id"); // Class 1
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annClass2.Id, student1.Id, "Student", student1.ClassId);
        });
    }

    [Fact]
    public async Task Test_6_TeacherCanReadTeacherTargetedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var annTeacher = await context.Announcements.FirstAsync(a => a.Category == "Role:Teacher");

        var res = await service.GetAnnouncementByIdAsync(annTeacher.Id, teacher1.Id, "Teacher", null);
        Assert.NotNull(res);
        Assert.Equal("Pengumuman Rapat Guru", res!.Title);
    }

    [Fact]
    public async Task Test_7_TeacherCannotReadUnauthorizedClassTargetedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id"); // Teaches Class 1
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annClass2.Id, teacher1.Id, "Teacher", null);
        });
    }

    [Fact]
    public async Task Test_8_AdminCanReadAllAuthorizedAnnouncements()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        var res = await service.GetAnnouncementByIdAsync(annClass2.Id, admin.Id, "Admin", null);
        Assert.NotNull(res);
        Assert.Equal("Pengumuman Kelas XI RPL 2", res!.Title);
    }

    [Fact]
    public async Task Test_9_StudentCannotRetrieveAnotherClassAnnouncementById()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annClass2.Id, student1.Id, "Student", student1.ClassId);
        });
    }

    [Fact]
    public async Task Test_10_StudentCannotRetrieveTeacherOnlyAnnouncementById()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annTeacher = await context.Announcements.FirstAsync(a => a.Category == "Role:Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annTeacher.Id, student1.Id, "Student", student1.ClassId);
        });
    }

    [Fact]
    public async Task Test_11_AnonymousCallerCannotRetrieveTargetedAnnouncementById()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var annTeacher = await context.Announcements.FirstAsync(a => a.Category == "Role:Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annTeacher.Id, null, null, null);
        });
    }

    [Fact]
    public async Task Test_12_StudentCannotRetrieveUnpublishedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annTeacher = await context.Announcements.FirstAsync(a => a.Category == "Role:Teacher");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annTeacher.Id, student1.Id, "Student", student1.ClassId);
        });
    }

    [Fact]
    public async Task Test_13_UnauthorizedTeacherCannotRetrieveUnpublishedAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annClass2.Id, teacher1.Id, "Teacher", null);
        });
    }

    [Fact]
    public async Task Test_14_StudentCannotCreateAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
            {
                Title = "Illegal Announcement",
                Content = "Content",
                Category = "General"
            }, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_15_StudentCannotModifyAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annGeneral = await context.Announcements.FirstAsync(a => a.Category == "General");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateAnnouncementAsync(annGeneral.Id, new UpdateAnnouncementRequest
            {
                Title = "Hacked Title",
                Content = "Hacked Content",
                Category = "General"
            }, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_16_StudentCannotDeleteAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annGeneral = await context.Announcements.FirstAsync(a => a.Category == "General");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.DeleteAnnouncementAsync(annGeneral.Id, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_17_TeacherCannotModifyAnotherTeachersAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        // Teacher 1 attempts to modify Teacher 2's announcement
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateAnnouncementAsync(annClass2.Id, new UpdateAnnouncementRequest
            {
                Title = "Hacked Title by T1",
                Content = "Content",
                Category = $"Class:{class2.Id}"
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_18_TeacherCannotDeleteAnotherTeachersAnnouncement()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.DeleteAnnouncementAsync(annClass2.Id, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_19_TeacherCannotPublishOutsideAuthorizationBoundary()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id"); // Teaches Class 1
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        // Teacher 1 attempts to target Class 2
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
            {
                Title = "Illegal Target Announcement",
                Content = "Content",
                Category = $"Class:{class2.Id}"
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_20_AdminRetainsGlobalManagementAccess()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        var updated = await service.UpdateAnnouncementAsync(annClass2.Id, new UpdateAnnouncementRequest
        {
            Title = "Updated by Admin",
            Content = "Admin Content",
            Category = $"Class:{class2.Id}"
        }, admin.Id, "Admin");

        Assert.NotNull(updated);
        Assert.Equal("Updated by Admin", updated!.Title);
    }

    [Fact]
    public async Task Test_21_InvalidRoleTargetRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
            {
                Title = "Invalid Role Target",
                Content = "Content",
                Category = "Role:SuperUser"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Test_22_InvalidClassTargetRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
            {
                Title = "Invalid Class Target",
                Content = "Content",
                Category = $"Class:{Guid.NewGuid()}"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Test_23_NonexistentClassTargetRejected()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
            {
                Title = "Nonexistent Class Name Target",
                Content = "Content",
                Category = "Class:KelasYangTidakAda"
            }, admin.Id, "Admin");
        });
    }

    [Fact]
    public async Task Test_24_TeacherCannotTargetClassTheyDoNotTeach()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
            {
                Title = "Unauthorized Class Target",
                Content = "Content",
                Category = $"Class:{class2.Id}"
            }, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_25_TargetManipulationCannotBypassVisibility()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");
        var annClass2 = await context.Announcements.FirstAsync(a => a.Category == $"Class:{class2.Id}");

        // Student 1 passing Student 2's classId manually in query
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAnnouncementByIdAsync(annClass2.Id, student1.Id, "Student", class2.Id);
        });
    }

    [Fact]
    public async Task Test_26_AnnouncementAuthorEnrichmentDoesNotExposePrivateProfileContactInfo()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var annGeneral = await context.Announcements.FirstAsync(a => a.Category == "General");

        var res = await service.GetAnnouncementByIdAsync(annGeneral.Id, student1.Id, "Student", student1.ClassId);
        Assert.NotNull(res);
        Assert.Equal("Admin Center", res!.CreatedByUserName);
    }

    [Fact]
    public async Task Test_27_ListEndpointAppliesSameVisibilityRulesAsDetailEndpoint()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id"); // Class 1

        var res = await service.GetAnnouncementsAsync(1, 10, null, student1.Id, "Student", student1.ClassId);
        Assert.NotNull(res);
        
        // Student 1 should see: General, Class 1
        // Student 1 should NOT see: Role:Teacher, Role:Admin, Class 2
        Assert.DoesNotContain(res.Items, a => a.Category == "Role:Teacher");
        Assert.DoesNotContain(res.Items, a => a.Category == "Role:Admin");
        Assert.DoesNotContain(res.Items, a => a.Title.Contains("XI RPL 2"));
    }

    [Fact]
    public async Task Test_28_FeedEndpointAppliesSameVisibilityRulesAsDetailEndpoint()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id"); // Class 1

        var feed = await service.GetFeedAsync(1, 10, null, student1.Id, "Student", student1.ClassId);
        Assert.NotNull(feed);

        Assert.DoesNotContain(feed.Items, a => a.Category == "Role:Teacher");
        Assert.DoesNotContain(feed.Items, a => a.Category == "Role:Admin");
        Assert.DoesNotContain(feed.Items, a => a.Title.Contains("XI RPL 2"));
    }

    [Fact]
    public async Task Test_29_ExistingAnnouncementFunctionalityRemainsIntact()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var created = await service.CreateAnnouncementAsync(new CreateAnnouncementRequest
        {
            Title = "Pengumuman Baru",
            Content = "Isi Pengumuman Baru",
            Category = "General"
        }, admin.Id, "Admin");

        Assert.NotNull(created);
        Assert.Equal("Pengumuman Baru", created.Title);
    }

    [Fact]
    public async Task Test_30_PaginationRemainsBounded()
    {
        var context = GetInMemoryDbContext();
        var service = new AnnouncementService(context, _mockNotificationService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);

        var res = await service.GetAnnouncementsAsync(1, 2, null, admin.Id, "Admin", null);
        Assert.NotNull(res);
        Assert.True(res.Items.Count <= 2);
    }
}
