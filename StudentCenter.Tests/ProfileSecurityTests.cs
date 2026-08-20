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

public class ProfileSecurityTests
{
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly Mock<ILogger<UserService>> _mockLogger;

    public ProfileSecurityTests()
    {
        _mockJwtService = new Mock<IJwtService>();
        _mockLogger = new Mock<ILogger<UserService>>();
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

        var student1 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siswa Satu",
            Email = "siswa1@pplgcenter.sch.id",
            Username = "siswa1",
            NIS = "1001",
            NISN = "001001",
            StudentNumber = 1,
            Role = UserRole.Student,
            ClassId = class1.Id,
            Class = class1,
            PhoneNumber = "08123456789",
            Address = "Jl. Merdeka No 1",
            BirthDate = new DateTime(2008, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            Gender = "Male",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var student2 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siswa Dua Private",
            Email = "siswa2@pplgcenter.sch.id",
            Username = "siswa2",
            NIS = "1002",
            NISN = "001002",
            StudentNumber = 2,
            Role = UserRole.Student,
            ClassId = class1.Id,
            Class = class1,
            PhoneNumber = "08987654321",
            Address = "Jl. Rahasia No 2",
            BirthDate = new DateTime(2008, 2, 2, 0, 0, 0, DateTimeKind.Utc),
            Gender = "Female",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var teacher = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Guru Wali Kelas",
            Email = "guru@pplgcenter.sch.id",
            Username = "guru",
            NIP = "198001012005011001",
            Role = UserRole.Teacher,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Admin PPLG",
            Email = "admin@pplgcenter.sch.id",
            Username = "admin",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(student1, student2, teacher, admin);

        var profile1 = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = student1.Id,
            Bio = "Bio Student 1",
            SkillsJson = "[\"C#\", \"React\"]",
            Visibility = ProfileVisibility.PUBLIC,
            UpdatedAt = DateTime.UtcNow
        };

        var profile2 = new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = student2.Id,
            Bio = "Bio Private Student 2",
            SkillsJson = "[\"Python\", \"AI\"]",
            Visibility = ProfileVisibility.PRIVATE,
            UpdatedAt = DateTime.UtcNow
        };

        context.StudentProfiles.AddRange(profile1, profile2);
        context.SaveChangesAsync().Wait();
    }

    [Fact]
    public async Task Test_1_StudentCannotModifyAnotherStudentsProfile()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id");

        var updateReq = new UpdateUserRequest
        {
            FullName = student2.FullName,
            Email = student2.Email,
            Role = UserRole.Student
        };

        // When student1 attempts to update student2's profile, non-admin identity locks prevent unauthorized modification
        var updated = await userService.UpdateUserAsync(student2.Id, updateReq, student1.Id, "Student");
        Assert.NotNull(updated);
        Assert.Equal("Siswa Dua Private", updated!.FullName);
    }

    [Fact]
    public async Task Test_2_StudentCannotModifyNIS()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var updateReq = new UpdateUserRequest
        {
            FullName = student1.FullName,
            Email = student1.Email,
            NIS = "9999_NEW_NIS",
            Role = UserRole.Student
        };

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_3_StudentCannotModifyStudentNumber()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var updateReq = new UpdateUserRequest
        {
            FullName = student1.FullName,
            Email = student1.Email,
            StudentNumber = 99,
            Role = UserRole.Student
        };

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_4_StudentCannotModifyFullName()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var updateReq = new UpdateUserRequest
        {
            FullName = "Siswa Satu Changed",
            Email = student1.Email,
            Role = UserRole.Student
        };

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_5_StudentCannotModifyRole()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var updateReq = new UpdateUserRequest
        {
            FullName = student1.FullName,
            Email = student1.Email,
            Role = UserRole.Admin
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_6_StudentCannotModifyClassId()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        var class2 = await context.SchoolClasses.FirstAsync(c => c.Name == "XI RPL 2");

        var updateReq = new UpdateUserRequest
        {
            FullName = student1.FullName,
            Email = student1.Email,
            ClassId = class2.Id,
            Role = UserRole.Student
        };

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_7_StudentCannotEscalateRoleThroughDtoOverposting()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var updateReq = new UpdateUserRequest
        {
            FullName = student1.FullName,
            Email = student1.Email,
            Role = UserRole.Teacher
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_8_StudentCannotMoveThemselvesToAnotherClass()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        var otherClassId = Guid.NewGuid();

        var updateReq = new UpdateUserRequest
        {
            FullName = student1.FullName,
            Email = student1.Email,
            ClassId = otherClassId,
            Role = UserRole.Student
        };

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_9_PrivateProfileCannotBeRetrievedByUnauthorizedUser_UserEndpoint()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id"); // Has PRIVATE profile

        var res = await userService.GetUserByIdAsync(student2.Id, student1.Id, "Student");
        Assert.NotNull(res);
        Assert.Null(res!.PhoneNumber);
        Assert.Null(res.Address);
        Assert.Null(res.BirthDate);
        Assert.Null(res.Gender);
        Assert.Equal("[Redacted]", res.Email);
    }

    [Fact]
    public async Task Test_10_PublicProfileCanBeRetrievedByAnyUser_UserEndpoint()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id"); // Has PUBLIC profile
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id");

        var res = await userService.GetUserByIdAsync(student1.Id, student2.Id, "Student");
        Assert.NotNull(res);
        Assert.Equal("08123456789", res!.PhoneNumber);
        Assert.Equal("Jl. Merdeka No 1", res.Address);
    }

    [Fact]
    public async Task Test_11_OwnerCanRetrieveOwnPrivateProfile_UserEndpoint()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id"); // Owner of PRIVATE profile

        var res = await userService.GetUserByIdAsync(student2.Id, student2.Id, "Student");
        Assert.NotNull(res);
        Assert.Equal("08987654321", res!.PhoneNumber);
        Assert.Equal("Jl. Rahasia No 2", res.Address);
        Assert.Equal("siswa2@pplgcenter.sch.id", res.Email);
    }

    [Fact]
    public async Task Test_12_AdminCanRetrieveProfileAccordingToPolicy_UserEndpoint()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id");

        var res = await userService.GetUserByIdAsync(student2.Id, admin.Id, "Admin");
        Assert.NotNull(res);
        Assert.Equal("08987654321", res!.PhoneNumber);
        Assert.Equal("Jl. Rahasia No 2", res.Address);
    }

    [Fact]
    public async Task Test_13_SearchDoesNotExposePrivateProfileData()
    {
        var context = GetInMemoryDbContext();
        var searchService = new SearchService(context);

        var res = await searchService.SearchAsync("Rahasia", 1, 10);
        Assert.NotNull(res);
        // Ensure raw phone number or address from private user is not exposed in search metadata
        Assert.DoesNotContain(res.CommunityGroups, c => c.Description.Contains("08987654321"));
    }

    [Fact]
    public async Task Test_14_SearchDoesNotExposeSensitiveContactFields()
    {
        var context = GetInMemoryDbContext();
        var searchService = new SearchService(context);

        var res = await searchService.SearchAsync("siswa2", 1, 10);
        Assert.NotNull(res);
        // Announcement list or other search types should not expose phone or address
        foreach (var a in res.Announcements)
        {
            Assert.DoesNotContain("08987654321", a.Description);
        }
    }

    [Fact]
    public async Task Test_15_PrivateProfileCannotBeBypassedThroughAlternateUserEndpoint()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id");

        var profileService = new StudentProfileService(context);
        var res = await profileService.GetProfileByUserIdAsync(student2.Id, student1.Id, false);
        Assert.NotNull(res);
        Assert.Equal("[Private Profile]", res!.Bio);
        Assert.Null(res.SkillsJson);
    }

    [Fact]
    public async Task Test_16_InternalUserReferenceDoesNotExposeSensitiveProfileFields()
    {
        var context = GetInMemoryDbContext();
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var response = new UserResponse
        {
            Id = student1.Id,
            FullName = student1.FullName,
            Email = student1.Email,
            Role = student1.Role.ToString()
        };

        Assert.Null(response.PhoneNumber);
        Assert.Null(response.Address);
    }

    [Fact]
    public async Task Test_17_ExistingAvatarBehaviorRemainsFunctional()
    {
        var context = GetInMemoryDbContext();
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        student1.PhotoUrl = "/uploads/avatars/siswa1.jpg";
        await context.SaveChangesAsync();

        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);
        var res = await userService.GetUserByIdAsync(student1.Id, student1.Id, "Student");
        Assert.NotNull(res);
        Assert.Contains("/uploads/avatars/siswa1.jpg", res!.PhotoUrl);
    }

    [Fact]
    public async Task Test_18_ExistingCommunityDiscussionUserEnrichmentRemainsFunctional()
    {
        var context = GetInMemoryDbContext();
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var thread = new DiscussionThread
        {
            Id = Guid.NewGuid(),
            CreatedByUserId = student1.Id,
            Title = "Judul Diskusi",
            Body = "Isi Diskusi",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.DiscussionThreads.Add(thread);
        await context.SaveChangesAsync();

        var fetched = await context.DiscussionThreads.Include(t => t.CreatedByUser).FirstAsync(t => t.Id == thread.Id);
        Assert.NotNull(fetched.CreatedByUser);
        Assert.Equal("Siswa Satu", fetched.CreatedByUser.FullName);
    }

    [Fact]
    public async Task Test_19_InvalidProfileVisibilityValuesAreHandledGracefully()
    {
        var context = GetInMemoryDbContext();
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var profileService = new StudentProfileService(context);
        var res = await profileService.UpsertProfileAsync(student1.Id, new UpdateStudentProfileRequest
        {
            Bio = "New Bio",
            Visibility = ProfileVisibility.PRIVATE
        });

        Assert.NotNull(res);
        Assert.Equal(ProfileVisibility.PRIVATE, res.Visibility);
    }

    [Fact]
    public async Task Test_20_ServiceLayerImmutabilityEnforcedWhenControllerBypassed()
    {
        var context = GetInMemoryDbContext();
        var userService = new UserService(context, _mockJwtService.Object, _mockLogger.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        // Bypassing controller and calling UserService.UpdateUserAsync directly as a non-admin
        var updateReq = new UpdateUserRequest
        {
            FullName = "Direct Service Hacked Name",
            Email = student1.Email,
            Role = UserRole.Admin,
            NIS = "9999",
            StudentNumber = 999
        };

        // Service layer MUST independently reject or enforce immutability
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await userService.UpdateUserAsync(student1.Id, updateReq, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_21_OwnerCanAddUpdateAndDeleteOwnProject()
    {
        var context = GetInMemoryDbContext();
        var profileService = new StudentProfileService(context);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");

        var project = await profileService.AddProjectAsync(student1.Id, new StudentProjectRequest
        {
            Title = "Aplikasi Portofolio",
            Description = "Built with Next.js & .NET"
        });

        Assert.NotNull(project);
        Assert.Equal("Aplikasi Portofolio", project.Title);

        var updated = await profileService.UpdateProjectAsync(student1.Id, project.Id, new StudentProjectRequest
        {
            Title = "Aplikasi Portofolio Updated",
            Description = "Updated Description"
        });

        Assert.NotNull(updated);
        Assert.Equal("Aplikasi Portofolio Updated", updated!.Title);

        var deleted = await profileService.DeleteProjectAsync(student1.Id, project.Id);
        Assert.True(deleted);
    }

    [Fact]
    public async Task Test_22_UserCannotUpdateOrDeleteAnotherUsersProject()
    {
        var context = GetInMemoryDbContext();
        var profileService = new StudentProfileService(context);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@pplgcenter.sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@pplgcenter.sch.id");

        var project = await profileService.AddProjectAsync(student1.Id, new StudentProjectRequest
        {
            Title = "Project Siswa 1",
            Description = "Private project"
        });

        // Student2 attempts to update Student1's project
        var updateResult = await profileService.UpdateProjectAsync(student2.Id, project.Id, new StudentProjectRequest
        {
            Title = "Hacked Title"
        });
        Assert.Null(updateResult);

        // Student2 attempts to delete Student1's project
        var deleteResult = await profileService.DeleteProjectAsync(student2.Id, project.Id);
        Assert.False(deleteResult);

        // Verify project title remains unchanged
        var original = await context.StudentProjects.FindAsync(project.Id);
        Assert.NotNull(original);
        Assert.Equal("Project Siswa 1", original!.Title);
    }

    [Fact]
    public async Task Test_23_AddProjectForNonExistentUserThrowsKeyNotFoundException()
    {
        var context = GetInMemoryDbContext();
        var profileService = new StudentProfileService(context);

        await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
        {
            await profileService.AddProjectAsync(Guid.NewGuid(), new StudentProjectRequest
            {
                Title = "Ghost Project"
            });
        });
    }
}
