using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Domain.Entities;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase50DbPurificationRunner
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    private static readonly List<string> TargetDummyNames = new()
    {
        "Mita The Virgin",
        "Jessica Iskandar",
        "Prilly Latuconsina",
        "Gilang Ramadhan",
        "Wahyu Nugroho",
        "Maya Safitri",
        "Panji Utomo",
        "Hafiz Mahendra",
        "Qori Maharani",
        "Agus Setiawan",
        "Bella Bella",
        "David Saputra",
        "Umar Faruq",
        "Fani Febrianti",
        "Gita Gutawa",
        "Siska Wardani",
        "Irfan Hakim",
        "Tegar Prasetya",
        "Farah Nabila",
        "Lia Waode",
        "Nino Fernandez",
        "Vina Melati",
        "Rian Hidayat",
        "Olivia Putri",
        "Olla Ramlan",
        "Zahra Aulia",
        "Jefri Kurniawan",
        "Indah Permata",
        "Naufal Rizky",
        "Yusuf Habibie",
        "Budi Santoso",
        "Xena Gabriel",
        "Dian Kusuma",
        "Candra Wijaya",
        "Kevin Sanjaya",
        "Eka Pratama",
        "Anisa Rahmawati",
        "Lukman Hakim",
        "Kiki Amelia",
        "Hendra Setiawan",
        "Citra Lestari",
        "Erwin Susanto",
        "Siti Rahma OSIS",
        "Ahmad Rizky Pratama"
    };

    [Fact]
    public async Task PurifyDatabaseEntities()
    {
        using var db = GetDbContext();

        // 1. Rename RPL-KDD subject to DPK in Subjects table
        var rplKddSubjects = await db.Subjects
            .Where(s => s.Code == "RPL-KDD" || s.Name.Contains("RPL-KDD") || s.Code == "RPL_KDD")
            .ToListAsync();

        foreach (var sub in rplKddSubjects)
        {
            sub.Code = "DPK";
            sub.Name = "DPK";
        }

        // Also check if any DPK subject already exists
        var dpkSubject = await db.Subjects.FirstOrDefaultAsync(s => s.Code == "DPK");
        if (dpkSubject == null && rplKddSubjects.Count == 0)
        {
            db.Subjects.Add(new Subject
            {
                Id = Guid.NewGuid(),
                Code = "DPK",
                Name = "DPK",
                CreatedAt = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync();

        // 2. Delete specified 44 dummy users
        foreach (var name in TargetDummyNames)
        {
            var dummyUsers = await db.Users
                .Where(u => u.FullName.Trim().ToLower() == name.Trim().ToLower())
                .ToListAsync();

            if (dummyUsers.Any())
            {
                db.Users.RemoveRange(dummyUsers);
            }
        }
        await db.SaveChangesAsync();

        // 3. Delete RPL 1 non-PPLG classes (X RPL 1, XI RPL 1, XII RPL 1)
        var rplClasses = await db.SchoolClasses
            .Where(c => c.Name.Contains("RPL 1") || c.Name.Contains("RPL1"))
            .ToListAsync();

        if (rplClasses.Any())
        {
            var rplClassIds = rplClasses.Select(c => c.Id).ToList();

            // Delete dependent class subjects & schedules
            var csList = await db.ClassSubjects.Where(cs => rplClassIds.Contains(cs.ClassId)).ToListAsync();
            var csIds = csList.Select(cs => cs.Id).ToList();

            var schedules = await db.Schedules.Where(s => csIds.Contains(s.ClassSubjectId)).ToListAsync();
            db.Schedules.RemoveRange(schedules);

            db.ClassSubjects.RemoveRange(csList);

            var divisions = await db.ClassDivisions.Where(d => rplClassIds.Contains(d.SchoolClassId)).ToListAsync();
            db.ClassDivisions.RemoveRange(divisions);

            // Also check users belonging to RPL 1 classes
            var rplUsers = await db.Users.Where(u => u.ClassId.HasValue && rplClassIds.Contains(u.ClassId.Value)).ToListAsync();
            db.Users.RemoveRange(rplUsers);

            db.SchoolClasses.RemoveRange(rplClasses);
        }
        await db.SaveChangesAsync();

        // Verify remaining official classes: should be exactly 6 PPLG classes
        var remainingClasses = await db.SchoolClasses.OrderBy(c => c.Name).ToListAsync();
        Console.WriteLine($"Remaining Classes count: {remainingClasses.Count}");
        foreach (var c in remainingClasses)
        {
            var count = await db.Users.CountAsync(u => u.ClassId == c.Id);
            Console.WriteLine($"Class: {c.Name} -> {count} students");
        }

        var totalUsersLeft = await db.Users.CountAsync();
        Console.WriteLine($"Total Users Left in DB: {totalUsersLeft}");
    }
}
