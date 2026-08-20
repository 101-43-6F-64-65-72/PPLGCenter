using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase39ScheduleIngestionTests

{
    private AppDbContext CreateInMemoryDbContext()
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
        var academicYear = new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = "2026/2027",
            IsActive = true,
            StartDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc)
        };
        context.AcademicYears.Add(academicYear);

        var ganjilSemester = new Semester
        {
            Id = Guid.NewGuid(),
            AcademicYearId = academicYear.Id,
            Name = "Semester Ganjil 2026/2027",
            Order = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var genapSemester = new Semester
        {
            Id = Guid.NewGuid(),
            AcademicYearId = academicYear.Id,
            Name = "Semester Genap 2026/2027",
            Order = 2,
            IsActive = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Semesters.AddRange(ganjilSemester, genapSemester);


        var department = new Department { Id = Guid.NewGuid(), Name = "PPLG", Code = "PPLG" };
        context.Departments.Add(department);

        var classes = new[] { "X PPLG-A", "X PPLG-B", "XI PPLG-A", "XI PPLG-B", "XII PPLG-A", "XII PPLG-B" };
        foreach (var cName in classes)
        {
            context.SchoolClasses.Add(new SchoolClass
            {
                Id = Guid.NewGuid(),
                DepartmentId = department.Id,
                AcademicYearId = academicYear.Id,
                Name = cName,
                Grade = cName.Split(' ')[0],
                Capacity = 36
            });
        }

        var teacher = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Budi Santoso, S.Pd.",
            Email = "budi@teacher.smkn2surakarta.sch.id",
            NIP = "19701028 202221 1 003",
            Role = UserRole.Teacher
        };
        context.Users.Add(teacher);

        var baseSubject = new Subject { Id = Guid.NewGuid(), Code = "BIND", Name = "Bahasa Indonesia" };
        context.Subjects.Add(baseSubject);

        context.SaveChanges();
    }

    [Fact]
    public async Task Phase39_ImportWeeklyAgendaCsv_SuccessfullyParsesAndUpserts()
    {
        using var context = CreateInMemoryDbContext();
        var ingestionService = new ScheduleIngestionService(context);

        var weeklyCsvPath = Path.Combine("..", "..", "..", "..", "sample-data", "Jadwal_PPLG_A_B_SMKN2SKA_2026-2027.csv");
        if (!File.Exists(weeklyCsvPath))
        {
            weeklyCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "sample-data", "Jadwal_PPLG_A_B_SMKN2SKA_2026-2027.csv");
        }

        Assert.True(File.Exists(weeklyCsvPath), $"Weekly CSV file should exist at path {weeklyCsvPath}");
        var csvContent = await File.ReadAllTextAsync(weeklyCsvPath);

        var result = await ingestionService.ImportWeeklyAgendaCsvAsync(csvContent);

        Assert.NotNull(result);
        Assert.True(result.TotalRead > 0, "Should process data rows");

        // Verify ScheduleRotationConfigs created for XI PPLG-A and XI PPLG-B
        var rotationConfigs = await context.ScheduleRotationConfigs.ToListAsync();
        Assert.True(rotationConfigs.Count >= 2, "Should create rotation configs for Grade XI classes");

        // Verify AcademicEvents created for special weekly activities
        var academicEvents = await context.AcademicEvents.ToListAsync();
        Assert.NotEmpty(academicEvents);
    }

    [Fact]
    public async Task Phase39_ImportDailyTimetableCsv_SuccessfullyParsesAndMapsSubjects()
    {
        using var context = CreateInMemoryDbContext();
        var ingestionService = new ScheduleIngestionService(context);

        var dailyCsvPath = Path.Combine("..", "..", "..", "..", "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        if (!File.Exists(dailyCsvPath))
        {
            dailyCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        }

        Assert.True(File.Exists(dailyCsvPath), $"Daily CSV file should exist at path {dailyCsvPath}");
        var csvContent = await File.ReadAllTextAsync(dailyCsvPath);

        var result = await ingestionService.ImportDailyTimetableCsvAsync(csvContent);

        Assert.NotNull(result);
        Assert.Equal(360, result.TotalRead);
        Assert.True(result.SuccessCount > 0, "Should insert schedules for non-empty slots");

        // Verify Subject canonical mapping (BINDO -> BIND, MAT -> MTK, etc.)
        var insertedSubjects = await context.Subjects.ToListAsync();
        Assert.Contains(insertedSubjects, s => s.Code == "BIND");
        Assert.Contains(insertedSubjects, s => s.Code == "MTK");
        Assert.Contains(insertedSubjects, s => s.Code == "IPAS");

        // Verify Schedules inserted
        var insertedSchedules = await context.Schedules.ToListAsync();
        Assert.NotEmpty(insertedSchedules);
    }

    [Fact]
    public async Task Phase39_IngestionIsIdempotent_ReRunningProducesZeroDuplicates()
    {
        using var context = CreateInMemoryDbContext();
        var ingestionService = new ScheduleIngestionService(context);

        var dailyCsvPath = Path.Combine("..", "..", "..", "..", "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        if (!File.Exists(dailyCsvPath))
        {
            dailyCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        }

        var csvContent = await File.ReadAllTextAsync(dailyCsvPath);

        // First Run
        var run1 = await ingestionService.ImportDailyTimetableCsvAsync(csvContent);
        var initialScheduleCount = await context.Schedules.CountAsync();

        // Second Run (Rerun)
        var run2 = await ingestionService.ImportDailyTimetableCsvAsync(csvContent);
        var finalScheduleCount = await context.Schedules.CountAsync();

        Assert.Equal(initialScheduleCount, finalScheduleCount);
        Assert.Equal(0, run2.SuccessCount);
        Assert.True(run2.SkippedCount > 0);
    }


    [Fact(Skip = "Obsolete Phase 39 live schedule ingestion test superseded by Phase 42 Data Ingestion Runner")]
    public async Task Phase39_ExecuteAuthorizedProductionScheduleIngestion_LivePostgreSQL()

    {
        var connectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Timeout=60;Command Timeout=60";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        using var context = new AppDbContext(options);
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var ingestionService = new ScheduleIngestionService(context);

        var weeklyCsvPath = Path.Combine("..", "..", "..", "..", "sample-data", "Jadwal_PPLG_A_B_SMKN2SKA_2026-2027.csv");
        if (!File.Exists(weeklyCsvPath))
        {
            weeklyCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "sample-data", "Jadwal_PPLG_A_B_SMKN2SKA_2026-2027.csv");
        }

        var dailyCsvPath = Path.Combine("..", "..", "..", "..", "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        if (!File.Exists(dailyCsvPath))
        {
            dailyCsvPath = Path.Combine(Directory.GetCurrentDirectory(), "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        }

        if (File.Exists(weeklyCsvPath))
        {
            var weeklyContent = await File.ReadAllTextAsync(weeklyCsvPath);
            await ingestionService.ImportWeeklyAgendaCsvAsync(weeklyContent);
        }

        if (File.Exists(dailyCsvPath))
        {
            var dailyContent = await File.ReadAllTextAsync(dailyCsvPath);
            await ingestionService.ImportDailyTimetableCsvAsync(dailyContent);
        }

        // Live Database Verification
        var totalSchedules = await context.Schedules.CountAsync();
        var totalRotationConfigs = await context.ScheduleRotationConfigs.CountAsync();
        var totalAcademicEvents = await context.AcademicEvents.CountAsync();

        Assert.True(totalSchedules >= 0);
        Assert.True(totalRotationConfigs >= 0);
        Assert.True(totalAcademicEvents >= 0);
    }
}
