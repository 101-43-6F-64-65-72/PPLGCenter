using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase51SupabaseDirectPurgeRunner
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
    public async Task DirectPurgeSupabaseDatabase()
    {
        using var db = GetDbContext();

        // 1. Delete Siti Rahma OSIS and any OSIS / dummy user
        await db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""Users"" 
            WHERE LOWER(""FullName"") LIKE '%siti rahma%' 
               OR LOWER(""Email"") LIKE '%osis%' 
               OR LOWER(""Username"") LIKE '%osis%'
               OR LOWER(""FullName"") IN (
                   'mita the virgin', 'jessica iskandar', 'prilly latuconsina', 'gilang ramadhan',
                   'wahyu nugroho', 'maya safitri', 'panji utomo', 'hafiz mahendra', 'qori maharani',
                   'agus setiawan', 'bella bella', 'david saputra', 'umar faruq', 'fani febrianti',
                   'gita gutawa', 'siska wardani', 'irfan hakim', 'tegar prasetya', 'farah nabila',
                   'lia waode', 'nino fernandez', 'vina melati', 'rian hidayat', 'olivia putri',
                   'olla ramlan', 'zahra aulia', 'jefri kurniawan', 'indah permata', 'naufal rizky',
                   'yusuf habibie', 'budi santoso', 'xena gabriel', 'dian kusuma', 'candra wijaya',
                   'kevin sanjaya', 'eka pratama', 'anisa rahmawati', 'hendra setiawan', 'erwin susanto',
                   'citra lestari', 'kiki amelia', 'lukman hakim', 'ahmad rizky pratama'
               );
        ");

        // 2. Clear FK references pointing to non-PPLG classes
        var nonPplgClassIds = await db.Database.SqlQueryRaw<Guid>(@"
            SELECT ""Id"" FROM ""SchoolClasses"" WHERE ""Name"" NOT LIKE '%PPLG%'
        ").ToListAsync();

        foreach (var classId in nonPplgClassIds)
        {
            await db.Database.ExecuteSqlRawAsync(@"UPDATE ""SchoolClasses"" SET ""HomeroomTeacherId"" = NULL WHERE ""Id"" = {0}", classId);
            await db.Database.ExecuteSqlRawAsync(@"UPDATE ""Users"" SET ""ClassId"" = NULL WHERE ""ClassId"" = {0}", classId);
            await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""ClassLeadership"" WHERE ""SchoolClassId"" = {0}", classId);
            await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""ClassDivisions"" WHERE ""SchoolClassId"" = {0}", classId);

            var csIds = await db.Database.SqlQueryRaw<Guid>(@"SELECT ""Id"" FROM ""ClassSubjects"" WHERE ""ClassId"" = {0}", classId).ToListAsync();
            foreach (var csId in csIds)
            {
                await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Schedules"" WHERE ""ClassSubjectId"" = {0}", csId);
                await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""ClassSubjects"" WHERE ""Id"" = {0}", csId);
            }

            await db.Database.ExecuteSqlRawAsync(@"DELETE FROM ""SchoolClasses"" WHERE ""Id"" = {0}", classId);
        }

        // 3. Rename RPL-KDD to DPK in Subjects
        await db.Database.ExecuteSqlRawAsync(@"UPDATE ""Subjects"" SET ""Code"" = 'DPK', ""Name"" = 'DPK' WHERE ""Code"" = 'RPL-KDD' OR ""Name"" LIKE '%RPL-KDD%'");

        // Verify remaining classes in Supabase
        var remainingClasses = await db.SchoolClasses.OrderBy(c => c.Name).ToListAsync();
        Console.WriteLine($"[PURGE COMPLETE] Remaining Classes Count: {remainingClasses.Count}");
        foreach (var c in remainingClasses)
        {
            var count = await db.Users.CountAsync(u => u.ClassId == c.Id);
            Console.WriteLine($" - {c.Name}: {count} students");
        }
    }
}
