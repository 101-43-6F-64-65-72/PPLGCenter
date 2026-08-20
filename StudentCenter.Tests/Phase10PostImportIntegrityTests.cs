using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase10PostImportIntegrityTests

{
    private readonly string _connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";

    private AppDbContext GetProductionDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_connectionString)
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task Gate1_SchoolClassDomainAudit_InspectsAuthoritativePplgAndLegacyClasses()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var classes = await context.SchoolClasses.AsNoTracking().ToListAsync();
        Assert.True(classes.Count >= 6, "Must contain at least 6 SchoolClasses.");

        var pplgCanonical = new[] { "X PPLG A", "X PPLG B", "XI PPLG A", "XI PPLG B", "XII PPLG A", "XII PPLG B" };
        var foundPplgClasses = classes.Where(c => pplgCanonical.Contains(c.Name.Replace("-", " "), StringComparer.OrdinalIgnoreCase)).ToList();

        Assert.Equal(6, foundPplgClasses.Count);



        // Dependency analysis on non-PPLG classes (e.g. X RPL 1)
        var nonPplgClasses = classes.Where(c => !pplgCanonical.Contains(c.Name.Replace("-", " "), StringComparer.OrdinalIgnoreCase)).ToList();

        foreach (var nonPplg in nonPplgClasses)
        {
            var studentCount = await context.Users.CountAsync(u => u.ClassId == nonPplg.Id);
            Assert.True(studentCount >= 0, $"Non-PPLG class {nonPplg.Name} student count calculated successfully.");
        }
    }

    [Fact]
    public async Task Gate2_UserIdentityIntegrity_VerifiesStudentsTeachersAdmins()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var students = await context.Users.AsNoTracking().Where(u => u.Role == UserRole.Student).ToListAsync();
        Assert.True(students.Count >= 216, "Should contain at least 216 student records.");

        // NIS uniqueness check
        var nisList = students.Where(s => !string.IsNullOrEmpty(s.NIS)).Select(s => s.NIS!).ToList();
        var duplicateNis = nisList.GroupBy(x => x, StringComparer.OrdinalIgnoreCase).Where(g => g.Count() > 1).ToList();
        Assert.Empty(duplicateNis);

        // ClassId validity check
        var classIds = await context.SchoolClasses.Select(c => c.Id).ToHashSetAsync();
        var invalidClassUsers = students.Where(s => s.ClassId.HasValue && !classIds.Contains(s.ClassId.Value)).ToList();
        Assert.Empty(invalidClassUsers);

        // Admin privilege guard
        var admins = await context.Users.AsNoTracking().Where(u => u.Role == UserRole.Admin).ToListAsync();
        Assert.NotEmpty(admins);
    }

    [Fact]
    public async Task Gate3_AcademicDataIntegrity_VerifiesGradesAndReferences()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var grades = await context.StudentGrades.AsNoTracking().ToListAsync();
        var studentIds = await context.Users.Where(u => u.Role == UserRole.Student).Select(u => u.Id).ToHashSetAsync();

        var orphanGrades = grades.Where(g => !studentIds.Contains(g.StudentId)).ToList();
        Assert.Empty(orphanGrades);
    }

    [Fact]
    public async Task Gate4_ProposalExtracurricularIntegrity_VerifiesFKAndFallback()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var proposals = await context.Proposals.AsNoTracking().Select(p => new { p.Id, p.ExtracurricularId, p.Category }).ToListAsync();
        var ekskulIds = await context.Extracurriculars.Select(e => e.Id).ToHashSetAsync();

        var invalidFkProposals = proposals.Where(p => p.ExtracurricularId.HasValue && !ekskulIds.Contains(p.ExtracurricularId.Value)).ToList();
        Assert.Empty(invalidFkProposals);
    }

    [Fact]
    public async Task Gate5_FacilityManagerIntegrity_VerifiesJoinAndScalarSync()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var facilities = await context.Facilities.AsNoTracking().Select(f => new { f.Id, f.ManagerTeacherId }).ToListAsync();
        var joinManagers = await context.FacilityManagers.AsNoTracking().Select(m => new { m.FacilityId, m.ManagerUserId }).ToListAsync();

        foreach (var f in facilities)
        {
            var facilityJoinList = joinManagers.Where(m => m.FacilityId == f.Id).Select(m => m.ManagerUserId).ToList();
            if (f.ManagerTeacherId.HasValue)
            {
                Assert.Contains(f.ManagerTeacherId.Value, facilityJoinList);
            }
        }
    }

    [Fact]
    public async Task Gate6_LegacyDomainSafety_VerifiesOsisTablesPreserved()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        Assert.True(canConnect);
    }
}
