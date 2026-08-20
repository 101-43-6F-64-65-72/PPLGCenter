using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase48DailyScheduleIngestionRunner
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task IngestDailySchedulesFromCsv()
    {
        using var db = GetDbContext();
        var ingestionService = new ScheduleIngestionService(db);

        var csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        if (!File.Exists(csvPath))
        {
            csvPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "sample-data", "Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");
        }

        Assert.True(File.Exists(csvPath), $"CSV file not found at {csvPath}");
        var csvContent = await File.ReadAllTextAsync(csvPath);

        var result = await ingestionService.ImportDailyTimetableCsvAsync(csvContent);
        Assert.NotNull(result);

        // Verify total schedules in DB
        var totalSchedules = await db.Schedules.CountAsync();
        Assert.True(totalSchedules > 0, "Schedules count should be greater than 0");
    }
}
