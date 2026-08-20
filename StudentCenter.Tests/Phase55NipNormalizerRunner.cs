using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase55NipNormalizerRunner
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
    public async Task NormalizeAllTeacherNipsInSupabase()
    {
        using var db = GetDbContext();

        // 1. Direct SQL to clean spaces, dots, hyphens from NIPs in Users table
        var rowsAffected = await db.Database.ExecuteSqlRawAsync(@"
            UPDATE ""Users"" 
            SET ""NIP"" = REPLACE(REPLACE(REPLACE(""NIP"", ' ', ''), '.', ''), '-', '') 
            WHERE ""NIP"" IS NOT NULL AND (""NIP"" LIKE '% %' OR ""NIP"" LIKE '%.%' OR ""NIP"" LIKE '%-%');
        ");

        Console.WriteLine($"[NIP NORMALIZED] Updated {rowsAffected} users with cleaned NIPs in Supabase PostgreSQL.");

        // 2. Fetch all teachers and verify their NIPs
        var teachers = await db.Users
            .Where(u => u.Role == Domain.Enums.UserRole.Teacher)
            .ToListAsync();

        Console.WriteLine($"[VERIFY TEACHERS] Total Teachers in DB: {teachers.Count}");
        foreach (var t in teachers)
        {
            Console.WriteLine($" - Teacher: {t.FullName} | Email: {t.Email} | Clean NIP: '{t.NIP}'");
            if (!string.IsNullOrWhiteSpace(t.NIP))
            {
                Assert.False(t.NIP.Contains(' '), $"Teacher {t.FullName} NIP still has spaces: '{t.NIP}'");
            }
        }
    }
}
