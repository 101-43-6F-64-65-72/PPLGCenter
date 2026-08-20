using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

public class Phase10DataBackfillAuditTests
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
        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru Pembina Robotics", Email = "g1@pplg.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru Pembina Web", Email = "g2@pplg.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Student 1", Email = "s1@pplg.id", Role = UserRole.Student, NIS = "2001", IsActive = true };

        context.Users.AddRange(teacher1, teacher2, student1);

        var ekskul1 = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "Robotics Club",
            Description = "Club Robotics PPLG",
            Category = "Teknologi",
            SupervisorTeacherId = teacher1.Id,
            IsActive = true
        };

        var ekskul2 = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "Web Development Club",
            Description = "Club Web PPLG",
            Category = "Teknologi",
            SupervisorTeacherId = teacher2.Id,
            IsActive = true
        };

        context.Extracurriculars.AddRange(ekskul1, ekskul2);

        // 1. Exact Match Proposal
        var p1 = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Pengajuan Dana Workshop Robotics",
            Description = "Workshop Robotics 2026",
            Category = "Robotics Club",
            FileUrl = "https://cdn.pplg.id/p1.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = student1.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 2. Normalized Match Proposal (whitespace / casing)
        var p2 = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Pengajuan Lomba Web",
            Description = "Lomba Web National",
            Category = "  web development club ",
            FileUrl = "https://cdn.pplg.id/p2.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = student1.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Unmatched General Student Proposal
        var p3 = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Kunjungan Industri XII PPLG",
            Description = "Kunjungan ke PT Teknologi Nusantara",
            Category = "Kegiatan Kelas / Akademik",
            FileUrl = "https://cdn.pplg.id/p3.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = student1.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 4. Already Linked Proposal
        var p4 = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal Linked",
            Description = "Already linked to Robotics",
            Category = "Robotics Club",
            ExtracurricularId = ekskul1.Id,
            FileUrl = "https://cdn.pplg.id/p4.pdf",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = student1.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Proposals.AddRange(p1, p2, p3, p4);

        // Facilities Data
        var f1 = new Facility
        {
            Id = Guid.NewGuid(),
            Name = "Lab PPLG 1",
            Location = "Lantai 2",
            Capacity = 36,
            ManagerTeacherId = teacher1.Id,
            IsActive = true
        };
        context.Facilities.Add(f1);

        context.FacilityManagers.Add(new FacilityManager
        {
            Id = Guid.NewGuid(),
            FacilityId = f1.Id,
            ManagerUserId = teacher1.Id,
            AssignedAt = DateTime.UtcNow
        });

        context.SaveChanges();
    }

    [Fact]
    public async Task DryRun_BackfillAlgorithm_ClassifiesAllProposalsDeterministically()
    {
        var context = GetInMemoryDbContext();

        var proposals = await context.Proposals.AsNoTracking().ToListAsync();
        var ekskuls = await context.Extracurriculars.AsNoTracking().ToListAsync();

        int matchedExact = 0;
        int matchedNormalized = 0;
        int alreadyLinked = 0;
        int unmatched = 0;
        int ambiguous = 0;

        foreach (var p in proposals)
        {
            if (p.ExtracurricularId.HasValue)
            {
                alreadyLinked++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(p.Category))
            {
                unmatched++;
                continue;
            }

            var categoryClean = p.Category.Trim();
            var matches = ekskuls.Where(e => string.Equals(e.Name.Trim(), categoryClean, StringComparison.OrdinalIgnoreCase)).ToList();

            if (matches.Count == 1)
            {
                var match = matches.First();
                if (match.Name == p.Category)
                    matchedExact++;
                else
                    matchedNormalized++;
            }
            else if (matches.Count > 1)
            {
                ambiguous++;
            }
            else
            {
                unmatched++;
            }
        }

        Assert.Equal(1, alreadyLinked);
        Assert.Equal(1, matchedExact);
        Assert.Equal(1, matchedNormalized);
        Assert.Equal(1, unmatched);
        Assert.Equal(0, ambiguous);
    }

    [Fact]
    public async Task AmbiguityDetection_DetectsDuplicateEkskulNames()
    {
        var context = GetInMemoryDbContext();

        // Add duplicate ekskul name with different ID to simulate ambiguity
        context.Extracurriculars.Add(new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "Robotics Club",
            Category = "Teknologi 2",
            IsActive = true
        });
        await context.SaveChangesAsync();

        var proposals = await context.Proposals.AsNoTracking().Where(p => !p.ExtracurricularId.HasValue).ToListAsync();
        var ekskuls = await context.Extracurriculars.AsNoTracking().ToListAsync();

        int ambiguousCount = 0;
        foreach (var p in proposals)
        {
            if (string.IsNullOrWhiteSpace(p.Category)) continue;

            var categoryClean = p.Category.Trim();
            var matches = ekskuls.Where(e => string.Equals(e.Name.Trim(), categoryClean, StringComparison.OrdinalIgnoreCase)).ToList();

            if (matches.Count > 1)
            {
                ambiguousCount++;
            }
        }

        Assert.True(ambiguousCount > 0, "Ambiguity detector should flag duplicate extracurricular name matches.");
    }

    [Fact]
    public async Task FacilityManager_ConsistencyCheck_VerifiesJoinAndScalarSync()
    {
        var context = GetInMemoryDbContext();

        var facilities = await context.Facilities.AsNoTracking().ToListAsync();
        var managers = await context.FacilityManagers.AsNoTracking().ToListAsync();

        int consistentCount = 0;
        foreach (var f in facilities)
        {
            var joinManagers = managers.Where(m => m.FacilityId == f.Id).Select(m => m.ManagerUserId).ToList();
            if (f.ManagerTeacherId.HasValue && joinManagers.Contains(f.ManagerTeacherId.Value))
            {
                consistentCount++;
            }
        }

        Assert.Equal(1, consistentCount);
    }
}
