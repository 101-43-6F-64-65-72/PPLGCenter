using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class ClientModulesTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedData(context);
        return context;
    }

    private void SeedData(AppDbContext context)
    {
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Test", Email = "admin@test.id", Role = UserRole.Admin, IsActive = true };
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Test", Email = "guru@test.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1@test.id", Role = UserRole.Student, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2", Email = "s2@test.id", Role = UserRole.Student, IsActive = true };

        context.Users.AddRange(admin, teacher, student1, student2);
        context.SaveChanges();
    }

    [Fact]
    public async Task Facility_CRUD_AndFilter_Succeeds()
    {
        var context = GetInMemoryDbContext();
        var facilityService = new FacilityService(context, NullLogger<FacilityService>.Instance);

        // Create
        var created = await facilityService.CreateFacilityAsync(new CreateFacilityRequest
        {
            Name = "Lab Komputer Utama",
            Category = "Laboratorium",
            Description = "Lab untuk praktek coding",
            Location = "Lantai 2",
            Capacity = 36,
            IsActive = true
        });

        Assert.NotNull(created);
        Assert.Equal("Lab Komputer Utama", created.Name);

        // Update
        var updated = await facilityService.UpdateFacilityAsync(created.Id, new UpdateFacilityRequest
        {
            Name = "Lab Komputer Updated",
            Category = "Laboratorium",
            Description = "Lab updated",
            Location = "Lantai 2 B",
            Capacity = 40,
            IsActive = true
        });

        Assert.Equal("Lab Komputer Updated", updated?.Name);
        Assert.Equal(40, updated?.Capacity);

        // List
        var list = await facilityService.GetFacilitiesAsync(1, 10, true);
        Assert.Single(list.Items);

        // Delete
        var deleted = await facilityService.DeleteFacilityAsync(created.Id);
        Assert.True(deleted);
    }

    [Fact]
    public async Task Proposal_Lifecycle_SubmitReviewApproveRevision_NotificationsTriggered()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var proposalService = new ProposalService(context, notificationService);

        var student = await context.Users.FirstAsync(u => u.Role == UserRole.Student);
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);

        // Submit Proposal
        var proposal = await proposalService.CreateProposalAsync(new CreateProposalRequest
        {
            Title = "Proposal Pentas Seni 2026",
            Description = "Pengajuan dana dan lokasi pensi tahunan.",
            Category = "Kegiatan Siswa",
            FileUrl = "https://test.url/proposal_pensi.pdf"
        }, student.Id);

        Assert.NotNull(proposal);
        Assert.Equal(ProposalStatus.Pending, proposal.Status);

        // Edit before review
        var updated = await proposalService.UpdateProposalAsync(proposal.Id, new UpdateProposalRequest
        {
            Title = "Proposal Pentas Seni 2026 (Revisi Mandiri)",
            Description = "Deskripsi baru proposal pensi.",
            Category = "Kegiatan Siswa",
            FileUrl = "https://test.url/proposal_pensi_v2.pdf"
        }, student.Id);

        Assert.Equal("Proposal Pentas Seni 2026 (Revisi Mandiri)", updated?.Title);

        // Review -> Request Revision
        var revisionRes = await proposalService.ReviewProposalAsync(proposal.Id, new ReviewProposalRequest
        {
            Status = ProposalStatus.RevisionRequired,
            RejectionReason = "Harap tambahkan rincian anggaran."
        }, teacher.Id);

        Assert.Equal(ProposalStatus.RevisionRequired, revisionRes?.Status);

        // Review -> Approve
        var approvedRes = await proposalService.ReviewProposalAsync(proposal.Id, new ReviewProposalRequest
        {
            Status = ProposalStatus.Approved,
            RejectionReason = "Lengkap dan disetujui."
        }, teacher.Id);

        Assert.Equal(ProposalStatus.Approved, approvedRes?.Status);
    }

    [Fact]
    public async Task Extracurricular_Registration_DuplicateAndCapacityLimitEnforced()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var eksculService = new ExtracurricularService(context, notificationService);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student1 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.FullName == "Siswa 1");
        var student2 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.FullName == "Siswa 2");

        // Create Ekscul with MaxMembers = 1
        var ekscul = await eksculService.CreateExtracurricularAsync(new CreateExtracurricularRequest
        {
            Name = "Paskibra",
            Description = "Pasukan Pengibar Bendera",
            Category = "Baris Berbaris",
            MaxMembers = 1,
            ScheduleDay = "Sabtu",
            ScheduleTime = "08:00 - 11:00",
            Location = "Lapangan Utama"
        }, teacher.Id);

        // Student 1 joins
        var join1 = await eksculService.JoinExtracurricularAsync(ekscul.Id, student1.Id);
        Assert.NotNull(join1);

        // Student 1 tries to join again -> Duplicate error
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await eksculService.JoinExtracurricularAsync(ekscul.Id, student1.Id);
        });

        // Student 2 tries to join -> Capacity Limit error
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await eksculService.JoinExtracurricularAsync(ekscul.Id, student2.Id);
        });
    }

    [Fact]
    public async Task DashboardAggregation_And_Search_IncludesPhase20Modules()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var facilityService = new FacilityService(context, NullLogger<FacilityService>.Instance);
        var eksculService = new ExtracurricularService(context, notificationService);
        var proposalService = new ProposalService(context, notificationService);
        var searchService = new SearchService(context);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var student = await context.Users.FirstAsync(u => u.Role == UserRole.Student);

        await facilityService.CreateFacilityAsync(new CreateFacilityRequest { Name = "Aula Utama Sekolah", Location = "Gedung A", Capacity = 500 });
        await eksculService.CreateExtracurricularAsync(new CreateExtracurricularRequest { Name = "Robotika", Category = "Sains", MaxMembers = 20 }, admin.Id);
        await proposalService.CreateProposalAsync(new CreateProposalRequest { Title = "Proposal Robotika Nasional", Description = "Lomba robotika tingkat provinsi.", FileUrl = "http://test/file.pdf" }, student.Id);

        var searchRes = await searchService.SearchAsync("Robotika", 1, 10, student.Id, "Student");
        Assert.Single(searchRes.Extracurriculars);
        Assert.Single(searchRes.Proposals);
    }
}
