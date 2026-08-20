using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase49ScheduleDiagnosticRunner
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
    public async Task CheckScheduleDatabaseContents()
    {
        using var db = GetDbContext();
        var total = await db.Schedules.CountAsync();
        Console.WriteLine($"Total Schedules in DB: {total}");

        var classes = await db.SchoolClasses.ToListAsync();
        foreach (var c in classes)
        {
            var countForClass = await db.Schedules
                .Where(s => s.ClassSubject.ClassId == c.Id)
                .CountAsync();
            Console.WriteLine($"Class '{c.Name}' ({c.Id}): {countForClass} schedules");
        }

        Assert.True(total > 0, "Schedules count in DB must be > 0");
    }
}
