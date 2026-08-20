using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase56TeacherCompleteImporterRunner
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    private static string CreateSlug(string input)
    {
        var str = input.ToLowerInvariant();
        // Remove titles like S.Pd, M.Kom, Dra., Drs., M.Si, S.Ag, S.T, S.Kom, etc.
        str = Regex.Replace(str, @"\b(s\.pd|m\.pd|s\.kom|m\.kom|s\.t|m\.t|dra\.|drs\.|s\.ag|m\.si|s\.se|s\.or|s\.sn|s\.si|s\.st|m\.h|dr\.)\b", "", RegexOptions.IgnoreCase);
        str = Regex.Replace(str, @"[^a-z0-9\s]", "");
        str = Regex.Replace(str, @"\s+", "_").Trim('_');
        if (string.IsNullOrWhiteSpace(str)) str = "guru";
        return str;
    }

    [Fact]
    public async Task ImportAndStandardizeAllTeachersFromCsv()
    {
        using var db = GetDbContext();
        var passwordHasher = new PasswordHasher<User>();

        var csvPath = @"d:\.SCHOOL\PPLGCenter\sample-data\Kode_Guru_SMKN_2_Surakarta.csv";
        Assert.True(File.Exists(csvPath), "Teacher CSV file not found!");

        var lines = await File.ReadAllLinesAsync(csvPath);
        Assert.True(lines.Length > 1, "Teacher CSV file is empty!");

        int processed = 0;
        int inserted = 0;
        int updated = 0;

        // Skip header
        for (int i = 1; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (string.IsNullOrWhiteSpace(line)) continue;

            // Handle CSV regex splitting for quoted fields
            var matches = Regex.Matches(line, @"(?<=^|,)(?:""(?<val>[^""]*)""|(?<val>[^,]*))");
            var fields = matches.Cast<Match>().Select(m => m.Groups["val"].Value.Trim()).ToList();

            if (fields.Count < 4) continue;

            var kodeStr = fields[0];
            var fullName = fields[1];
            var rawNip = fields[2];
            var mataPelajaran = fields[3];

            if (string.IsNullOrWhiteSpace(fullName)) continue;

            // Clean NIP (strip spaces, dots, hyphens)
            string? cleanNip = null;
            if (!string.IsNullOrWhiteSpace(rawNip) && rawNip != "-")
            {
                cleanNip = rawNip.Replace(" ", "").Replace(".", "").Replace("-", "").Trim();
            }

            // Generate clean, consistent Username & Email
            var nameSlug = CreateSlug(fullName);
            if (int.TryParse(kodeStr, out int kodeNum))
            {
                kodeStr = kodeNum.ToString("D3");
            }
            else
            {
                kodeStr = (i).ToString("D3");
            }

            var username = $"guru_{kodeStr}_{nameSlug}";
            if (username.Length > 50) username = username.Substring(0, 50).TrimEnd('_');

            var email = $"guru_{kodeStr}_{nameSlug}@teacher.smkn2surakarta.sch.id";

            // Position is the Mata Pelajaran from CSV
            var position = string.IsNullOrWhiteSpace(mataPelajaran) ? "Guru" : mataPelajaran;

            // Search existing user by NIP, Email, or Username
            var teacher = await db.Users.FirstOrDefaultAsync(u =>
                (cleanNip != null && u.NIP != null && u.NIP.Replace(" ", "").Replace(".", "").Replace("-", "") == cleanNip) ||
                u.Email.ToLower() == email.ToLower() ||
                (u.Username != null && u.Username.ToLower() == username.ToLower()) ||
                u.FullName.ToLower() == fullName.ToLower());

            if (teacher == null)
            {
                teacher = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = fullName,
                    NIP = cleanNip,
                    Email = email,
                    Username = username,
                    Role = UserRole.Teacher,
                    Position = position,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                teacher.PasswordHash = passwordHasher.HashPassword(teacher, "GuruPPLG2026!");
                db.Users.Add(teacher);
                inserted++;
            }
            else
            {
                teacher.FullName = fullName;
                teacher.NIP = cleanNip;
                teacher.Position = position;
                teacher.Username = username;
                teacher.Email = email;
                teacher.Role = UserRole.Teacher;
                teacher.IsActive = true;
                teacher.PasswordHash = passwordHasher.HashPassword(teacher, "GuruPPLG2026!");
                teacher.UpdatedAt = DateTime.UtcNow;
                updated++;
            }

            processed++;
        }

        // Fill position = "Guru" for any legacy teachers with null position
        var nullPosTeachers = await db.Users.Where(u => u.Role == UserRole.Teacher && (u.Position == null || u.Position == "")).ToListAsync();
        foreach (var t in nullPosTeachers)
        {
            t.Position = "Guru";
            t.UpdatedAt = DateTime.UtcNow;
        }

        // Fill username for any legacy teachers with null username
        var nullUserTeachers = await db.Users.Where(u => u.Role == UserRole.Teacher && (u.Username == null || u.Username == "")).ToListAsync();
        foreach (var t in nullUserTeachers)
        {
            t.Username = $"guru_{t.Email.Split('@')[0]}";
            t.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        Console.WriteLine($"[TEACHER IMPORTER FINISHED] Processed: {processed} | Inserted: {inserted} | Updated: {updated}");

        // Post-import forensic audit
        var allTeachers = await db.Users
            .Where(u => u.Role == UserRole.Teacher)
            .OrderBy(u => u.Username)
            .ToListAsync();

        Console.WriteLine($"[AUDIT] Total Teachers in DB: {allTeachers.Count}");

        int nullPositionCount = allTeachers.Count(t => string.IsNullOrWhiteSpace(t.Position));
        int nullUsernameCount = allTeachers.Count(t => string.IsNullOrWhiteSpace(t.Username));
        int nipWithSpacesCount = allTeachers.Count(t => t.NIP != null && t.NIP.Contains(' '));

        Console.WriteLine($"[AUDIT] Null/Empty Position: {nullPositionCount}");
        Console.WriteLine($"[AUDIT] Null/Empty Username: {nullUsernameCount}");
        Console.WriteLine($"[AUDIT] NIP with Spaces: {nipWithSpacesCount}");

        Assert.Equal(0, nullPositionCount);
        Assert.Equal(0, nullUsernameCount);
        Assert.Equal(0, nipWithSpacesCount);
    }
}
