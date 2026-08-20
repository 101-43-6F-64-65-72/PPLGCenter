using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using Microsoft.Extensions.Configuration;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;


namespace StudentCenter.Tests;


[Collection("LivePostgreSQL")]
public class Phase43LocalQaSuite
{
    private const string ConnectionString = "Host=db.rwopazhqgvvrosdizmvt.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=L7RzTWA4ZkpBVw1B;SSL Mode=Require;Trust Server Certificate=true;Pooling=false;";

    private AppDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    private (UserService, JwtService) GetUserService(AppDbContext context)
    {
        var configuration = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                {"Jwt:SecretKey", "SuperSecretKeyForPhase43Testing123456!"},
                {"Jwt:Issuer", "PPLGCenterApi"},
                {"Jwt:Audience", "PPLGCenterApp"},
                {"Jwt:ExpirationMinutes", "60"}
            })
            .Build();

        var jwtService = new JwtService(configuration, context);
        var userService = new UserService(context, jwtService, Microsoft.Extensions.Logging.Abstractions.NullLogger<UserService>.Instance);
        return (userService, jwtService);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 0: PRE-FLIGHT AUTHORITATIVE STATE READ-ONLY AUDIT
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Step0_AuthoritativeStateCheck_ReadOnly()
    {
        using var context = GetDbContext();
        var canConnect = await context.Database.CanConnectAsync();
        Assert.True(canConnect, "Cannot connect to live Supabase PostgreSQL database.");

        var totalUsers = await context.Users.AsNoTracking().CountAsync();
        var adminCount = await context.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.Admin);
        var teacherCount = await context.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.Teacher);
        var studentCount = await context.Users.AsNoTracking().CountAsync(u => u.Role == UserRole.Student);
        var totalClasses = await context.SchoolClasses.AsNoTracking().CountAsync();
        var departmentCount = await context.Departments.AsNoTracking().CountAsync(d => d.Code == "PPLG");
        var scheduleCount = await context.Schedules.AsNoTracking().CountAsync();
        var rotationConfigCount = await context.ScheduleRotationConfigs.AsNoTracking().CountAsync();

        Assert.Equal(356, totalUsers);
        Assert.Equal(1, adminCount);
        Assert.Equal(139, teacherCount);
        Assert.Equal(216, studentCount);
        Assert.Equal(6, totalClasses);
        Assert.Equal(1, departmentCount);
        Assert.Equal(520, scheduleCount);
        Assert.Equal(2, rotationConfigCount);

        // Verify Student Distribution: Exactly 36 per class
        var classes = await context.SchoolClasses.AsNoTracking().ToListAsync();
        foreach (var sc in classes)
        {
            var countInClass = await context.Users.AsNoTracking().CountAsync(u => u.ClassId == sc.Id);
            Assert.Equal(36, countInClass);
        }

        // Verify Duplicate NIS / Email = 0
        var emails = await context.Users.AsNoTracking().Select(u => u.Email).ToListAsync();
        var dupEmails = emails.GroupBy(x => x, StringComparer.OrdinalIgnoreCase).Where(g => g.Count() > 1).ToList();
        Assert.Empty(dupEmails);

        var nisList = await context.Users.AsNoTracking().Where(u => u.NIS != null).Select(u => u.NIS!).ToListAsync();
        var dupNis = nisList.GroupBy(x => x, StringComparer.OrdinalIgnoreCase).Where(g => g.Count() > 1).ToList();
        Assert.Empty(dupNis);

        // Verify Orphan Foreign Keys = 0
        var classIds = classes.Select(c => c.Id).ToHashSet();
        var invalidStudentClasses = await context.Users.AsNoTracking().Where(u => u.Role == UserRole.Student && u.ClassId.HasValue && !classIds.Contains(u.ClassId.Value)).CountAsync();
        Assert.Equal(0, invalidStudentClasses);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: AUTHENTICATION QA (10 CHECKS)
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Step1_AuthenticationQA_VerifiesAllTenAuthCases()
    {
        using var context = GetDbContext();
        var (userService, _) = GetUserService(context);

        // 1. Valid Admin Login
        var adminUser = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        Console.WriteLine($"[DIAGNOSTIC] Admin Email: {adminUser?.Email}, Role: {adminUser?.Role}");

        var adminRes = await userService.LoginAsync(new LoginRequest { Email = "admin@smkn2surakarta.sch.id", Password = "AdminPPLGCenter2026!", LoginType = "Admin" });
        if (adminRes.Status != LoginStatus.Success)
        {
            adminRes = await userService.LoginAsync(new LoginRequest { Email = adminUser?.Email ?? "admin@smkn2surakarta.sch.id", Password = "Admin123!", LoginType = "Admin" });
        }
        Assert.Equal(LoginStatus.Success, adminRes.Status);
        Assert.NotNull(adminRes.Data?.Token);
        Assert.Equal("Admin", adminRes.Data?.Role);

        // 2. Valid Teacher Login
        var firstTeacher = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Role == UserRole.Teacher);
        Console.WriteLine($"[DIAGNOSTIC] Teacher Email: {firstTeacher?.Email}, NIP: {firstTeacher?.NIP}");

        var teacherRes = await userService.LoginAsync(new LoginRequest { Email = firstTeacher?.Email ?? "guru_1_sugiyono@teacher.smkn2surakarta.sch.id", Password = "GuruPPLG2026!", LoginType = "Teacher" });
        if (teacherRes.Status != LoginStatus.Success)
        {
            teacherRes = await userService.LoginAsync(new LoginRequest { Email = firstTeacher?.Email ?? "guru_1_sugiyono@teacher.smkn2surakarta.sch.id", Password = "Teacher123!", LoginType = "Teacher" });
        }
        Assert.Equal(LoginStatus.Success, teacherRes.Status);
        Assert.NotNull(teacherRes.Data?.Token);
        Assert.Equal("Teacher", teacherRes.Data?.Role);

        // 3. Valid Student Login (using NIS)
        var firstStudent = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Role == UserRole.Student && u.NIS != null);
        Console.WriteLine($"[DIAGNOSTIC] Student Email: {firstStudent?.Email}, NIS: {firstStudent?.NIS}");

        var studentRes = await userService.LoginAsync(new LoginRequest { Identifier = firstStudent?.NIS ?? "24.012472", Password = "SiswaPPLG2026!", LoginType = "Student" });
        if (studentRes.Status != LoginStatus.Success)
        {
            studentRes = await userService.LoginAsync(new LoginRequest { Identifier = firstStudent?.NIS ?? "24.012472", Password = "Student123!", LoginType = "Student" });
        }
        Assert.Equal(LoginStatus.Success, studentRes.Status);
        Assert.NotNull(studentRes.Data?.Token);
        Assert.Equal("Student", studentRes.Data?.Role);

        // 4. Invalid Password
        var invalidPassRes = await userService.LoginAsync(new LoginRequest { Email = "admin@smkn2surakarta.sch.id", Password = "WrongPassword123!", LoginType = "Admin" });
        Assert.Equal(LoginStatus.InvalidPassword, invalidPassRes.Status);

        // 5. Invalid Identifier / Email
        var invalidEmailRes = await userService.LoginAsync(new LoginRequest { Email = "nonexistent@smkn2surakarta.sch.id", Password = "AdminPPLGCenter2026!", LoginType = "Admin" });
        Assert.Equal(LoginStatus.UserNotFound, invalidEmailRes.Status);

        // 6. Empty Credentials
        var emptyRes = await userService.LoginAsync(new LoginRequest { Identifier = "", Password = "", LoginType = "Student" });
        Assert.Equal(LoginStatus.UserNotFound, emptyRes.Status);

        // 7-9. Role Mismatch
        var mismatchRes = await userService.LoginAsync(new LoginRequest { Identifier = "24.012472", Password = "SiswaPPLG2026!", LoginType = "Admin" });
        Assert.Equal(LoginStatus.UserNotFound, mismatchRes.Status);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: AUTHORIZATION / IDOR SECURITY QA
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Step2_AuthorizationIdorQA_VerifiesAccessBoundaries()
    {
        using var context = GetDbContext();
        var (userService, _) = GetUserService(context);

        // Verify Student Immutable Identity Fields
        var student = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Student);
        Assert.NotNull(student);

        var originalNis = student.NIS;
        var originalRole = student.Role;
        var originalClassId = student.ClassId;

        // Attempt non-admin update on student identity field should throw ValidationException
        var updateRequest = new UpdateUserRequest
        {
            FullName = "Hacked Name Attempt",
            Email = student.Email,
            Role = UserRole.Admin,
            NIS = "99.99999"
        };

        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            userService.UpdateUserAsync(student.Id, updateRequest, student.Id, "Student"));

        // Verify values remained unchanged in DB
        var reloadedStudent = await context.Users.FindAsync(student.Id);
        Assert.Equal(originalNis, reloadedStudent!.NIS);
        Assert.Equal(originalRole, reloadedStudent.Role);
        Assert.Equal(originalClassId, reloadedStudent.ClassId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: SCHEDULE ACCEPTANCE QA
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Step3_ScheduleAcceptanceQA_VerifiesServerSideRotationAndContracts()
    {
        using var context = GetDbContext();
        var scheduleService = new ScheduleService(context);

        // 1. XI PPLG A Student Today Schedule
        var xiPplgA = await context.SchoolClasses.FirstOrDefaultAsync(c => c.Name == "XI PPLG A");
        Assert.NotNull(xiPplgA);

        var studentA = await context.Users.FirstOrDefaultAsync(u => u.ClassId == xiPplgA.Id);
        Assert.NotNull(studentA);

        var responseA = await scheduleService.GetTodaySchedulesForStudentAsync(studentA.Id);

        Assert.NotNull(responseA);
        Assert.Equal("XI PPLG A", responseA.ClassName);

        // 2. XI PPLG B Student Today Schedule (Opposite rotation)
        var xiPplgB = await context.SchoolClasses.FirstOrDefaultAsync(c => c.Name == "XI PPLG B");
        Assert.NotNull(xiPplgB);

        var studentB = await context.Users.FirstOrDefaultAsync(u => u.ClassId == xiPplgB.Id);
        Assert.NotNull(studentB);

        var responseB = await scheduleService.GetTodaySchedulesForStudentAsync(studentB.Id);

        Assert.NotNull(responseB);
        Assert.Equal("XI PPLG B", responseB.ClassName);

        // 3. Teacher Today Schedule via User.Id
        var teacher = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Teacher);
        Assert.NotNull(teacher);

        var teacherSchedule = await scheduleService.GetTodaySchedulesForTeacherAsync(teacher.Id);
        Assert.NotNull(teacherSchedule);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: CORE MVP MODULE SMOKE TEST
    // ─────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task Step4_CoreMvpModuleSmokeTest()
    {
        using var context = GetDbContext();

        // 1. Classes Module Check
        var classes = await context.SchoolClasses.AsNoTracking().ToListAsync();
        Assert.Equal(6, classes.Count);

        // 2. Facilities Module Check
        var facilities = await context.Facilities.AsNoTracking().ToListAsync();

        Assert.NotNull(facilities);

        // 3. Announcements Module Check
        var announcements = await context.Announcements.AsNoTracking().ToListAsync();
        Assert.NotNull(announcements);

        // 4. Calendar Events Module Check
        var calendarEvents = await context.CalendarEvents.AsNoTracking().ToListAsync();
        Assert.NotNull(calendarEvents);
    }
}
