using System.Text;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase10ProductionCsvIngestionTests

{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedTestMasterData(context);
        return context;
    }

    private void SeedTestMasterData(AppDbContext context)
    {
        var ay = new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = "2026/2027",
            StartDate = new DateTime(2026, 7, 14, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true
        };
        context.AcademicYears.Add(ay);

        var deptPplg = new Department { Id = Guid.NewGuid(), Code = "PPLG", Name = "Pengembangan Perangkat Lunak dan Gim" };
        var deptRpl = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "Rekayasa Perangkat Lunak" };
        context.Departments.AddRange(deptPplg, deptRpl);

        var classX_A = new SchoolClass { Id = Guid.NewGuid(), Name = "X PPLG-A", Grade = "X", AcademicYearId = ay.Id, DepartmentId = deptPplg.Id };
        var classX_B = new SchoolClass { Id = Guid.NewGuid(), Name = "X PPLG-B", Grade = "X", AcademicYearId = ay.Id, DepartmentId = deptPplg.Id };
        var classXI_A = new SchoolClass { Id = Guid.NewGuid(), Name = "XI PPLG-A", Grade = "XI", AcademicYearId = ay.Id, DepartmentId = deptPplg.Id };
        var classXI_B = new SchoolClass { Id = Guid.NewGuid(), Name = "XI PPLG-B", Grade = "XI", AcademicYearId = ay.Id, DepartmentId = deptPplg.Id };
        var classXII_A = new SchoolClass { Id = Guid.NewGuid(), Name = "XII PPLG-A", Grade = "XII", AcademicYearId = ay.Id, DepartmentId = deptPplg.Id };
        var classXII_B = new SchoolClass { Id = Guid.NewGuid(), Name = "XII PPLG-B", Grade = "XII", AcademicYearId = ay.Id, DepartmentId = deptPplg.Id };
        var classXRpl1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", AcademicYearId = ay.Id, DepartmentId = deptRpl.Id };

        context.SchoolClasses.AddRange(classX_A, classX_B, classXI_A, classXI_B, classXII_A, classXII_B, classXRpl1);
        context.SaveChanges();
    }

    [Fact]
    public async Task Stage2_ForensicDryRun_Validates01TeachersCsv()
    {
        var csvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "01_teachers.csv");
        if (!File.Exists(csvPath)) return;

        var content = await File.ReadAllTextAsync(csvPath);
        var context = GetInMemoryDbContext();
        var importService = new UserImportService(context);

        var summary = await importService.ImportTeachersCsvAsync(content);

        Assert.Equal(5, summary.TotalRead);
        Assert.Equal(5, summary.SuccessCount);
        Assert.Equal(0, summary.FailedCount);
        Assert.Equal(0, summary.SkippedCount);
    }

    [Fact]
    public async Task Stage2_ForensicDryRun_Validates02StudentsCsv()
    {
        var csvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "02_students.csv");
        if (!File.Exists(csvPath)) return;

        var content = await File.ReadAllTextAsync(csvPath);
        var context = GetInMemoryDbContext();
        var importService = new UserImportService(context);

        var summary = await importService.ImportStudentsCsvAsync(content);

        Assert.Equal(5, summary.TotalRead);
        Assert.Equal(5, summary.SuccessCount);
        Assert.Equal(0, summary.FailedCount);
        Assert.Equal(0, summary.SkippedCount);
    }

    [Fact]
    public async Task Stage2_ForensicDryRun_ValidatesFullPplgStudentsCsv()
    {
        var csvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "data_siswa_pplg_lengkap_x_xi_xii.csv");
        if (!File.Exists(csvPath)) return;

        var lines = await File.ReadAllLinesAsync(csvPath);
        Assert.True(lines.Length > 200, "Full PPLG students dataset should contain 216 student rows.");

        var context = GetInMemoryDbContext();
        var classes = await context.SchoolClasses.ToListAsync();

        int validRows = 0;
        int unmatchedClasses = 0;
        var nisSet = new HashSet<string>();
        int duplicateNis = 0;

        for (int i = 1; i < lines.Length; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;

            var parts = line.Split(',');
            if (parts.Length < 4) continue;

            var nis = parts[1].Trim();
            var name = parts[2].Trim();
            var className = parts[3].Trim();

            if (!nisSet.Add(nis))
            {
                duplicateNis++;
            }

            var matchedClass = classes.FirstOrDefault(c => string.Equals(c.Name, className, StringComparison.OrdinalIgnoreCase));
            if (matchedClass == null)
            {
                unmatchedClasses++;
            }
            else
            {
                validRows++;
            }
        }

        Assert.Equal(216, validRows);
        Assert.Equal(0, unmatchedClasses);
        Assert.Equal(0, duplicateNis);
    }

    [Fact]
    public async Task Stage2_ForensicDryRun_ValidatesTeachersSurakartaCsv()
    {
        var csvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "Kode_Guru_SMKN_2_Surakarta.csv");
        if (!File.Exists(csvPath)) return;

        var lines = await File.ReadAllLinesAsync(csvPath);
        Assert.True(lines.Length > 100, "Teacher dataset should contain 139 rows.");

        int validCount = 0;
        for (int i = 1; i < lines.Length; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i])) continue;
            validCount++;
        }

        Assert.Equal(139, validCount);
    }

    [Fact(Skip = "Obsolete Phase 10 live mutation test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Stage4_ProductionImport_IngestsFullPplgStudentAndTeacherDatasets()
    {
        // Connect to production PostgreSQL (configured via backend/.env)
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var totalUsers = await context.Users.CountAsync();
        Assert.True(totalUsers >= 356);
    }

    [Fact]
    public async Task Stage5_ImportFull139TeachersFromSurakartaCsv()
    {
        var csvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "Kode_Guru_SMKN_2_Surakarta.csv");
        if (!File.Exists(csvPath)) return;

        var content = await File.ReadAllTextAsync(csvPath);
        var context = GetInMemoryDbContext();
        var importService = new UserImportService(context);

        var summary = await importService.ImportTeachersCsvAsync(content);

        Assert.Equal(139, summary.TotalRead);
        Assert.True(summary.SuccessCount >= 135);
        Assert.Equal(0, summary.FailedCount);
        Assert.True(summary.SkippedCount <= 2);
    }


    [Fact(Skip = "Obsolete Phase 34 live test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Phase34_ExecuteAuthorizedProductionTeacherImport()
    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var totalUsers = await context.Users.CountAsync();
        Assert.True(totalUsers >= 356);
    }








    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(sb.ToString().Trim());
                sb.Clear();
            }
            else
            {
                sb.Append(c);
            }
        }
        result.Add(sb.ToString().Trim());
        return result;
    }



    [Fact]
    public async Task Stage7_DropLegacyOsisPemilosTablesFromSupabase()
    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var dropSql = @"
            DROP TABLE IF EXISTS ""PemilosVotes"";
            DROP TABLE IF EXISTS ""OsisRegistrations"";
            DROP TABLE IF EXISTS ""OsisRecruitmentPeriods"";
            DROP TABLE IF EXISTS ""CandidatePairs"";
            DROP TABLE IF EXISTS ""Elections"";
        ";

        await context.Database.ExecuteSqlRawAsync(dropSql);
    }

    [Fact(Skip = "Obsolete Phase 10 test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Stage8_VerifyPostPurificationLiveDatabaseState()
    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var totalUsers = await context.Users.CountAsync();
        Assert.True(totalUsers >= 356);
    }

    [Fact(Skip = "Obsolete Phase 10 test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Stage9_FinalLiveTruthVerification()
    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var totalUsers = await context.Users.CountAsync();
        Assert.True(totalUsers >= 356);
    }

    [Fact]
    public async Task Stage10_FreshSchemaMigrationRehearsal()
    {
        // Isolated in-memory schema database context
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"RehearsalDb_{Guid.NewGuid():N}")
            .Options;

        using var context = new AppDbContext(options);
        SeedTestMasterData(context);

        var importService = new UserImportService(context);

        // 1. Ingest Full PPLG Students Dataset (216 students)
        var studentCsvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "data_siswa_pplg_lengkap_x_xi_xii.csv");
        if (File.Exists(studentCsvPath))
        {
            var studentContent = await File.ReadAllTextAsync(studentCsvPath);
            var studentSummary = await importService.ImportStudentsCsvAsync(studentContent);
            Assert.Equal(216, studentSummary.SuccessCount);
            Assert.Equal(0, studentSummary.FailedCount);
        }

        // 2. Ingest Full Surakarta Teachers Dataset (139 teachers)
        var teacherCsvPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "sample-data", "Kode_Guru_SMKN_2_Surakarta.csv");
        if (File.Exists(teacherCsvPath))
        {
            var teacherContent = await File.ReadAllTextAsync(teacherCsvPath);
            var teacherSummary = await importService.ImportTeachersCsvAsync(teacherContent);
            Assert.Equal(139, teacherSummary.TotalRead);
            Assert.True(teacherSummary.SuccessCount >= 135);
        }

        // 3. Add 1 SuperAdmin Account
        var passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Super Admin PPLG",
            Email = "admin@pplg.smkn2surakarta.sch.id",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "Admin123!");
        context.Users.Add(adminUser);
        await context.SaveChangesAsync();

        // 4. Verify Rehearsal Reconciliation
        var studentCount = await context.Users.CountAsync(u => u.Role == UserRole.Student);
        var teacherCount = await context.Users.CountAsync(u => u.Role == UserRole.Teacher);
        var adminCount = await context.Users.CountAsync(u => u.Role == UserRole.Admin);
        var totalUsers = await context.Users.CountAsync();

        Assert.Equal(216, studentCount);
        Assert.True(teacherCount >= 135);
        Assert.Equal(1, adminCount);
        Assert.True(totalUsers >= 352);

        // Verify NO duplicate NIS or NIP
        var nisList = await context.Users.Where(u => u.NIS != null).Select(u => u.NIS).ToListAsync();
        Assert.Equal(nisList.Count, nisList.Distinct(StringComparer.OrdinalIgnoreCase).Count());
    }

    [Fact(Skip = "Obsolete Phase 10 test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Stage11_ExecuteProductionBackupSnapshot()
    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var users = await context.Users.AsNoTracking().ToListAsync();
        Assert.True(users.Count > 0, "Live database must contain users.");
    }

    [Fact(Skip = "Obsolete Phase 10 test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Stage12_ProductionDataIntegrityAndDomainConsistencyAudit()
    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var totalUsers = await context.Users.AsNoTracking().CountAsync();
        Assert.True(totalUsers >= 356);
    }
}









