using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class AttendanceLearningManagementTests
{
    private AppDbContext GetDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private async Task<(User teacher, User student1, User student2, Schedule schedule, ClassSubject classSubject)> SeedAcademicContextAsync(AppDbContext context)
    {
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Pengajar", Email = "guru@test.com", Role = UserRole.Teacher, IsActive = true, PasswordHash = "hash" };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1@test.com", Role = UserRole.Student, NIS = "1001", IsActive = true, PasswordHash = "hash" };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2", Email = "s2@test.com", Role = UserRole.Student, NIS = "1002", IsActive = true, PasswordHash = "hash" };

        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "RPL" };
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var semester = new Semester { Id = Guid.NewGuid(), AcademicYearId = year.Id, Name = "Semester Ganjil", Order = 1, IsActive = true };
        var cls = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };

        student1.ClassId = cls.Id;
        student2.ClassId = cls.Id;

        var subject = new Subject { Id = Guid.NewGuid(), Code = "PBO", Name = "Pemrograman Berbasis Objek" };
        var ts = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher.Id, SubjectId = subject.Id };
        var cs = new ClassSubject { Id = Guid.NewGuid(), ClassId = cls.Id, TeacherSubjectId = ts.Id };
        var sched = new Schedule { Id = Guid.NewGuid(), ClassSubjectId = cs.Id, SemesterId = semester.Id, DayOfWeek = DateTime.UtcNow.DayOfWeek, StartTime = TimeSpan.Parse("07:00"), EndTime = TimeSpan.Parse("08:30"), Room = "R.101" };

        context.Users.AddRange(teacher, student1, student2);
        context.Departments.Add(dept);
        context.AcademicYears.Add(year);
        context.Semesters.Add(semester);
        context.SchoolClasses.Add(cls);
        context.Subjects.Add(subject);
        context.TeacherSubjects.Add(ts);
        context.ClassSubjects.Add(cs);
        context.Schedules.Add(sched);
        await context.SaveChangesAsync();

        return (teacher, student1, student2, sched, cs);
    }

    [Fact]
    public async Task AttendanceSession_AutoGenerate_NotMarked_And_AutoAlpha_OnClose()
    {
        using var context = GetDbContext(nameof(AttendanceSession_AutoGenerate_NotMarked_And_AutoAlpha_OnClose));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);
        var service = new AttendanceService(context);

        // 1. Create Attendance Session
        var session = await service.CreateSessionAsync(teacher.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched.Id,
            Date = DateTime.UtcNow.Date,
            SessionNumber = 1
        });

        Assert.NotNull(session);
        Assert.Equal("Open", session.Status);
        Assert.Equal(2, session.TotalStudents);
        Assert.Equal(2, session.NotMarkedCount); // Initially all NotMarked

        // 2. Mark Student 1 as Present
        var updated = await service.UpdateStudentStatusAsync(session.Id, teacher.Id, new UpdateAttendanceStatusRequest
        {
            StudentId = student1.Id,
            Status = AttendanceStatus.Present
        });

        Assert.NotNull(updated);
        Assert.Equal(1, updated.PresentCount);
        Assert.Equal(1, updated.NotMarkedCount); // Student 2 is still NotMarked

        // 3. Close Session -> Student 2 should automatically become Alpha
        var closedSession = await service.CloseSessionAsync(session.Id, teacher.Id);
        Assert.NotNull(closedSession);
        Assert.Equal("Closed", closedSession.Status);
        Assert.Equal(1, closedSession.PresentCount);
        Assert.Equal(1, closedSession.AlphaCount); // Auto Alpha
        Assert.Equal(0, closedSession.NotMarkedCount);
    }

    [Fact]
    public async Task AttendanceSession_ClosedSession_Immutability_And_ReopenRejection()
    {
        using var context = GetDbContext(nameof(AttendanceSession_ClosedSession_Immutability_And_ReopenRejection));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);
        var service = new AttendanceService(context);

        var session = await service.CreateSessionAsync(teacher.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched.Id,
            Date = DateTime.UtcNow.Date
        });

        await service.CloseSessionAsync(session.Id, teacher.Id);

        // Attempting to update student status on closed session throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpdateStudentStatusAsync(session.Id, teacher.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = student1.Id,
                Status = AttendanceStatus.Present
            });
        });

        // Attempting to close already closed session throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CloseSessionAsync(session.Id, teacher.Id);
        });
    }

    [Fact]
    public async Task AttendanceSession_DuplicateSession_Rejection()
    {
        using var context = GetDbContext(nameof(AttendanceSession_DuplicateSession_Rejection));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);
        var service = new AttendanceService(context);

        var date = DateTime.UtcNow.Date;
        await service.CreateSessionAsync(teacher.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched.Id,
            Date = date
        });

        // Duplicate session on same schedule and date throws InvalidOperationException (HTTP 409 Conflict)
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await service.CreateSessionAsync(teacher.Id, new CreateAttendanceSessionRequest
            {
                ScheduleId = sched.Id,
                Date = date
            });
        });
    }

    [Fact]
    public async Task LessonMaterial_Visibility_And_TeacherAuthorization()
    {
        using var context = GetDbContext(nameof(LessonMaterial_Visibility_And_TeacherAuthorization));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);
        var materialService = new LessonMaterialService(context);

        var unauthorizedTeacher = new User { Id = Guid.NewGuid(), FullName = "Guru Lain", Email = "other@test.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        context.Users.Add(unauthorizedTeacher);
        await context.SaveChangesAsync();

        // 1. Unauthorized teacher creation throws UnauthorizedAccessException (HTTP 403 Forbidden)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await materialService.CreateAsync(unauthorizedTeacher.Id, new CreateLessonMaterialRequest
            {
                ClassSubjectId = cs.Id,
                Title = "Materi Ilegal",
                Visibility = "Published"
            });
        });

        // 2. Authorized teacher creates Draft material
        var draft = await materialService.CreateAsync(teacher.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Draft Modul 1",
            Visibility = "Draft"
        });

        Assert.NotNull(draft);
        Assert.Equal("Draft", draft.Visibility);

        // Student retrieving Draft material throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await materialService.GetByIdAsync(draft.Id, isStudent: true);
        });

        // Student list only contains Published materials
        var published = await materialService.CreateAsync(teacher.Id, new CreateLessonMaterialRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Modul Resmi 1",
            Visibility = "Published"
        });

        var studentMaterials = await materialService.GetStudentMaterialsAsync(student1.Id);
        Assert.Single(studentMaterials);
        Assert.Equal("Modul Resmi 1", studentMaterials.First().Title);
    }

    [Fact]
    public async Task Assignment_Validation_And_TeacherAuthorization()
    {
        using var context = GetDbContext(nameof(Assignment_Validation_And_TeacherAuthorization));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);
        var service = new AssignmentService(context);

        // DueDate <= PublishAt throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(teacher.Id, new CreateAssignmentRequest
            {
                ClassSubjectId = cs.Id,
                Title = "Tugas 1",
                PublishAt = DateTime.UtcNow.AddDays(1),
                DueDate = DateTime.UtcNow, // Invalid
                MaxScore = 100
            });
        });

        // MaxScore <= 0 throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.CreateAsync(teacher.Id, new CreateAssignmentRequest
            {
                ClassSubjectId = cs.Id,
                Title = "Tugas Invalid",
                PublishAt = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(1),
                MaxScore = 0
            });
        });

        var validAssignment = await service.CreateAsync(teacher.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Tugas 1 PBO",
            PublishAt = DateTime.UtcNow.AddMinutes(-5),
            DueDate = DateTime.UtcNow.AddDays(3),
            MaxScore = 100
        });

        Assert.NotNull(validAssignment);
        Assert.Equal("Tugas 1 PBO", validAssignment.Title);
    }

    [Fact]
    public async Task Submission_RevisionHistory_And_GradingValidation()
    {
        using var context = GetDbContext(nameof(Submission_RevisionHistory_And_GradingValidation));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);
        var assignService = new AssignmentService(context);
        var subService = new SubmissionService(context);

        var assignment = await assignService.CreateAsync(teacher.Id, new CreateAssignmentRequest
        {
            ClassSubjectId = cs.Id,
            Title = "Praktikum 1",
            PublishAt = DateTime.UtcNow.AddMinutes(-5),
            DueDate = DateTime.UtcNow.AddDays(1),
            MaxScore = 100
        });

        // 1. First Submission (Version 1)
        var sub1 = await subService.SubmitAssignmentAsync(student1.Id, new CreateSubmissionRequest
        {
            AssignmentId = assignment.Id,
            SubmissionType = "FILE",
            FileUrl = "https://example.com/v1.pdf",
            Comment = "Versi 1"
        });

        Assert.NotNull(sub1);
        Assert.Equal(1, sub1.LatestVersion);
        Assert.Single(sub1.Revisions);

        // 2. Re-submission before deadline (Version 2 - History preserved!)
        var sub2 = await subService.SubmitAssignmentAsync(student1.Id, new CreateSubmissionRequest
        {
            AssignmentId = assignment.Id,
            SubmissionType = "FILE",
            FileUrl = "https://example.com/v2.pdf",
            Comment = "Versi 2 revisi"
        });

        Assert.Equal(2, sub2.LatestVersion);
        Assert.Equal(2, sub2.Revisions.Count); // Both v1 and v2 preserved in revision history

        // 3. Teacher Grade Submission
        var graded = await subService.GradeSubmissionAsync(sub2.Id, teacher.Id, new GradeSubmissionRequest
        {
            Score = 95.0,
            Feedback = "Sangat Baik"
        });

        Assert.NotNull(graded);
        Assert.Equal(95.0, graded.Score);
        Assert.Equal("Sangat Baik", graded.Feedback);

        // Score > MaxScore throws ValidationException
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await subService.GradeSubmissionAsync(sub2.Id, teacher.Id, new GradeSubmissionRequest
            {
                Score = 150.0 // Max is 100
            });
        });
    }

    [Fact]
    public async Task DashboardAggregationService_MetricsCalculation()
    {
        using var context = GetDbContext(nameof(DashboardAggregationService_MetricsCalculation));
        var (teacher, student1, student2, sched, cs) = await SeedAcademicContextAsync(context);

        var schedService = new ScheduleService(context);
        var matService = new LessonMaterialService(context);
        var assignService = new AssignmentService(context);
        var eventService = new AcademicEventService(context);

        var dashboardService = new DashboardAggregationService(context, schedService, matService, assignService, eventService);

        var adminDash = await dashboardService.GetAdminDashboardAsync();
        Assert.NotNull(adminDash);
        Assert.True(adminDash.TotalUsers >= 3);
        Assert.Equal(1, adminDash.TotalClasses);
        Assert.Equal(1, adminDash.TotalSubjects);

        var teacherDash = await dashboardService.GetTeacherDashboardAsync(teacher.Id);
        Assert.NotNull(teacherDash);
        Assert.Equal(teacher.FullName, teacherDash.TeacherName);

        var studentDash = await dashboardService.GetStudentDashboardAsync(student1.Id);
        Assert.NotNull(studentDash);
        Assert.Equal(student1.FullName, studentDash.StudentName);
        Assert.Equal(100.0, studentDash.AttendancePercentage);
    }

    [Fact]
    public async Task AttendanceService_SecurityAndBoundaryRules_Enforced()
    {
        using var context = GetDbContext(nameof(AttendanceService_SecurityAndBoundaryRules_Enforced));
        var (teacher1, student1, student2, sched1, cs1) = await SeedAcademicContextAsync(context);
        var service = new AttendanceService(context);

        // Seed Class 2 with Teacher 2 and Student 3
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2_att@test.com", Role = UserRole.Teacher, IsActive = true, PasswordHash = "hash" };
        var student3 = new User { Id = Guid.NewGuid(), FullName = "Siswa 3", Email = "s3_att@test.com", Role = UserRole.Student, NIS = "1003", IsActive = true, PasswordHash = "hash" };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Att", Email = "admin_att@test.com", Role = UserRole.Admin, IsActive = true, PasswordHash = "hash" };

        var dept = await context.Departments.FirstAsync();
        var year = await context.AcademicYears.FirstAsync();
        var semester = await context.Semesters.FirstAsync();
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };
        student3.ClassId = class2.Id;

        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "MTK", Name = "Matematika" };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = subject2.Id };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, TeacherSubjectId = ts2.Id };
        var sched2 = new Schedule { Id = Guid.NewGuid(), ClassSubjectId = cs2.Id, SemesterId = semester.Id, DayOfWeek = DateTime.UtcNow.DayOfWeek, StartTime = TimeSpan.Parse("08:30"), EndTime = TimeSpan.Parse("10:00"), Room = "R.102" };

        context.Users.AddRange(teacher2, student3, admin);
        context.SchoolClasses.Add(class2);
        context.Subjects.Add(subject2);
        context.TeacherSubjects.Add(ts2);
        context.ClassSubjects.Add(cs2);
        context.Schedules.Add(sched2);
        await context.SaveChangesAsync();

        // 1. Teacher 1 opens session for Class 1 (sched1)
        var sess1 = await service.CreateSessionAsync(teacher1.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched1.Id,
            Date = DateTime.UtcNow.Date,
            SessionNumber = 1
        });

        // 2. Teacher 2 opens session for Class 2 (sched2)
        var sess2 = await service.CreateSessionAsync(teacher2.Id, new CreateAttendanceSessionRequest
        {
            ScheduleId = sched2.Id,
            Date = DateTime.UtcNow.Date,
            SessionNumber = 1
        });

        // --- STUDENT ISOLATION TESTS ---
        // Student 1 can list own class sessions
        var s1List = await service.GetAllSessionsAsync(student1.Id, "Student");
        Assert.Single(s1List);
        Assert.Equal(sess1.Id, s1List[0].Id);

        // Student 1 cannot view Class 2 session detail (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetSessionByIdAsync(sess2.Id, student1.Id, "Student"));

        // Student 1 viewing Class 1 session receives ONLY THEIR OWN attendance record
        var s1Detail = await service.GetSessionByIdAsync(sess1.Id, student1.Id, "Student");
        Assert.NotNull(s1Detail);
        Assert.Single(s1Detail.Attendances); // Record-level isolation: 1 record instead of 2!
        Assert.Equal(student1.Id, s1Detail.Attendances[0].StudentId);

        // --- TEACHER SCOPE & MUTATION TESTS ---
        // Teacher 1 can list own assigned sessions
        var t1List = await service.GetAllSessionsAsync(teacher1.Id, "Teacher");
        Assert.Single(t1List);
        Assert.Equal(sess1.Id, t1List[0].Id);

        // Teacher 1 viewing Class 1 session receives full class attendance roster
        var t1Detail = await service.GetSessionByIdAsync(sess1.Id, teacher1.Id, "Teacher");
        Assert.NotNull(t1Detail);
        Assert.Equal(2, t1Detail.Attendances.Count); // Full roster (Student 1 & Student 2)

        // Teacher 1 cannot view Teacher 2's session detail (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.GetSessionByIdAsync(sess2.Id, teacher1.Id, "Teacher"));

        // Unassigned Teacher 1 cannot update student status in Teacher 2's session (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateStudentStatusAsync(sess2.Id, teacher1.Id, new UpdateAttendanceStatusRequest
            {
                StudentId = student3.Id,
                Status = AttendanceStatus.Present
            }));

        // Unassigned Teacher 1 cannot close Teacher 2's session (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CloseSessionAsync(sess2.Id, teacher1.Id));

        // --- ADMIN ACCESS TESTS ---
        // Admin can list all sessions system-wide
        var adminList = await service.GetAllSessionsAsync(admin.Id, "Admin");
        Assert.Equal(2, adminList.Count);

        // Admin can update attendance in any session
        var adminUpdated = await service.UpdateStudentStatusAsync(sess2.Id, admin.Id, new UpdateAttendanceStatusRequest
        {
            StudentId = student3.Id,
            Status = AttendanceStatus.Present
        });
        Assert.NotNull(adminUpdated);
        Assert.Equal(1, adminUpdated.PresentCount);

        // Admin can close any session
        var adminClosed = await service.CloseSessionAsync(sess2.Id, admin.Id);
        Assert.NotNull(adminClosed);
        Assert.Equal("Closed", adminClosed.Status);
    }
}
