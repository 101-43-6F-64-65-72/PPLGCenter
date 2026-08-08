using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data.Seeders;

/// <summary>
/// Seeds the academic master tables: AcademicYears, Semesters, Departments, SchoolClasses.
/// All operations are idempotent upserts safe to run on every startup.
/// </summary>
public static class MasterDataSeeder
{
    // ── Departments ───────────────────────────────────────────────────────────
    private static readonly (string Code, string Name)[] DefaultDepartments =
    [
        ("RPL",  "Rekayasa Perangkat Lunak"),
        ("TKJ",  "Teknik Komputer dan Jaringan"),
        ("AKL",  "Akuntansi dan Keuangan Lembaga"),
        ("DKV",  "Desain Komunikasi Visual"),
        ("MPLB", "Manajemen Perkantoran dan Layanan Bisnis"),
        ("TKRO", "Teknik Kendaraan Ringan Otomotif"),
        ("TBSM", "Teknik Bisnis Sepeda Motor")
    ];

    // ── Classes to seed for academic year 2026/2027 ───────────────────────────
    private static readonly (string Grade, string DeptCode, string Suffix)[] DefaultClasses =
    [
        ("X",   "RPL",  "1"),
        ("X",   "RPL",  "2"),
        ("XI",  "RPL",  "1"),
        ("XI",  "RPL",  "2"),
        ("XII", "RPL",  "1"),
        ("XII", "RPL",  "2"),
        ("X",   "TKJ",  "1"),
        ("XI",  "TKJ",  "1"),
        ("XII", "TKJ",  "1"),
        ("X",   "AKL",  "1"),
        ("XI",  "AKL",  "1"),
        ("XII", "AKL",  "1"),
        ("X",   "DKV",  "1"),
        ("XI",  "DKV",  "1"),
        ("XII", "DKV",  "1"),
    ];

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        if (await context.SchoolClasses.AnyAsync())
        {
            return;
        }

        // ── 1. Academic Year 2026/2027 ────────────────────────────────────────
        var ay = await context.AcademicYears
            .FirstOrDefaultAsync(a => a.Name == "2026/2027");

        if (ay is null)
        {
            ay = new AcademicYear
            {
                Id = Guid.NewGuid(),
                Name = "2026/2027",
                StartDate = new DateTime(2026, 7, 14, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.AcademicYears.Add(ay);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded AcademicYear: {Name}", ay.Name);
        }

        // ── 2. Semesters ──────────────────────────────────────────────────────
        var semesterDefs = new[]
        {
            (Name: "Ganjil", Order: 1, IsActive: true),
            (Name: "Genap",  Order: 2, IsActive: false)
        };

        foreach (var (name, order, isActive) in semesterDefs)
        {
            var exists = await context.Semesters
                .AnyAsync(s => s.AcademicYearId == ay.Id && s.Name == name);

            if (!exists)
            {
                context.Semesters.Add(new Semester
                {
                    Id = Guid.NewGuid(),
                    AcademicYearId = ay.Id,
                    Name = name,
                    Order = order,
                    IsActive = isActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                logger.LogInformation("Seeded Semester: {Name}", name);
            }
        }

        await context.SaveChangesAsync();

        // ── 3. Departments ────────────────────────────────────────────────────
        foreach (var (code, deptName) in DefaultDepartments)
        {
            var exists = await context.Departments.AnyAsync(d => d.Code == code);
            if (!exists)
            {
                context.Departments.Add(new Department
                {
                    Id = Guid.NewGuid(),
                    Code = code,
                    Name = deptName,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                logger.LogInformation("Seeded Department: {Code}", code);
            }
        }

        await context.SaveChangesAsync();

        // ── 4. School Classes ─────────────────────────────────────────────────
        foreach (var (grade, deptCode, suffix) in DefaultClasses)
        {
            var dept = await context.Departments.FirstOrDefaultAsync(d => d.Code == deptCode);
            if (dept is null) continue;

            var className = $"{grade} {deptCode} {suffix}";
            var exists = await context.SchoolClasses
                .AnyAsync(c => c.AcademicYearId == ay.Id && c.Name == className);

            if (!exists)
            {
                context.SchoolClasses.Add(new SchoolClass
                {
                    Id = Guid.NewGuid(),
                    DepartmentId = dept.Id,
                    AcademicYearId = ay.Id,
                    Name = className,
                    Grade = grade,
                    Capacity = 36,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                logger.LogInformation("Seeded SchoolClass: {Name}", className);
            }
        }

        await context.SaveChangesAsync();
        logger.LogInformation("MasterDataSeeder completed successfully.");
    }
}
