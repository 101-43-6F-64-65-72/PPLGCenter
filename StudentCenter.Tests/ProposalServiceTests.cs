using Moq;
using FluentAssertions;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using StudentCenter.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class ProposalServiceTests
{
    private readonly AppDbContext _context;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<IFileStorageService> _mockFileStorageService;
    private readonly ProposalService _service;

    public ProposalServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _mockNotificationService = new Mock<INotificationService>();
        _mockFileStorageService = new Mock<IFileStorageService>();
        _service = new ProposalService(_context, _mockNotificationService.Object, _mockFileStorageService.Object);
    }

    [Fact]
    public async Task CreateProposalAsync_ValidStudentUser_ReturnsProposal()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Student Member", Email = "osis@test.com", Role = UserRole.Student };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateProposalRequest
        {
            Title = "School Event",
            Description = "Annual sports day",
            FileUrl = "https://example.com/proposal.pdf"
        };

        var result = await _service.CreateProposalAsync(request, userId);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Status.Should().Be(ProposalStatus.Pending);
        result.SubmittedByUserId.Should().Be(userId);
    }

    [Fact]
    public async Task CreateProposalAsync_StudentUser_ReturnsProposal()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Student", Email = "student@test.com", Role = UserRole.Student };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var request = new CreateProposalRequest
        {
            Title = "Event",
            Description = "Description",
            FileUrl = "https://example.com/file.pdf"
        };

        var result = await _service.CreateProposalAsync(request, userId);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);
        result.Status.Should().Be(ProposalStatus.Pending);
        result.SubmittedByUserId.Should().Be(userId);
    }

    [Fact]
    public async Task CreateProposalAsync_NonExistentUser_ThrowsKeyNotFoundException()
    {
        var request = new CreateProposalRequest
        {
            Title = "Event",
            Description = "Description",
            FileUrl = "https://example.com/file.pdf"
        };

        var act = async () => await _service.CreateProposalAsync(request, Guid.NewGuid());

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("User not found.");
    }

    [Fact]
    public async Task GetProposalByIdAsync_ExistingId_ReturnsProposal()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "OSIS", Email = "osis@test.com" };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Event",
            Description = "Description",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var result = await _service.GetProposalByIdAsync(proposal.Id);

        result.Should().NotBeNull();
        result!.Title.Should().Be(proposal.Title);
    }

    [Fact]
    public async Task GetProposalByIdAsync_NonExistingId_ReturnsNull()
    {
        var result = await _service.GetProposalByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateProposalAsync_OwnerUpdatingPendingProposal_Succeeds()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "OSIS", Email = "osis@test.com" };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Original",
            Description = "Original Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var request = new UpdateProposalRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            FileUrl = "https://example.com/new.pdf"
        };

        var result = await _service.UpdateProposalAsync(proposal.Id, request, userId);

        result.Should().NotBeNull();
        result!.Title.Should().Be(request.Title);
        result.Description.Should().Be(request.Description);
    }

    [Fact]
    public async Task UpdateProposalAsync_NonOwnerUpdatingProposal_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "OSIS 1", Email = "osis1@test.com" };
        var user2 = new User { Id = other, FullName = "OSIS 2", Email = "osis2@test.com" };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var request = new UpdateProposalRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            FileUrl = "https://example.com/new.pdf"
        };

        var act = async () => await _service.UpdateProposalAsync(proposal.Id, request, other);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("You can only update your own proposals.");
    }

    [Fact]
    public async Task UpdateProposalAsync_UpdateingNonPendingProposal_ThrowsInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "OSIS", Email = "osis@test.com" };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Approved,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var request = new UpdateProposalRequest
        {
            Title = "Updated",
            Description = "Updated Desc",
            FileUrl = "https://example.com/new.pdf"
        };

        var act = async () => await _service.UpdateProposalAsync(proposal.Id, request, userId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only pending proposals can be edited.");
    }

    [Fact]
    public async Task DeleteProposalAsync_OwnerDeletingPendingProposal_Succeeds()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "OSIS", Email = "osis@test.com" };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var result = await _service.DeleteProposalAsync(proposal.Id, userId);

        result.Should().BeTrue();
        var deleted = await _context.Proposals.FindAsync(proposal.Id);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteProposalAsync_NonOwnerDeletingProposal_ThrowsUnauthorizedException()
    {
        var owner = Guid.NewGuid();
        var other = Guid.NewGuid();
        var user1 = new User { Id = owner, FullName = "OSIS 1", Email = "osis1@test.com" };
        var user2 = new User { Id = other, FullName = "OSIS 2", Email = "osis2@test.com" };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = owner,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var act = async () => await _service.DeleteProposalAsync(proposal.Id, other);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("You can only delete your own proposals.");
    }

    [Fact]
    public async Task ReviewProposalAsync_AdminApprovingProposal_NotifiesSubmitter()
    {
        var submitter = Guid.NewGuid();
        var admin = Guid.NewGuid();
        var user1 = new User { Id = submitter, FullName = "OSIS", Email = "osis@test.com", Role = UserRole.Student };
        var user2 = new User { Id = admin, FullName = "Admin", Email = "admin@test.com", Role = UserRole.Admin };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Event",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = submitter,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var request = new ReviewProposalRequest
        {
            Status = ProposalStatus.Approved,
            RejectionReason = null
        };

        var result = await _service.ReviewProposalAsync(proposal.Id, request, admin);

        result.Should().NotBeNull();
        result!.Status.Should().Be(ProposalStatus.Approved);
        _mockNotificationService.Verify(
            x => x.NotifyUserAsync(
                submitter,
                "Proposal Disetujui",
                It.IsAny<string>(),
                NotificationType.ProposalApproved,
                NotificationPriority.Normal,
                proposal.Id.ToString(),
                NotificationReferenceType.Proposal,
                It.IsAny<string>(),
                null, null, null),
            Times.Once);
    }

    [Fact]
    public async Task ReviewProposalAsync_TeacherReviewingProposal_Succeeds()
    {
        var submitter = Guid.NewGuid();
        var teacher = Guid.NewGuid();
        var user1 = new User { Id = submitter, FullName = "OSIS", Email = "osis@test.com", Role = UserRole.Student };
        var user2 = new User { Id = teacher, FullName = "Teacher", Email = "teacher@test.com", Role = UserRole.Teacher };
        var extra = new Extracurricular { Id = Guid.NewGuid(), Name = "Event", SupervisorTeacherId = teacher, IsActive = true };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Event",
            Description = "Desc",
            Category = "Event",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = submitter,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Extracurriculars.Add(extra);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var request = new ReviewProposalRequest
        {
            Status = ProposalStatus.Rejected,
            RejectionReason = "Not feasible"
        };

        var result = await _service.ReviewProposalAsync(proposal.Id, request, teacher);

        result.Should().NotBeNull();
        result!.Status.Should().Be(ProposalStatus.Rejected);
        result.RejectionReason.Should().Be("Not feasible");
    }

    [Fact]
    public async Task ReviewProposalAsync_StudentReviewingProposal_ThrowsInvalidOperationException()
    {
        var submitter = Guid.NewGuid();
        var student = Guid.NewGuid();
        var user1 = new User { Id = submitter, FullName = "OSIS", Email = "osis@test.com", Role = UserRole.Student };
        var user2 = new User { Id = student, FullName = "Student", Email = "student@test.com", Role = UserRole.Student };
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Event",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = submitter,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Users.AddRange(user1, user2);
        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        var request = new ReviewProposalRequest
        {
            Status = ProposalStatus.Approved,
            RejectionReason = null
        };

        var act = async () => await _service.ReviewProposalAsync(proposal.Id, request, student);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Only Admin and Teacher can review proposals.");
    }

    [Fact]
    public async Task GetProposalsAsync_FilterByStatus_ReturnsMatchingProposals()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "OSIS", Email = "osis@test.com" };
        _context.Users.Add(user);
        _context.Proposals.Add(new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Approved",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Approved,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        _context.Proposals.Add(new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Pending",
            Description = "Desc",
            FileUrl = "https://example.com/file.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        var result = await _service.GetProposalsAsync(1, 10, status: ProposalStatus.Approved);

        result.Items.Should().HaveCount(1);
        result.Items.First().Status.Should().Be(ProposalStatus.Approved);
    }

    [Fact]
    public async Task CreateProposalAsync_FileStorageServiceThrows_SavesToDatabaseAndReturnsProposal()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Resilient Student", Email = "resilient@test.com", Role = UserRole.Student };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockFileStorageService
            .Setup(x => x.CreateSignedUrlAsync(It.IsAny<string>(), null, default))
            .ThrowsAsync(new Exception("Supabase Storage unreachable"));

        var request = new CreateProposalRequest
        {
            Title = "Resilient Proposal",
            Description = "Testing post-save resilience",
            FileUrl = "proposals/test.pdf"
        };

        var result = await _service.CreateProposalAsync(request, userId);

        result.Should().NotBeNull();
        result.Title.Should().Be(request.Title);

        // Verify entity was saved in DbContext
        var savedInDb = await _context.Proposals.FirstOrDefaultAsync(p => p.Title == request.Title);
        savedInDb.Should().NotBeNull();
        savedInDb!.SubmittedByUserId.Should().Be(userId);
    }
}
