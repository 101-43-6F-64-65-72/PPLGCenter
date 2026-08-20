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

public class StudentCommunitySecurityTests
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
        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Admin Center",
            Email = "admin@test.id",
            Role = UserRole.Admin,
            IsActive = true
        };

        var teacher = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Guru PPLG",
            Email = "guru@test.id",
            Role = UserRole.Teacher,
            IsActive = true
        };

        var student1 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siswa Satu",
            Email = "siswa1@test.id",
            Role = UserRole.Student,
            NIS = "1001",
            IsActive = true
        };

        var student2 = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Siswa Dua",
            Email = "siswa2@test.id",
            Role = UserRole.Student,
            NIS = "1002",
            IsActive = true
        };

        context.Users.AddRange(admin, teacher, student1, student2);
        context.SaveChanges();
    }

    [Fact]
    public async Task Test_01_SignedUrl_UnauthorizedUser_Returns403()
    {
        var context = GetInMemoryDbContext();
        var mockEnv = new MockEnvironment();
        var mockConfig = new MockConfig();
        var mockStorage = new MockFileStorageService();
        var mockCloudinary = new MockCloudinaryService();

        var controller = new UploadController(mockEnv, mockConfig, mockStorage, mockCloudinary, context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");
        SetControllerUser(controller, student1.Id, "Student");

        // Try to generate signed URL for path not owned by student1
        var result = await controller.GetSignedUrl("proposals/confidential_proposal_admin.pdf");

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task Test_02_SignedUrl_AuthorizedOwner_Returns200()
    {
        var context = GetInMemoryDbContext();
        var mockEnv = new MockEnvironment();
        var mockConfig = new MockConfig();
        var mockStorage = new MockFileStorageService();
        var mockCloudinary = new MockCloudinaryService();

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");

        // Add a proposal owned by student1
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal Kegiatan",
            FileUrl = "proposals/siswa1_proposal.pdf",
            SubmittedByUserId = student1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Proposals.Add(proposal);
        await context.SaveChangesAsync();

        var controller = new UploadController(mockEnv, mockConfig, mockStorage, mockCloudinary, context);
        SetControllerUser(controller, student1.Id, "Student");

        var result = await controller.GetSignedUrl("proposals/siswa1_proposal.pdf");
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
    }

    [Fact]
    public async Task Test_03_GroupMessage_EnvelopeRecipientNotMember_ThrowsUnauthorized()
    {
        var context = GetInMemoryDbContext();
        var groupService = new CommunityGroupService(context);
        var groupMsgService = new GroupMessageService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@test.id");

        // Create group with student1 as owner
        var group = await groupService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = "Klub Robotik",
            Description = "Komunitas STEM"
        }, student1.Id);

        // Try to send group message including student2 (who is NOT a group member) in recipient envelopes
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await groupMsgService.SendMessageAsync(new SendGroupMessageRequest
            {
                GroupId = group.Id,
                EncryptedPayloadBase64 = "SGVsbG8=",
                Nonce = "MTIzNDU2Nzg5MDEy",
                RecipientEnvelopes = new List<RecipientEnvelopeRequest>
                {
                    new RecipientEnvelopeRequest
                    {
                        RecipientUserId = student2.Id, // Non-member recipient!
                        EncryptedKeyPackage = "S2V5UGFja2FnZQ=="
                    }
                }
            }, student1.Id);
        });
    }

    [Fact]
    public async Task Test_04_GroupMessage_ActiveMembersEnvelopes_Succeeds()
    {
        var context = GetInMemoryDbContext();
        var groupService = new CommunityGroupService(context);
        var groupMsgService = new GroupMessageService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@test.id");

        var group = await groupService.CreateGroupAsync(new CreateCommunityGroupRequest
        {
            Name = "Klub Koding",
            Description = "Komunitas Software"
        }, student1.Id);

        // Student2 joins group and is accepted
        await groupService.JoinGroupRequestAsync(group.Id, student2.Id);
        await groupService.ManageMemberAsync(group.Id, student2.Id, new ManageMemberRequest
        {
            Role = CommunityMemberRole.Member,
            Status = CommunityMemberStatus.Accepted
        }, student1.Id);

        // Send message with valid envelopes for both student1 and student2
        var response = await groupMsgService.SendMessageAsync(new SendGroupMessageRequest
        {
            GroupId = group.Id,
            EncryptedPayloadBase64 = "SGVsbG8=",
            Nonce = "MTIzNDU2Nzg5MDEy",
            RecipientEnvelopes = new List<RecipientEnvelopeRequest>
            {
                new RecipientEnvelopeRequest { RecipientUserId = student1.Id, EncryptedKeyPackage = "Key1" },
                new RecipientEnvelopeRequest { RecipientUserId = student2.Id, EncryptedKeyPackage = "Key2" }
            }
        }, student1.Id);

        Assert.NotNull(response);
        Assert.Equal(2, response.Envelopes.Count);
    }

    [Fact]
    public async Task Test_05_MessageAttachment_ProhibitedExtension_ThrowsValidationException()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");

        var conv = await messageService.GetOrCreateDirectConversationAsync(teacher.Id, student1.Id);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await messageService.SendMessageAsync(teacher.Id, new SendMessageRequest
            {
                ConversationId = conv.Id,
                Text = "Coba Kirim Malware",
                MessageType = MessageType.File,
                Attachments = new List<CreateMessageAttachmentRequest>
                {
                    new CreateMessageAttachmentRequest
                    {
                        FileName = "malware.exe",
                        Url = "/uploads/malware.exe",
                        FileSize = 1024,
                        ContentType = "application/x-msdownload"
                    }
                }
            });
        });
    }

    [Fact]
    public async Task Test_06_MessageAttachment_PathTraversalFilename_ThrowsValidationException()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");

        var conv = await messageService.GetOrCreateDirectConversationAsync(teacher.Id, student1.Id);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await messageService.SendMessageAsync(teacher.Id, new SendMessageRequest
            {
                ConversationId = conv.Id,
                Text = "Coba Path Traversal",
                MessageType = MessageType.File,
                Attachments = new List<CreateMessageAttachmentRequest>
                {
                    new CreateMessageAttachmentRequest
                    {
                        FileName = "../../../etc/passwd",
                        Url = "/uploads/passwd.txt",
                        FileSize = 512,
                        ContentType = "text/plain"
                    }
                }
            });
        });
    }

    [Fact]
    public async Task Test_07_GetTotalUnreadMessagesCount_CalculatesAccurately()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");

        var conv = await messageService.GetOrCreateDirectConversationAsync(teacher.Id, student1.Id);

        // Teacher sends 2 messages to student1
        await messageService.SendMessageAsync(teacher.Id, new SendMessageRequest { ConversationId = conv.Id, Text = "Pesan 1" });
        await messageService.SendMessageAsync(teacher.Id, new SendMessageRequest { ConversationId = conv.Id, Text = "Pesan 2" });

        var unreadCount = await messageService.GetTotalUnreadMessagesCountAsync(student1.Id);
        Assert.Equal(2, unreadCount);
    }

    [Fact]
    public async Task Test_08_DirectConversation_DisallowedRoles_ThrowsUniformValidationException()
    {
        var context = GetInMemoryDbContext();
        var authService = new CommunicationAuthorizationService(context);
        var notificationService = new NotificationService(context);
        var messageService = new MessageService(context, authService, notificationService);

        var student1 = await context.Users.FirstAsync(u => u.Email == "siswa1@test.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "siswa2@test.id");

        // Student <-> Student direct conversation is disallowed by default
        var ex = await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await messageService.GetOrCreateDirectConversationAsync(student1.Id, student2.Id);
        });

        Assert.Equal("Kebijakan sistem melarang percakapan langsung antar pengguna ini.", ex.Message);
    }

    private static void SetControllerUser(ControllerBase controller, Guid userId, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    private class MockEnvironment : Microsoft.AspNetCore.Hosting.IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = "wwwroot";
        public Microsoft.Extensions.FileProviders.IFileProvider WebRootFileProvider { get; set; } = null!;
        public string ContentRootPath { get; set; } = "ContentRoot";
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "StudentCenter.Api";
    }

    private class MockConfig : Microsoft.Extensions.Configuration.IConfiguration
    {
        public string? this[string key] { get => null; set { } }
        public Microsoft.Extensions.Configuration.IConfigurationSection GetSection(string key) => throw new NotImplementedException();
        public IEnumerable<Microsoft.Extensions.Configuration.IConfigurationSection> GetChildren() => throw new NotImplementedException();
        public Microsoft.Extensions.Primitives.IChangeToken GetReloadToken() => throw new NotImplementedException();
    }

    private class MockFileStorageService : Application.Interfaces.IFileStorageService
    {
        public bool IsConfigured => true;
        public Task<string> UploadPdfAsync(Stream fileStream, string fileName, string contentType, string folder = "documents", CancellationToken cancellationToken = default) => Task.FromResult($"https://supabase.co/{folder}/{fileName}");
        public Task<string> CreateSignedUrlAsync(string? filePathOrUrl, TimeSpan? expiresIn = null, CancellationToken cancellationToken = default) => Task.FromResult($"https://supabase.co/signed/{filePathOrUrl}");
        public Task DeleteAsync(string? filePathOrUrl, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private class MockCloudinaryService : Application.Interfaces.ICloudinaryService
    {
        public bool IsConfigured => false;
        public Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType, string folder = "student-center", CancellationToken cancellationToken = default) => Task.FromResult("");
        public Task<bool> DeleteImageAsync(string? imageUrlOrPublicId, CancellationToken cancellationToken = default) => Task.FromResult(true);
    }
}
