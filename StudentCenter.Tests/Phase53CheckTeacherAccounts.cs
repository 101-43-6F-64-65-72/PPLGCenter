using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase53CheckTeacherAccounts
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
    public async Task CheckAllTeachers()
    {
        using var db = GetDbContext();

        var teachers = await db.Users
            .Where(u => u.Role == Domain.Enums.UserRole.Teacher)
            .ToListAsync();

        Console.WriteLine($"[TEACHER COUNT] Total Teachers in DB: {teachers.Count}");
        foreach (var t in teachers)
        {
            Console.WriteLine($" - FullName: {t.FullName} | Email: {t.Email} | Username: {t.Username} | NIP: {t.NIP}");
        }
    }
}
