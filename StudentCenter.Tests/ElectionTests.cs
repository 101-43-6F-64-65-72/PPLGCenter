using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class ElectionTests
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
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Pemilu", Email = "admin@elec.id", Role = UserRole.Admin, IsActive = true };
        var cand1User = new User { Id = Guid.NewGuid(), FullName = "Kandidat 1", Email = "c1@elec.id", Role = UserRole.Student, IsActive = true };
        var cand2User = new User { Id = Guid.NewGuid(), FullName = "Kandidat 2", Email = "c2@elec.id", Role = UserRole.Student, IsActive = true };
        var voter1 = new User { Id = Guid.NewGuid(), FullName = "Pemilih 1", Email = "v1@elec.id", Role = UserRole.Student, IsActive = true };

        context.Users.AddRange(admin, cand1User, cand2User, voter1);
        context.SaveChanges();
    }

    [Fact]
    public async Task Election_FullLifecycle_DuplicateVotePrevention_ResultCalculation()
    {
        var context = GetInMemoryDbContext();
        var notificationService = new NotificationService(context);
        var electionService = new ElectionService(context, notificationService);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var cand1 = await context.Users.FirstAsync(u => u.FullName == "Kandidat 1");
        var cand2 = await context.Users.FirstAsync(u => u.FullName == "Kandidat 2");
        var voter1 = await context.Users.FirstAsync(u => u.FullName == "Pemilih 1");

        // 1. Create Election
        var election = await electionService.CreateElectionAsync(new CreateElectionRequest
        {
            Title = "Pemilihan Ketua OSIS 2026",
            Description = "Pemilihan demokratis Ketua dan Wakil Ketua OSIS",
            StartDate = DateTime.UtcNow.AddDays(-1),
            EndDate = DateTime.UtcNow.AddDays(2)
        }, admin.Id);

        Assert.NotNull(election);
        Assert.Equal(ElectionStatus.Draft, election.Status);

        // 2. Add Candidates
        var candidate1Res = await electionService.AddCandidateAsync(election.Id, new CreateCandidateRequest
        {
            StudentId = cand1.Id,
            Vision = "Menjadikan sekolah lebih maju",
            Mission = "Mengadakan event rutin & apresiasi karya siswa",
            CandidateNumber = 1
        }, admin.Id, "Admin");

        var candidate2Res = await electionService.AddCandidateAsync(election.Id, new CreateCandidateRequest
        {
            StudentId = cand2.Id,
            Vision = "Digitalisasi kegiatan siswa",
            Mission = "Membangun platform osis digital",
            CandidateNumber = 2
        }, admin.Id, "Admin");

        Assert.NotNull(candidate1Res);
        Assert.NotNull(candidate2Res);

        // 3. Open Election
        var openSuccess = await electionService.OpenElectionAsync(election.Id, admin.Id, "Admin");
        Assert.True(openSuccess);

        // 4. Vote
        var voteSuccess = await electionService.VoteAsync(election.Id, new VoteRequest { CandidateId = candidate1Res.Id }, voter1.Id);
        Assert.True(voteSuccess);

        // 5. Duplicate Vote -> Should Throw InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await electionService.VoteAsync(election.Id, new VoteRequest { CandidateId = candidate2Res.Id }, voter1.Id);
        });

        // 6. Close Election & Publish Result
        await electionService.CloseElectionAsync(election.Id, admin.Id, "Admin");
        await electionService.PublishResultAsync(election.Id, admin.Id, "Admin");

        // 7. Check Results
        var result = await electionService.GetResultAsync(election.Id);
        Assert.NotNull(result);
        Assert.Equal(1, result.TotalVotes);
        Assert.Equal(candidate1Res.Id, result.WinnerCandidate?.Id);
    }
}
