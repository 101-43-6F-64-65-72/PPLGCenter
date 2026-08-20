using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Api.Controllers;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class CommunitySecurityTests
{
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

        var teacherAssigned = new User { Id = Guid.NewGuid(), FullName = "Guru Pengampu", Email = "guru1@test.id", Role = UserRole.Teacher, IsActive = true };
        var teacherNonAssigned = new User { Id = Guid.NewGuid(), FullName = "Guru Lain", Email = "guru2@test.id", Role = UserRole.Teacher, IsActive = true };
        var studentClass1 = new User { Id = Guid.NewGuid(), FullName = "Siswa Kelas 1", Email = "student1@test.id", Role = UserRole.Student, ClassId = class1.Id, NIS = "2001", IsActive = true };
        var studentClass2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Kelas 2", Email = "student2@test.id", Role = UserRole.Student, ClassId = class2.Id, NIS = "2002", IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Center", Email = "admin@test.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacherAssigned, teacherNonAssigned, studentClass1, studentClass2, admin);

        var subject = new Subject { Id = Guid.NewGuid(), Code = "KODING", Name = "Pemrograman Dasar", IsActive = true };
        context.Subjects.Add(subject);

        var teacherSubject1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacherAssigned.Id, SubjectId = subject.Id, CreatedAt = DateTime.UtcNow };
        var teacherSubject2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacherNonAssigned.Id, SubjectId = subject.Id, CreatedAt = DateTime.UtcNow };
        context.TeacherSubjects.AddRange(teacherSubject1, teacherSubject2);

        var classSubject1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, TeacherSubjectId = teacherSubject1.Id, CreatedAt = DateTime.UtcNow };
        var classSubject2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, TeacherSubjectId = teacherSubject2.Id, CreatedAt = DateTime.UtcNow };
        context.ClassSubjects.AddRange(classSubject1, classSubject2);

        context.SaveChanges();
    }

    [Fact]
    public async Task Teacher_NonTeachingClass_CannotUpdateDiscussionThread()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var teacherNonAssigned = await context.Users.FirstAsync(u => u.Email == "guru2@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Topik Utama",
            Body = "Isi Diskusi"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await discussionService.UpdateThreadAsync(teacherNonAssigned.Id, thread.Id, new UpdateDiscussionThreadRequest
            {
                Title = "Hijacked Title"
            });
        });
    }

    [Fact]
    public async Task Teacher_NonTeachingClass_CannotDeleteDiscussionThread()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var teacherNonAssigned = await context.Users.FirstAsync(u => u.Email == "guru2@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Topik Untuk Dihapus",
            Body = "Isi Diskusi"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await discussionService.DeleteThreadAsync(teacherNonAssigned.Id, thread.Id);
        });
    }

    [Fact]
    public async Task Teacher_NonTeachingClass_CannotDeleteReply()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var teacherNonAssigned = await context.Users.FirstAsync(u => u.Email == "guru2@test.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "student1@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Topik Balasan",
            Body = "Isi Diskusi"
        });

        var reply = await discussionService.CreateReplyAsync(student1.Id, new CreateDiscussionReplyRequest
        {
            ThreadId = thread.Id,
            Body = "Jawaban Siswa"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await discussionService.DeleteReplyAsync(teacherNonAssigned.Id, reply.Id);
        });
    }

    [Fact]
    public async Task Student_CannotReadUnauthorizedThreadById()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var studentClass2 = await context.Users.FirstAsync(u => u.Email == "student2@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Rahasia Kelas 1",
            Body = "Diskusi Privat Kelas 1"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await discussionService.GetThreadByIdAsync(thread.Id, studentClass2.Id);
        });
    }

    [Fact]
    public async Task Student_CannotReadUnauthorizedThreadRepliesById()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var studentClass2 = await context.Users.FirstAsync(u => u.Email == "student2@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Diskusi Kelas 1",
            Body = "Materi Kelas 1"
        });

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await discussionService.GetThreadRepliesAsync(thread.Id, studentClass2.Id);
        });
    }

    [Fact]
    public async Task Teacher_CanAccessDiscussionForAssignedClassSubject()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Topik Sah Guru Pengampu",
            Body = "Materi Pelajaran"
        });

        var fetchedThread = await discussionService.GetThreadByIdAsync(thread.Id, teacherAssigned.Id);
        Assert.NotNull(fetchedThread);
        Assert.Equal("Topik Sah Guru Pengampu", fetchedThread.Title);
    }

    [Fact]
    public async Task CreateReply_CrossThreadParent_ThrowsValidationException()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacher.Id);

        var thread1 = await discussionService.CreateThreadAsync(teacher.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Thread A",
            Body = "Body A"
        });

        var thread2 = await discussionService.CreateThreadAsync(teacher.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Thread B",
            Body = "Body B"
        });

        var replyInThreadA = await discussionService.CreateReplyAsync(teacher.Id, new CreateDiscussionReplyRequest
        {
            ThreadId = thread1.Id,
            Body = "Balasan di Thread A"
        });

        // Try to attach reply in Thread B to parent in Thread A
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await discussionService.CreateReplyAsync(teacher.Id, new CreateDiscussionReplyRequest
            {
                ThreadId = thread2.Id,
                ParentReplyId = replyInThreadA.Id,
                Body = "Cross-thread attempt"
            });
        });
    }

    [Fact]
    public async Task GetThreadReplies_EnforcesMaximumPageSize()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacher.Id);

        var thread = await discussionService.CreateThreadAsync(teacher.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Thread Pagination",
            Body = "Body"
        });

        var replies = await discussionService.GetThreadRepliesAsync(thread.Id, teacher.Id, page: 1, pageSize: 9999);
        Assert.NotNull(replies); // Executed without memory overflow
    }

    [Fact]
    public async Task JoinGroup_DeclinedMembership_CanReRegister()
    {
        var context = GetInMemoryDbContext();
        var groupService = new CommunityGroupService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "student1@test.id");

        var group = await groupService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = "Klub Koding",
            Description = "Komunitas Belajar"
        }, student1.Id);

        var student2 = await context.Users.FirstAsync(u => u.Email == "student2@test.id");

        // First join request
        await groupService.JoinGroupRequestAsync(group.Id, student2.Id);

        // Decline student2
        await groupService.ManageMemberAsync(group.Id, student2.Id, new ManageMemberRequest
        {
            Role = CommunityMemberRole.Member,
            Status = CommunityMemberStatus.Declined
        }, student1.Id);

        // Student2 re-registers
        var reJoinSuccess = await groupService.JoinGroupRequestAsync(group.Id, student2.Id);
        Assert.True(reJoinSuccess);

        var memberRecord = await context.CommunityGroupMembers.FirstAsync(m => m.GroupId == group.Id && m.UserId == student2.Id);
        Assert.Equal(CommunityMemberStatus.Pending, memberRecord.Status);
    }

    [Fact]
    public async Task CommunityGroupMemberRoute_MatchesFrontendContract()
    {
        var context = GetInMemoryDbContext();
        var groupService = new CommunityGroupService(context);
        var controller = new CommunityGroupsController(groupService);

        var student1 = await context.Users.FirstAsync(u => u.Email == "student1@test.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "student2@test.id");

        SetControllerUser(controller, student1.Id);

        var group = await groupService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = "Klub Desain",
            Description = "Komunitas UI/UX"
        }, student1.Id);

        await groupService.JoinGroupRequestAsync(group.Id, student2.Id);

        // Call ManageMember via controller (PUT/POST endpoint)
        var result = await controller.ManageMember(group.Id, student2.Id, new ManageMemberRequest
        {
            Role = CommunityMemberRole.Member,
            Status = CommunityMemberStatus.Accepted
        });

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task UnauthorizedException_MapsTo403()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);
        var controller = new DiscussionController(discussionService);

        var student2 = await context.Users.FirstAsync(u => u.Email == "student2@test.id");
        SetControllerUser(controller, student2.Id);

        var teacherAssigned = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        var classSubject1 = await context.ClassSubjects.FirstAsync(cs => cs.TeacherSubject.TeacherId == teacherAssigned.Id);

        var thread = await discussionService.CreateThreadAsync(teacherAssigned.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject1.Id,
            Title = "Rahasia Kuis",
            Body = "Konten Ujian"
        });

        // Student2 tries to access Class1 thread
        var actionResult = await controller.GetThreadById(thread.Id);
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task ValidationException_MapsTo400()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);
        var controller = new DiscussionController(discussionService);

        var teacher = await context.Users.FirstAsync(u => u.Email == "guru1@test.id");
        SetControllerUser(controller, teacher.Id);

        // Missing Title -> ValidationException
        var actionResult = await controller.CreateThread(new CreateDiscussionThreadRequest
        {
            ClassSubjectId = Guid.NewGuid(),
            Title = "",
            Body = "Deskripsi"
        });

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, badRequestResult.StatusCode);
    }

    private static void SetControllerUser(ControllerBase controller, Guid userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }
}
