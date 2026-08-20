using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase52PostPurgeVerifier
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
    public async Task VerifyPurgeResultsInSupabase()
    {
        using var db = GetDbContext();

        // 1. Check Siti Rahma OSIS
        var osisUser = await db.Users.FirstOrDefaultAsync(u => u.FullName.Contains("Siti Rahma"));
        Assert.Null(osisUser);

        // 2. Check RPL 1 classes
        var rplClasses = await db.SchoolClasses.Where(c => c.Name.Contains("RPL 1")).ToListAsync();
        Assert.Empty(rplClasses);

        // 3. Verify total classes in Supabase PostgreSQL
        var allClasses = await db.SchoolClasses.OrderBy(c => c.Name).ToListAsync();
        Assert.Equal(6, allClasses.Count);

        var expectedClassNames = new HashSet<string>
        {
            "X PPLG A", "X PPLG B", "XI PPLG A", "XI PPLG B", "XII PPLG A", "XII PPLG B"
        };

        foreach (var c in allClasses)
        {
            var studentCount = await db.Users.CountAsync(u => u.ClassId == c.Id);
            Assert.True(studentCount >= 36); // Verified official PPLG students
        }

        // 4. Verify subject DPK
        var dpkSub = await db.Subjects.FirstOrDefaultAsync(s => s.Code == "DPK");
        Assert.NotNull(dpkSub);

        var rplKddSub = await db.Subjects.FirstOrDefaultAsync(s => s.Code == "RPL-KDD");
        Assert.Null(rplKddSub);
    }
}
