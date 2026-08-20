using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

[Collection("LivePostgreSQL")]
public class Phase42DataIngestionRunner

{
    private static string GetConnectionString()
    {
        var raw = "postgresql://postgres:L7RzTWA4ZkpBVw1B@db.rwopazhqgvvrosdizmvt.supabase.co:5432/postgres";
        return ParseConnectionString(raw);
    }


    private static string ParseConnectionString(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        if (!raw.StartsWith("postgresql://") && !raw.StartsWith("postgres://")) return raw;

        var uri = new Uri(raw);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Username = username,
            Password = password,
            Database = database,
            SslMode = SslMode.Require,
            TrustServerCertificate = true
        };

        return builder.ConnectionString;
    }

    private static string FindSampleDataPath(string fileName)
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "sample-data", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "sample-data", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "sample-data", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "sample-data", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "sample-data", fileName)
        };

        foreach (var c in candidates)
        {
            if (File.Exists(c)) return c;
        }

        throw new FileNotFoundException($"Sample data file '{fileName}' not found.");
    }

    [Fact(Skip = "Phase 42 manual database reset runner. Run explicitly via --filter ExecutePhase42_AuthorizedDatabaseResetAndIngestion when needed.")]
    public async Task ExecutePhase42_AuthorizedDatabaseResetAndIngestion()

    {
        var rawConn = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(rawConn)
            .Options;

        using var context = new AppDbContext(options);
        var passwordHasher = new PasswordHasher<User>();

        // ─────────────────────────────────────────────────────────────────────
        // STEP 1: ATOMIC TRUNCATE VIA EF CORE CONTEXT
        // ─────────────────────────────────────────────────────────────────────
        await context.Database.ExecuteSqlRawAsync(@"
            TRUNCATE TABLE 
                ""Users"", ""SchoolClasses"", ""Departments"",
                ""Schedules"", ""ScheduleRotationConfigs"",
                ""ClassSubjects"", ""TeacherSubjects"",
                ""ExtracurricularMembers"", ""ExtracurricularAdvisors"", ""Extracurriculars"", ""Proposals"",
                ""FacilityBookings"", ""FacilityManagers"", ""Facilities"",
                ""Attendances"", ""AttendanceSessions"",
                ""Submissions"", ""SubmissionRevisions"", ""StudentGrades"",
                ""DiscussionReplies"", ""DiscussionThreads"",
                ""Messages"", ""MessageAttachments"", ""GroupMessages"", ""GroupMessageRecipientEnvelopes"", ""ConversationMembers"", ""Conversations"",
                ""AnnouncementComments"", ""AnnouncementReactions"", ""Announcements"",
                ""CalendarEvents"", ""AcademicEvents"",
                ""Books"", ""BookBorrowRequests"", ""BookManagers"",
                ""StudentProfiles"", ""StudentProjects"", ""Assessments"", ""Materials"", ""LessonMaterials"",
                ""PasswordResetRequests"", ""UserPermissions"", ""ClassLeadership"", ""ClassDivisions""
            CASCADE;
        ");

        context.ChangeTracker.Clear();




        // ─────────────────────────────────────────────────────────────────────
        // STEP 2: REBUILD OFFICIAL PPLG STRUCTURE
        // ─────────────────────────────────────────────────────────────────────
        var department = new Department
        {
            Id = Guid.NewGuid(),
            Code = "PPLG",
            Name = "Pengembangan Perangkat Lunak dan Gim",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Departments.Add(department);
        await context.SaveChangesAsync();

        var activeAcademicYear = await context.AcademicYears.FirstOrDefaultAsync(ay => ay.IsActive)
            ?? new AcademicYear
            {
                Id = Guid.NewGuid(),
                Name = "2026/2027",
                IsActive = true,
                StartDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc),
                EndDate = new DateTime(2027, 6, 30, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

        if (await context.AcademicYears.AllAsync(ay => ay.Id != activeAcademicYear.Id))
        {
            context.AcademicYears.Add(activeAcademicYear);
            await context.SaveChangesAsync();
        }

        var activeSemester = await context.Semesters.FirstOrDefaultAsync(s => s.AcademicYearId == activeAcademicYear.Id && s.IsActive)
            ?? new Semester
            {
                Id = Guid.NewGuid(),
                AcademicYearId = activeAcademicYear.Id,
                Name = "Semester Ganjil 2026/2027",
                Order = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

        if (await context.Semesters.AllAsync(s => s.Id != activeSemester.Id))
        {
            context.Semesters.Add(activeSemester);
            await context.SaveChangesAsync();
        }

        var officialClassNames = new[] { "X PPLG A", "X PPLG B", "XI PPLG A", "XI PPLG B", "XII PPLG A", "XII PPLG B" };

        foreach (var className in officialClassNames)
        {
            var grade = className.Split(' ')[0];
            var schoolClass = new SchoolClass
            {
                Id = Guid.NewGuid(),
                DepartmentId = department.Id,
                AcademicYearId = activeAcademicYear.Id,
                Name = className,
                Grade = grade,
                Capacity = 36,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.SchoolClasses.Add(schoolClass);
        }

        await context.SaveChangesAsync();

        // Query saved classes from DB
        var savedClasses = await context.SchoolClasses.ToListAsync();
        Console.WriteLine($"[PHASE 42 DEBUG] Saved {savedClasses.Count} SchoolClasses: " + string.Join(", ", savedClasses.Select(c => $"{c.Name}:{c.Id}")));
        var classDict = savedClasses.ToDictionary(c => c.Name, c => c, StringComparer.OrdinalIgnoreCase);



        var dbEmails = await context.Users.AsNoTracking().Select(u => u.Email).ToListAsync();
        var existingEmails = new HashSet<string>(dbEmails, StringComparer.OrdinalIgnoreCase);

        var dbUsernames = await context.Users.AsNoTracking().Select(u => u.Username).ToListAsync();
        var existingUsernames = new HashSet<string>(dbUsernames, StringComparer.OrdinalIgnoreCase);

        // ─────────────────────────────────────────────────────────────────────
        // STEP 3: IMPORT OFFICIAL ADMIN ACCOUNT
        // ─────────────────────────────────────────────────────────────────────
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Administrator PPLG Center",
            Email = "admin@smkn2surakarta.sch.id",
            Username = "admin_pplg",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "AdminPPLGCenter2026!");
        context.Users.Add(adminUser);
        existingEmails.Add(adminUser.Email);
        existingUsernames.Add(adminUser.Username);

        await context.SaveChangesAsync();

        // ─────────────────────────────────────────────────────────────────────
        // STEP 4: IMPORT OFFICIAL TEACHERS FROM CSV (Kode_Guru_SMKN_2_Surakarta.csv)
        // ─────────────────────────────────────────────────────────────────────
        var teacherCsvPath = FindSampleDataPath("Kode_Guru_SMKN_2_Surakarta.csv");
        var teacherLines = File.ReadAllLines(teacherCsvPath).Skip(1).Where(l => !string.IsNullOrWhiteSpace(l)).ToList();

        var teacherList = new List<User>();
        var teacherMapByCode = new Dictionary<int, User>();

        foreach (var line in teacherLines)
        {
            var parts = ParseCsvLine(line);
            if (parts.Count < 3) continue;

            if (!int.TryParse(parts[0].Trim(), out int kodeGuru)) continue;
            var fullName = parts[1].Trim();
            var nipRaw = parts[2].Trim();
            var nip = nipRaw == "-" ? null : nipRaw;

            // Generate clean unique email & username
            var emailName = Regex.Replace(fullName.ToLower(), @"[^a-z0-9]", "");
            var baseEmail = $"guru_{kodeGuru}_{emailName.Substring(0, Math.Min(10, emailName.Length))}@teacher.smkn2surakarta.sch.id";
            var email = baseEmail;
            int counter = 1;
            while (existingEmails.Contains(email))
            {
                email = $"guru_{kodeGuru}_{counter++}@teacher.smkn2surakarta.sch.id";
            }
            existingEmails.Add(email);

            var baseUsername = $"guru_{kodeGuru}";
            var username = baseUsername;
            int uCounter = 1;
            while (existingUsernames.Contains(username))
            {
                username = $"guru_{kodeGuru}_{uCounter++}";
            }
            existingUsernames.Add(username);

            var teacher = new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName,
                Email = email,
                Username = username,
                NIP = nip,
                Role = UserRole.Teacher,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            teacher.PasswordHash = passwordHasher.HashPassword(teacher, "GuruPPLG2026!");

            context.Users.Add(teacher);
            teacherList.Add(teacher);
            teacherMapByCode[kodeGuru] = teacher;
        }

        await context.SaveChangesAsync();

        // ─────────────────────────────────────────────────────────────────────
        // STEP 5: IMPORT OFFICIAL STUDENTS FROM CSV (data_siswa_pplg_lengkap_x_xi_xii.csv)
        // ─────────────────────────────────────────────────────────────────────
        var studentCsvPath = FindSampleDataPath("data_siswa_pplg_lengkap_x_xi_xii.csv");
        var studentLines = File.ReadAllLines(studentCsvPath).Skip(1).Where(l => !string.IsNullOrWhiteSpace(l)).ToList();

        int studentCount = 0;
        foreach (var line in studentLines)
        {
            var parts = ParseCsvLine(line);
            if (parts.Count < 4) continue;

            var nis = parts[1].Trim();
            var fullName = parts[2].Trim();
            var rawClassName = parts[3].Trim().Replace("-", " "); // e.g. "X PPLG-A" -> "X PPLG A"

            if (!classDict.TryGetValue(rawClassName, out var targetClass))
            {
                throw new InvalidOperationException($"Target class '{rawClassName}' not found in class dictionary.");
            }

            var cleanNis = Regex.Replace(nis, @"[^0-9]", "");
            var baseEmail = $"siswa_{cleanNis}@student.smkn2surakarta.sch.id";
            var email = baseEmail;
            int counter = 1;
            while (existingEmails.Contains(email))
            {
                email = $"siswa_{cleanNis}_{counter++}@student.smkn2surakarta.sch.id";
            }
            existingEmails.Add(email);

            var baseUsername = $"siswa_{cleanNis}";
            var username = baseUsername;
            int uCounter = 1;
            while (existingUsernames.Contains(username))
            {
                username = $"siswa_{cleanNis}_{uCounter++}";
            }
            existingUsernames.Add(username);

            var student = new User
            {
                Id = Guid.NewGuid(),
                FullName = fullName,
                Email = email,
                Username = username,
                NIS = nis,
                ClassId = targetClass.Id,
                Role = UserRole.Student,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            student.PasswordHash = passwordHasher.HashPassword(student, "SiswaPPLG2026!");

            context.Users.Add(student);
            studentCount++;
        }

        await context.SaveChangesAsync();



        // ─────────────────────────────────────────────────────────────────────
        // STEP 6: CONFIGURE SCHEDULE ROTATION ENGINE (XI PPLG A & B)
        // ─────────────────────────────────────────────────────────────────────
        var xiPplgA = classDict["XI PPLG A"];
        var xiPplgB = classDict["XI PPLG B"];
        var anchorDate = new DateTime(2026, 7, 13, 0, 0, 0, DateTimeKind.Utc);

        context.ScheduleRotationConfigs.Add(new ScheduleRotationConfig
        {
            Id = Guid.NewGuid(),
            SchoolClassId = xiPplgA.Id,
            AnchorStartDate = anchorDate,
            InitialCategory = SubjectCategory.MPU,
            CycleWeeks = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        context.ScheduleRotationConfigs.Add(new ScheduleRotationConfig
        {
            Id = Guid.NewGuid(),
            SchoolClassId = xiPplgB.Id,
            AnchorStartDate = anchorDate,
            InitialCategory = SubjectCategory.KK,
            CycleWeeks = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        // ─────────────────────────────────────────────────────────────────────
        // STEP 7: RUN SCHEDULE INGESTION SERVICE
        // ─────────────────────────────────────────────────────────────────────
        var weeklyCsvPath = FindSampleDataPath("Jadwal_PPLG_A_B_SMKN2SKA_2026-2027.csv");
        var dailyCsvPath = FindSampleDataPath("Jadwal_PPLG_A_B_X_XI_XII_Ganjil_2026_2027.csv");

        var scheduleIngestionService = new ScheduleIngestionService(context);

        var weeklyCsvContent = File.ReadAllText(weeklyCsvPath);
        await scheduleIngestionService.ImportWeeklyAgendaCsvAsync(weeklyCsvContent);

        var dailyCsvContent = File.ReadAllText(dailyCsvPath);
        await scheduleIngestionService.ImportDailyTimetableCsvAsync(dailyCsvContent);


        // ─────────────────────────────────────────────────────────────────────
        // STEP 8: POST-IMPORT FORENSIC VALIDATION GATES
        // ─────────────────────────────────────────────────────────────────────
        var totalUsers = await context.Users.CountAsync();
        var adminCount = await context.Users.CountAsync(u => u.Role == UserRole.Admin);
        var totalTeachers = await context.Users.CountAsync(u => u.Role == UserRole.Teacher);
        var totalStudents = await context.Users.CountAsync(u => u.Role == UserRole.Student);
        var totalClasses = await context.SchoolClasses.CountAsync();
        var totalSchedules = await context.Schedules.CountAsync();
        var totalRotationConfigs = await context.ScheduleRotationConfigs.CountAsync();

        Console.WriteLine($"[PHASE 42 LIVE POSTGRES METRICS] TotalUsers={totalUsers}, Admin={adminCount}, Teachers={totalTeachers}, Students={totalStudents}, Classes={totalClasses}, Schedules={totalSchedules}, RotationConfigs={totalRotationConfigs}");

        Assert.Equal(1, adminCount);
        Assert.Equal(139, totalTeachers);
        Assert.Equal(216, totalStudents);
        Assert.Equal(356, totalUsers);
        Assert.Equal(6, totalClasses);
        Assert.Equal(520, totalSchedules);
        Assert.Equal(2, totalRotationConfigs);

    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString());
        return result;
    }
}
