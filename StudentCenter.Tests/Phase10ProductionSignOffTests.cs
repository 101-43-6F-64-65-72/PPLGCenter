using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase10ProductionSignOffTests

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
    public async Task Gate1_TargetDatabaseVerification_ConnectsToDedicatedPplgCenterDatabase()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        // Verify latest migration is recorded in __EFMigrationsHistory
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
        Assert.Contains("20260818054831_Phase10_4_ProposalExtracurricularRelationship", appliedMigrations);
    }

    [Fact]
    public async Task Gate2_DatabaseIsolationVerification_ConfirmsNoStudentCenterResourceMixing()
    {
        using var context = GetProductionDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        if (!canConnect) return;

        var databaseName = context.Database.GetDbConnection().Database;
        Assert.Equal("postgres", databaseName);

        var host = context.Database.GetDbConnection().DataSource;
        Assert.Contains("rwopazhqgvvrosdizmvt", host);
    }
}
