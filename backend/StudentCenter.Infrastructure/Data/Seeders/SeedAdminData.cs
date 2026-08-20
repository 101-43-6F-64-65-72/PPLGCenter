using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Infrastructure.Data.Seeders;

public static class SeedAdminData
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var configuration = scope.ServiceProvider.GetService<IConfiguration>();
        var passwordHasher = new PasswordHasher<User>();

        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }

        var defaultPassword = configuration?["DEFAULT_ADMIN_PASSWORD"]?.Trim();
        if (string.IsNullOrWhiteSpace(defaultPassword))
        {
            defaultPassword = "Admin123!";
        }

        // 1. Seed Admin
        var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@smkn2surakarta.sch.id" || u.Email == "admin@pplgcenter.id" || u.Email == "admin@studentcenter.id");
        if (admin is null)
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Administrator PPLG Center",
                Email = "admin@smkn2surakarta.sch.id",
                Username = "admin_pplg",
                PhoneNumber = "+6281234567890",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);
        }
        admin.Role = UserRole.Admin;
        admin.IsActive = true;
        admin.PasswordHash = passwordHasher.HashPassword(admin, "AdminPPLGCenter2026!");
        admin.UpdatedAt = DateTime.UtcNow;

        // Fetch PPLG classes for student assignment
        var classXPplgA = await context.SchoolClasses.FirstOrDefaultAsync(c => c.Name == "X PPLG A");
        var classXiPplgA = await context.SchoolClasses.FirstOrDefaultAsync(c => c.Name == "XI PPLG A");

        // 2. Seed Teacher
        var teacher = await context.Users.FirstOrDefaultAsync(u => u.Email == "guru_1_sugiyono@teacher.smkn2surakarta.sch.id" || u.Email == "guru.pplg@pplgcenter.id" || u.Email == "budi.teacher@studentcenter.id" || u.Username == "teacher.budi");
        if (teacher is null)
        {
            teacher = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Sugiyono, S.Pd.",
                Email = "guru_1_sugiyono@teacher.smkn2surakarta.sch.id",
                Username = "guru_1",
                NIP = "197001012026011001",
                PhoneNumber = "+6281987654321",
                Role = UserRole.Teacher,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(teacher);
        }
        teacher.Role = UserRole.Teacher;
        teacher.IsActive = true;
        teacher.PasswordHash = passwordHasher.HashPassword(teacher, "GuruPPLG2026!");
        teacher.UpdatedAt = DateTime.UtcNow;

        // 3. Seed Student (Regular)
        var student = await context.Users.FirstOrDefaultAsync(u => u.NIS == "24.012472" || u.Email == "siswa_26014072@student.smkn2surakarta.sch.id" || u.Email == "siswa.pplg@pplgcenter.id" || u.NIS == "54321");
        if (student is null)
        {
            student = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Ahmad Syahputra",
                Email = "siswa_26014072@student.smkn2surakarta.sch.id",
                Username = "siswa_26014072",
                NIS = "24.012472",
                NISN = "0071234567",
                ClassId = classXPplgA?.Id,
                PhoneNumber = "+6285678901234",
                Role = UserRole.Student,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(student);
        }
        student.Role = UserRole.Student;
        student.IsActive = true;
        student.PasswordHash = passwordHasher.HashPassword(student, "SiswaPPLG2026!");
        student.UpdatedAt = DateTime.UtcNow;



        await context.SaveChangesAsync();

        // 5. Seed GradeScales
        if (!await context.GradeScales.AnyAsync())
        {
            var defaultScales = new[]
            {
                new GradeScale { Id = Guid.NewGuid(), Letter = "A", Minimum = 90.00m, Maximum = 100.00m, Predicate = "Sangat Baik", Description = "Sangat Memuaskan", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeScale { Id = Guid.NewGuid(), Letter = "B", Minimum = 80.00m, Maximum = 89.99m, Predicate = "Baik", Description = "Memuaskan", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeScale { Id = Guid.NewGuid(), Letter = "C", Minimum = 70.00m, Maximum = 79.99m, Predicate = "Cukup", Description = "Cukup Memuaskan", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeScale { Id = Guid.NewGuid(), Letter = "D", Minimum = 60.00m, Maximum = 69.99m, Predicate = "Kurang", Description = "Kurang Memuaskan", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeScale { Id = Guid.NewGuid(), Letter = "E", Minimum = 0.00m, Maximum = 59.99m, Predicate = "Sangat Kurang", Description = "Tidak Lulus", IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };
            context.GradeScales.AddRange(defaultScales);
        }

        // 6. Seed Default GradeCategories
        if (!await context.GradeCategories.AnyAsync())
        {
            var defaultCategories = new[]
            {
                new GradeCategory { Id = Guid.NewGuid(), Name = "Tugas Harian", Description = "Penugasan dan latihan harian", Weight = 20.00m, Type = GradeCategoryType.Assignment, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeCategory { Id = Guid.NewGuid(), Name = "Kuis / UH", Description = "Kuis dan Ulangan Harian", Weight = 15.00m, Type = GradeCategoryType.Quiz, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeCategory { Id = Guid.NewGuid(), Name = "UTS", Description = "Ujian Tengah Semester", Weight = 25.00m, Type = GradeCategoryType.Exam, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeCategory { Id = Guid.NewGuid(), Name = "UAS", Description = "Ujian Akhir Semester", Weight = 30.00m, Type = GradeCategoryType.Exam, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new GradeCategory { Id = Guid.NewGuid(), Name = "Praktikum / Skill", Description = "Penilaian Unjuk Kerja & Keterampilan", Weight = 10.00m, Type = GradeCategoryType.Skill, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            };
            context.GradeCategories.AddRange(defaultCategories);
        }

        await context.SaveChangesAsync();
    }
}
