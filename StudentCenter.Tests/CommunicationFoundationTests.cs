using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class CommunicationFoundationTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedBaseData(context);
        return context;
    }

    private void SeedBaseData(AppDbContext context)
    {
        var schoolClass = new SchoolClass { Id = Guid.NewGuid(), Name = "XII RPL 1", Grade = "XII", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.SchoolClasses.Add(schoolClass);

        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Pembina", Email = "guru@test.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1@test.id", Role = UserRole.Student, ClassId = schoolClass.Id, NIS = "1001", IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2", Email = "s2@test.id", Role = UserRole.Student, ClassId = schoolClass.Id, NIS = "1002", IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Utama", Email = "admin@test.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacher, student1, student2, admin);

        var subject = new Subject { Id = Guid.NewGuid(), Code = "PWPB", Name = "Pemrograman Web", IsActive = true };
        context.Subjects.Add(subject);

        var teacherSubject = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher.Id, SubjectId = subject.Id, CreatedAt = DateTime.UtcNow };
        context.TeacherSubjects.Add(teacherSubject);

        var classSubject = new ClassSubject { Id = Guid.NewGuid(), ClassId = schoolClass.Id, TeacherSubjectId = teacherSubject.Id, CreatedAt = DateTime.UtcNow };
        context.ClassSubjects.Add(classSubject);

        var announcement = new Announcement { Id = Guid.NewGuid(), Title = "Pengumuman Ujian", Content = "Jadwal Ujian Rapor", Category = "Akademik", CreatedByUserId = admin.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.Announcements.Add(announcement);

        context.SaveChanges();
    }

    [Fact]
    public async Task DiscussionService_CreateThreadAndReplies_AtomicCountersAndUpdate()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var classSubject = await context.ClassSubjects.FirstAsync();
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);

        var thread = await discussionService.CreateThreadAsync(teacher.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject.Id,
            Title = "Diskusi Proyek Web",
            Body = "Mari bahas rancangan database."
        });

        Assert.NotNull(thread);
        Assert.Equal(0, thread.ReplyCount);

        var reply1 = await discussionService.CreateReplyAsync(teacher.Id, new CreateDiscussionReplyRequest
        {
            ThreadId = thread.Id,
            Body = "Silakan dicek lampiran.",
            AttachmentFileName = "db_schema.png",
            AttachmentUrl = "https://test.url/db_schema.png",
            AttachmentFileSize = 2048,
            StorageProvider = "Local"
        });

        Assert.NotNull(reply1);

        var updatedThread = await discussionService.GetThreadByIdAsync(thread.Id);
        Assert.Equal(1, updatedThread.ReplyCount);
        Assert.NotNull(updatedThread.LastReplyAt);
    }

    [Fact]
    public async Task DiscussionService_LockedThread_PreventsReplies()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var discussionService = new DiscussionService(context, authService, notificationService);

        var classSubject = await context.ClassSubjects.FirstAsync();
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);

        var thread = await discussionService.CreateThreadAsync(teacher.Id, new CreateDiscussionThreadRequest
        {
            ClassSubjectId = classSubject.Id,
            Title = "Pengumuman Diskusi",
            Body = "Diskusi ini akan dikunci."
        });

        await discussionService.ToggleLockThreadAsync(teacher.Id, thread.Id);

        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(async () =>
        {
            await discussionService.CreateReplyAsync(teacher.Id, new CreateDiscussionReplyRequest
            {
                ThreadId = thread.Id,
                Body = "Coba membalas."
            });
        });
    }

    [Fact]
    public async Task MessageService_RolePolicy_AllowsTeacherStudent_BlocksStudentStudent()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student1 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1001");
        var student2 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1002");

        // Teacher <-> Student allowed
        var conv1 = await messageService.GetOrCreateDirectConversationAsync(teacher.Id, student1.Id, "Halo Siswa 1");
        Assert.NotNull(conv1);

        // Student <-> Student blocked
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(async () =>
        {
            await messageService.GetOrCreateDirectConversationAsync(student1.Id, student2.Id, "Halo sesama siswa");
        });
    }

    [Fact]
    public async Task MessageService_SendMessageWithAttachments_UpdatesUnreadAndActivity()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student = await context.Users.FirstAsync(u => u.Role == UserRole.Student);

        var conv = await messageService.GetOrCreateDirectConversationAsync(teacher.Id, student.Id);

        var msg = await messageService.SendMessageAsync(teacher.Id, new SendMessageRequest
        {
            ConversationId = conv.Id,
            Text = "Berikut berkas kuis.",
            MessageType = MessageType.File,
            Attachments = new List<CreateMessageAttachmentRequest>
            {
                new CreateMessageAttachmentRequest
                {
                    FileName = "kuis.pdf",
                    ContentType = "application/pdf",
                    FileSize = 10240,
                    StorageProvider = "Local",
                    Url = "https://test.url/kuis.pdf"
                }
            }
        });

        Assert.NotNull(msg);
        Assert.Single(msg.Attachments);
        Assert.Equal("kuis.pdf", msg.Attachments[0].FileName);

        int unreadForStudent = await messageService.GetTotalUnreadMessagesCountAsync(student.Id);
        Assert.Equal(1, unreadForStudent);

        await messageService.MarkConversationAsReadAsync(student.Id, conv.Id);
        int unreadAfterRead = await messageService.GetTotalUnreadMessagesCountAsync(student.Id);
        Assert.Equal(0, unreadAfterRead);
    }

    [Fact]
    public async Task SearchService_PrivateMessages_ScopesToConversationMembersOnly()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);
        var searchService = new SearchService(context);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student1 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1001");
        var student2 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1002");

        var conv = await messageService.GetOrCreateDirectConversationAsync(teacher.Id, student1.Id);
        await messageService.SendMessageAsync(teacher.Id, new SendMessageRequest
        {
            ConversationId = conv.Id,
            Text = "RahasiaNilaiUtama"
        });

        // Searcher (Student1) can see the message in search
        var searchRes1 = await searchService.SearchAsync("RahasiaNilaiUtama", 1, 10, student1.Id, "Student");
        Assert.Single(searchRes1.Messages);

        // Non-member Searcher (Student2) CANNOT see the private message
        var searchRes2 = await searchService.SearchAsync("RahasiaNilaiUtama", 1, 10, student2.Id, "Student");
        Assert.Empty(searchRes2.Messages);
    }
}
