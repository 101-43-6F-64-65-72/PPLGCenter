using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Infrastructure.Data.Seeders;

// ─────────────────────────────────────────────────────────────────────────────
// JSON DTOs (internal to seeder)
// ─────────────────────────────────────────────────────────────────────────────

public class SeedMembership
{
    public string Extracurricular { get; set; } = string.Empty;
    public string Position { get; set; } = "Member";
}

public class SeedUserItem
{
    // ── Core identity ────────────────────────────────────────────────────────
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? NIS { get; set; }
    public string? NISN { get; set; }
    public string? NIP { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;

    // ── Student-specific ─────────────────────────────────────────────────────
    public string? DepartmentCode { get; set; }     // "RPL"
    public string? ClassName { get; set; }           // "X RPL 1"
    public int? StudentNumber { get; set; }          // nomor absen
    public string? Gender { get; set; }              // "Male" | "Female"
    public string? BirthDate { get; set; }           // "2009-05-21"
    public string? Address { get; set; }

    // ── Teacher-specific ─────────────────────────────────────────────────────
    public string? Position { get; set; }            // "Wali Kelas", "Guru", …
    public string? HomeroomClass { get; set; }       // class name teacher is homeroom for

    // ── Extracurricular links ────────────────────────────────────────────────
    public List<string>? AdvisorFor { get; set; }
    public List<SeedMembership>? Memberships { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Import report
// ─────────────────────────────────────────────────────────────────────────────

public class UserJsonSeederReport
{
    public int Inserted { get; set; }
    public int Updated { get; set; }
    public int Skipped { get; set; }
    public int DuplicateEmail { get; set; }
    public int DuplicateUsername { get; set; }
    public int DuplicateNIS { get; set; }
    public int DuplicateNISN { get; set; }
    public int DuplicateNIP { get; set; }
    public int ExtracurricularsSeeded { get; set; }
    public int AdvisorLinksCreated { get; set; }
    public int MembershipLinksCreated { get; set; }
    public int ClassLinksCreated { get; set; }
    public int HomeroomLinksCreated { get; set; }

    public void PrintReport(ILogger logger)
    {
        logger.LogInformation("==================================================");
        logger.LogInformation("USER JSON SEEDER IMPORT REPORT");
        logger.LogInformation("==================================================");
        logger.LogInformation("Inserted:              {v}", Inserted);
        logger.LogInformation("Updated:               {v}", Updated);
        logger.LogInformation("Skipped:               {v}", Skipped);
        logger.LogInformation("Duplicate Email:       {v}", DuplicateEmail);
        logger.LogInformation("Duplicate Username:    {v}", DuplicateUsername);
        logger.LogInformation("Duplicate NIS:         {v}", DuplicateNIS);
        logger.LogInformation("Duplicate NISN:        {v}", DuplicateNISN);
        logger.LogInformation("Duplicate NIP:         {v}", DuplicateNIP);
        logger.LogInformation("Extracurriculars:      {v}", ExtracurricularsSeeded);
        logger.LogInformation("Advisor Links:         {v}", AdvisorLinksCreated);
        logger.LogInformation("Membership Links:      {v}", MembershipLinksCreated);
        logger.LogInformation("Class Links:           {v}", ClassLinksCreated);
        logger.LogInformation("Homeroom Links:        {v}", HomeroomLinksCreated);
        logger.LogInformation("Finished.");
        logger.LogInformation("==================================================");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeder
// ─────────────────────────────────────────────────────────────────────────────

public static class UserJsonSeeder
{
    private static readonly string[] DefaultExtracurriculars =
    [
        "OSIS", "Basket", "Voli", "Pramuka", "Paskibra"
    ];

    public static async Task<UserJsonSeederReport> SeedUsersFromJsonAsync(
        IServiceProvider serviceProvider,
        string? customFilePath = null)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();
        var environment = scope.ServiceProvider.GetService<IHostEnvironment>();
        var passwordHasher = new PasswordHasher<User>();

        var report = new UserJsonSeederReport();

        // ── Step 1: Seed master extracurriculars ──────────────────────────────
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);

        foreach (var extraName in DefaultExtracurriculars)
        {
            if (!await context.Extracurriculars.AnyAsync(e => e.Name == extraName))
            {
                if (adminUser is null)
                {
                    var placeholder = new User
                    {
                        Id = Guid.NewGuid(),
                        FullName = "System",
                        Email = "system@studentcenter.id",
                        PasswordHash = string.Empty,
                        Role = UserRole.Admin,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    context.Users.Add(placeholder);
                    await context.SaveChangesAsync();
                    adminUser = placeholder;
                }

                context.Extracurriculars.Add(new Extracurricular
                {
                    Id = Guid.NewGuid(),
                    Name = extraName,
                    Description = $"Ekstrakurikuler {extraName}",
                    Category = "General",
                    MaxMembers = 100,
                    IsActive = true,
                    ManagedByUserId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                report.ExtracurricularsSeeded++;
            }
        }

        await context.SaveChangesAsync();

        // ── Step 2: Load JSON ─────────────────────────────────────────────────
        var contentRoot = environment?.ContentRootPath ?? AppContext.BaseDirectory;
        var filePath = customFilePath ?? Path.Combine(contentRoot, "SeedData", "users.seed.json");

        if (!File.Exists(filePath))
        {
            var fallback = Path.Combine(AppContext.BaseDirectory, "SeedData", "users.seed.json");
            filePath = File.Exists(fallback) ? fallback : null;
        }

        if (filePath is null)
        {
            logger.LogWarning("Seed file not found. Skipping JSON user seeding.");
            return report;
        }

        string jsonContent;
        try { jsonContent = await File.ReadAllTextAsync(filePath); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to read seed file at {FilePath}", filePath);
            return report;
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        List<SeedUserItem>? userItems;
        try { userItems = JsonSerializer.Deserialize<List<SeedUserItem>>(jsonContent, options); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to deserialize JSON from {FilePath}", filePath);
            return report;
        }

        if (userItems is null || userItems.Count == 0)
        {
            logger.LogInformation("No user items found in seed file.");
            return report;
        }

        // ── Step 3: Upsert users ──────────────────────────────────────────────
        foreach (var item in userItems)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(item.Email) || !item.Email.Contains('@'))
            {
                logger.LogWarning("Invalid email for {FullName}. Skipped.", item.FullName);
                report.Skipped++;
                continue;
            }

            if (string.IsNullOrWhiteSpace(item.Password) || item.Password.Length < 6)
            {
                logger.LogWarning("Password for {Email} must be ≥6 characters. Skipped.", item.Email);
                report.Skipped++;
                continue;
            }

            if (!Enum.TryParse<UserRole>(item.Role, true, out var parsedRole))
            {
                logger.LogWarning("Invalid role '{Role}' for {Email}. Skipped.", item.Role, item.Email);
                report.Skipped++;
                continue;
            }

            if (parsedRole == UserRole.Student)
            {
                if (string.IsNullOrWhiteSpace(item.NIS) || string.IsNullOrWhiteSpace(item.NISN))
                {
                    logger.LogWarning("Student {Email} requires NIS and NISN. Skipped.", item.Email);
                    report.Skipped++;
                    continue;
                }

                if (string.IsNullOrWhiteSpace(item.DepartmentCode) || string.IsNullOrWhiteSpace(item.ClassName))
                {
                    logger.LogWarning("Student {Email} requires DepartmentCode and ClassName. Skipped.", item.Email);
                    report.Skipped++;
                    continue;
                }
            }

            if (parsedRole == UserRole.Teacher && string.IsNullOrWhiteSpace(item.NIP))
            {
                logger.LogWarning("Teacher {Email} requires NIP. Skipped.", item.Email);
                report.Skipped++;
                continue;
            }

            var emailLower = item.Email.Trim().ToLower();
            var usernameLower = item.Username?.Trim().ToLower();
            var nisTrim = item.NIS?.Trim();
            var nisnTrim = item.NISN?.Trim();
            var nipTrim = item.NIP?.Trim();

            // Resolve SchoolClass FK for students
            Guid? classId = null;
            if (parsedRole == UserRole.Student && !string.IsNullOrWhiteSpace(item.ClassName))
            {
                var schoolClass = await context.SchoolClasses
                    .FirstOrDefaultAsync(c => c.Name == item.ClassName.Trim());

                if (schoolClass is null)
                {
                    logger.LogWarning("Class '{ClassName}' not found for student {Email}. Skipped.", item.ClassName, item.Email);
                    report.Skipped++;
                    continue;
                }
                classId = schoolClass.Id;
            }

            // Detect duplicate / existing user
            var existingUser = await context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == emailLower ||
                (usernameLower != null && u.Username != null && u.Username.ToLower() == usernameLower) ||
                (nisTrim != null && u.NIS == nisTrim) ||
                (nisnTrim != null && u.NISN == nisnTrim) ||
                (nipTrim != null && u.NIP == nipTrim));

            User seedUser;
            DateTime? parsedBirthDate = null;
            if (!string.IsNullOrWhiteSpace(item.BirthDate) &&
                DateTime.TryParse(item.BirthDate, out var bd))
            {
                parsedBirthDate = DateTime.SpecifyKind(bd, DateTimeKind.Utc);
            }

            if (existingUser != null)
            {
                if (existingUser.Email.ToLower() == emailLower) report.DuplicateEmail++;
                if (usernameLower != null && existingUser.Username?.ToLower() == usernameLower) report.DuplicateUsername++;
                if (nisTrim != null && existingUser.NIS == nisTrim) report.DuplicateNIS++;
                if (nisnTrim != null && existingUser.NISN == nisnTrim) report.DuplicateNISN++;
                if (nipTrim != null && existingUser.NIP == nipTrim) report.DuplicateNIP++;

                existingUser.FullName = item.FullName.Trim();
                existingUser.Email = item.Email.Trim();
                existingUser.Username = item.Username?.Trim();
                existingUser.Role = parsedRole;
                existingUser.NIS = nisTrim;
                existingUser.NISN = nisnTrim;
                existingUser.NIP = nipTrim;
                existingUser.PhoneNumber = item.PhoneNumber?.Trim();
                existingUser.IsActive = item.IsActive;
                existingUser.ClassId = classId;
                existingUser.StudentNumber = item.StudentNumber;
                existingUser.Gender = item.Gender?.Trim();
                existingUser.BirthDate = parsedBirthDate;
                existingUser.Address = item.Address?.Trim();
                existingUser.Position = item.Position?.Trim();
                existingUser.PasswordHash = passwordHasher.HashPassword(existingUser, item.Password);
                existingUser.UpdatedAt = DateTime.UtcNow;

                seedUser = existingUser;
                report.Updated++;
            }
            else
            {
                seedUser = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = item.FullName.Trim(),
                    Email = item.Email.Trim(),
                    Username = item.Username?.Trim(),
                    Role = parsedRole,
                    NIS = nisTrim,
                    NISN = nisnTrim,
                    NIP = nipTrim,
                    PhoneNumber = item.PhoneNumber?.Trim(),
                    IsActive = item.IsActive,
                    ClassId = classId,
                    StudentNumber = item.StudentNumber,
                    Gender = item.Gender?.Trim(),
                    BirthDate = parsedBirthDate,
                    Address = item.Address?.Trim(),
                    Position = item.Position?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                seedUser.PasswordHash = passwordHasher.HashPassword(seedUser, item.Password);
                context.Users.Add(seedUser);
                report.Inserted++;
            }

            await context.SaveChangesAsync();
            if (classId.HasValue) report.ClassLinksCreated++;

            // ── Step 4: Teacher homeroom class link ───────────────────────────
            if (parsedRole == UserRole.Teacher && !string.IsNullOrWhiteSpace(item.HomeroomClass))
            {
                var homeroomClass = await context.SchoolClasses
                    .FirstOrDefaultAsync(c => c.Name == item.HomeroomClass.Trim());

                if (homeroomClass != null && homeroomClass.HomeroomTeacherId != seedUser.Id)
                {
                    homeroomClass.HomeroomTeacherId = seedUser.Id;
                    homeroomClass.UpdatedAt = DateTime.UtcNow;
                    await context.SaveChangesAsync();
                    report.HomeroomLinksCreated++;
                }
            }

            // ── Step 5: Teacher advisor extracurricular links ─────────────────
            if (parsedRole == UserRole.Teacher && item.AdvisorFor != null)
            {
                foreach (var extraName in item.AdvisorFor)
                {
                    var extra = await context.Extracurriculars.FirstOrDefaultAsync(e => e.Name == extraName);
                    if (extra is null) continue;

                    if (!await context.ExtracurricularAdvisors.AnyAsync(a => a.TeacherId == seedUser.Id && a.ExtracurricularId == extra.Id))
                    {
                        context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
                        {
                            Id = Guid.NewGuid(),
                            TeacherId = seedUser.Id,
                            ExtracurricularId = extra.Id,
                            AssignedDate = DateTime.UtcNow
                        });
                        report.AdvisorLinksCreated++;
                    }
                }
                await context.SaveChangesAsync();
            }

            // ── Step 6: Student membership links ──────────────────────────────
            if (parsedRole == UserRole.Student && item.Memberships != null)
            {
                foreach (var mem in item.Memberships)
                {
                    var extra = await context.Extracurriculars.FirstOrDefaultAsync(e => e.Name == mem.Extracurricular);
                    if (extra is null) continue;

                    if (!Enum.TryParse<ExtracurricularMemberPosition>(mem.Position, true, out var parsedPosition))
                        parsedPosition = ExtracurricularMemberPosition.Member;

                    if (!await context.ExtracurricularMembers.AnyAsync(m => m.StudentId == seedUser.Id && m.ExtracurricularId == extra.Id))
                    {
                        context.ExtracurricularMembers.Add(new ExtracurricularMember
                        {
                            Id = Guid.NewGuid(),
                            StudentId = seedUser.Id,
                            ExtracurricularId = extra.Id,
                            Position = parsedPosition,
                            JoinDate = DateTime.UtcNow,
                            JoinedAt = DateTime.UtcNow,
                            Status = "Active"
                        });
                        report.MembershipLinksCreated++;
                    }
                }
                await context.SaveChangesAsync();
            }
        }

        report.PrintReport(logger);
        return report;
    }
}
