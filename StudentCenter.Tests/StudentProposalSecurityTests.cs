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

public class StudentProposalSecurityTests
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
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin PPLG", Email = "admin@pplg.id", Role = UserRole.Admin, IsActive = true };
        var supervisorTeacher = new User { Id = Guid.NewGuid(), FullName = "Guru Pembina Robotics", Email = "g1@pplg.id", Role = UserRole.Teacher, IsActive = true };
        var unassignedTeacher = new User { Id = Guid.NewGuid(), FullName = "Guru Unassigned", Email = "g2@pplg.id", Role = UserRole.Teacher, IsActive = true };

        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student 1", Email = "s1@pplg.id", Role = UserRole.Student, NIS = "2001", IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Student 2", Email = "s2@pplg.id", Role = UserRole.Student, NIS = "2002", IsActive = true };

        context.Users.AddRange(admin, supervisorTeacher, unassignedTeacher, student1, student2);

        var ekskul = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "Robotics Club",
            Description = "Club Robotics PPLG",
            Category = "Teknologi",
            SupervisorTeacherId = supervisorTeacher.Id,
            SupervisorTeacher = supervisorTeacher,
            IsActive = true
        };
        context.Extracurriculars.Add(ekskul);

        var proposal1 = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "[Robotics Club] Workshop AI & IoT",
            Description = "Pengajuan dana kegiatan workshop AI",
            Category = "Robotics Club",
            FileUrl = "https://cdn.pplg.id/proposals/robotics.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = student1.Id,
            SubmittedByUser = student1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Proposals.Add(proposal1);

        context.SaveChanges();
    }

    private ProposalService CreateService(AppDbContext context)
    {
        var mockNotification = new Mock<INotificationService>();
        var mockStorage = new Mock<IFileStorageService>();
        mockStorage.Setup(s => s.CreateSignedUrlAsync(It.IsAny<string>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string path, TimeSpan? span, CancellationToken ct) => path ?? string.Empty);

        return new ProposalService(context, mockNotification.Object, mockStorage.Object);
    }

    [Fact]
    public async Task Student_CanAccessOwnProposal()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var proposal = await context.Proposals.FirstAsync();

        var result = await proposalService.GetProposalByIdAsync(proposal.Id, student1.Id, "Student");

        Assert.NotNull(result);
        Assert.Equal(proposal.Id, result.Id);
    }

    [Fact]
    public async Task Student_CannotAccessAnotherStudentsProposal()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@pplg.id"); // Not owner
        var proposal = await context.Proposals.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await proposalService.GetProposalByIdAsync(proposal.Id, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Student_CannotModifyAnotherStudentsProposal()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@pplg.id");
        var proposal = await context.Proposals.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await proposalService.UpdateProposalAsync(proposal.Id, new UpdateProposalRequest
            {
                Title = "[Hacked] Modified Title",
                Description = "Modified description text",
                FileUrl = "https://cdn.pplg.id/proposals/robotics.pdf"
            }, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Student_CannotDeleteAnotherStudentsProposal()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@pplg.id");
        var proposal = await context.Proposals.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await proposalService.DeleteProposalAsync(proposal.Id, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task CreateProposal_RejectsEmptyDocumentUrl()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await proposalService.CreateProposalAsync(new CreateProposalRequest
            {
                Title = "Proposal Tanpa Dokumen",
                Description = "Deskripsi proposal tanpa melampirkan file PDF",
                Category = "Robotics Club",
                FileUrl = "" // Empty FileUrl
            }, student1.Id);
        });
    }

    [Fact]
    public async Task Teacher_CannotReviewProposalOutsideSupervisedScope()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var unassignedTeacher = await context.Users.FirstAsync(u => u.Email == "g2@pplg.id");
        var proposal = await context.Proposals.FirstAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await proposalService.ReviewProposalAsync(proposal.Id, new ReviewProposalRequest
            {
                Status = ProposalStatus.Approved,
                RejectionReason = "Disetujui"
            }, unassignedTeacher.Id);
        });
    }

    [Fact]
    public async Task AuthorizedSupervisorTeacher_CanReviewSupervisedProposal()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var supervisorTeacher = await context.Users.FirstAsync(u => u.Email == "g1@pplg.id");
        var proposal = await context.Proposals.FirstAsync();

        var reviewed = await proposalService.ReviewProposalAsync(proposal.Id, new ReviewProposalRequest
        {
            Status = ProposalStatus.Approved,
            RejectionReason = "Disetujui oleh Pembina Robotics"
        }, supervisorTeacher.Id);

        Assert.NotNull(reviewed);
        Assert.Equal(ProposalStatus.Approved, reviewed.Status);
        Assert.Equal("Disetujui oleh Pembina Robotics", reviewed.TeacherComment);
    }

    [Fact]
    public async Task Admin_CanReviewProposalGlobally()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var proposal = await context.Proposals.FirstAsync();

        var reviewed = await proposalService.ReviewProposalAsync(proposal.Id, new ReviewProposalRequest
        {
            Status = ProposalStatus.Approved,
            RejectionReason = "Disetujui oleh Admin System"
        }, admin.Id);

        Assert.NotNull(reviewed);
        Assert.Equal(ProposalStatus.Approved, reviewed.Status);
        Assert.Equal("Disetujui oleh Admin System", reviewed.AdminComment);
    }

    [Fact]
    public async Task UpdateProposal_RejectsModificationOnApprovedProposal()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var proposal = await context.Proposals.FirstAsync();

        // Approve proposal first
        await proposalService.ReviewProposalAsync(proposal.Id, new ReviewProposalRequest
        {
            Status = ProposalStatus.Approved,
            RejectionReason = "Disetujui"
        }, admin.Id);

        // Attempt student edit on approved proposal
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await proposalService.UpdateProposalAsync(proposal.Id, new UpdateProposalRequest
            {
                Title = "Edited After Approval",
                Description = "Attempting to change details after approval",
                FileUrl = "https://cdn.pplg.id/proposals/edited.pdf"
            }, student1.Id, "Student");
        });
    }

    [Fact]
    public async Task CreateProposal_WithExtracurricularId_Success()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var ekskul = await context.Extracurriculars.FirstAsync();

        var created = await proposalService.CreateProposalAsync(new CreateProposalRequest
        {
            Title = "Proposal Workshop Embedded Systems",
            Description = "Workshop hardware microcontrollers dan IoT sensor",
            Category = ekskul.Name,
            ExtracurricularId = ekskul.Id,
            FileUrl = "https://cdn.pplg.id/proposals/embedded.pdf"
        }, student1.Id);

        Assert.NotNull(created);
        Assert.Equal(ekskul.Id, created.ExtracurricularId);
        Assert.Equal(ekskul.Name, created.ExtracurricularName);
    }

    [Fact]
    public async Task CreateProposal_WithInvalidExtracurricularId_ThrowsValidationException()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await proposalService.CreateProposalAsync(new CreateProposalRequest
            {
                Title = "Proposal Invalid Ekskul",
                Description = "Proposal referencing non-existent extracurricular ID",
                ExtracurricularId = Guid.NewGuid(), // Invalid ID
                FileUrl = "https://cdn.pplg.id/proposals/invalid.pdf"
            }, student1.Id);
        });
    }

    [Fact]
    public async Task Teacher_CanAccessSupervisedProposal_ByExtracurricularId()
    {
        var context = GetInMemoryDbContext();
        var proposalService = CreateService(context);

        var supervisorTeacher = await context.Users.FirstAsync(u => u.Email == "g1@pplg.id");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@pplg.id");
        var ekskul = await context.Extracurriculars.FirstAsync();

        var created = await proposalService.CreateProposalAsync(new CreateProposalRequest
        {
            Title = "Proposal Relational FK Test",
            Description = "Proposal linked explicitly via ExtracurricularId FK",
            Category = "Unmatched Generic Category",
            ExtracurricularId = ekskul.Id,
            FileUrl = "https://cdn.pplg.id/proposals/fk.pdf"
        }, student1.Id);

        var retrieved = await proposalService.GetProposalByIdAsync(created.Id, supervisorTeacher.Id, "Teacher");
        Assert.NotNull(retrieved);
        Assert.Equal(created.Id, retrieved.Id);
        Assert.Equal(ekskul.Id, retrieved.ExtracurricularId);
    }
}
