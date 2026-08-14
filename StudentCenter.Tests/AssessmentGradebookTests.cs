using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class AssessmentGradebookTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedBaseData(context);
        return context;
    }

    private void SeedBaseData(AppDbContext context)
    {
        // 1. Grade Scales
        context.GradeScales.AddRange(new[]
        {
            new GradeScale { Id = Guid.NewGuid(), Letter = "A", Minimum = 90.0m, Maximum = 100.0m, Predicate = "Sangat Baik", IsActive = true },
            new GradeScale { Id = Guid.NewGuid(), Letter = "B", Minimum = 80.0m, Maximum = 89.99m, Predicate = "Baik", IsActive = true },
            new GradeScale { Id = Guid.NewGuid(), Letter = "C", Minimum = 70.0m, Maximum = 79.99m, Predicate = "Cukup", IsActive = true },
            new GradeScale { Id = Guid.NewGuid(), Letter = "D", Minimum = 60.0m, Maximum = 69.99m, Predicate = "Kurang", IsActive = true },
            new GradeScale { Id = Guid.NewGuid(), Letter = "E", Minimum = 0.0m, Maximum = 59.99m, Predicate = "Sangat Kurang", IsActive = true }
        });

        // 2. Grade Categories
        var catTugas = new GradeCategory { Id = Guid.NewGuid(), Name = "Tugas", Weight = 30.0m, Type = GradeCategoryType.Assignment, IsActive = true };
        var catUts = new GradeCategory { Id = Guid.NewGuid(), Name = "UTS", Weight = 30.0m, Type = GradeCategoryType.Exam, IsActive = true };
        var catUas = new GradeCategory { Id = Guid.NewGuid(), Name = "UAS", Weight = 40.0m, Type = GradeCategoryType.Exam, IsActive = true };
        context.GradeCategories.AddRange(catTugas, catUts, catUas);

        // 3. Academic Structure
        var dept = new Department { Id = Guid.NewGuid(), Name = "RPL", Code = "RPL" };
        var schoolClass = new SchoolClass { Id = Guid.NewGuid(), Name = "XII RPL 1", DepartmentId = dept.Id };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Pemrograman Web", Code = "PW" };

        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Matematika", Email = "guru@test.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa 1", Email = "s1@test.id", Role = UserRole.Student, NIS = "1001", ClassId = schoolClass.Id, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa 2", Email = "s2@test.id", Role = UserRole.Student, NIS = "1002", ClassId = schoolClass.Id, IsActive = true };

        var teacherSubject = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher.Id, SubjectId = subject.Id };
        var classSubject = new ClassSubject { Id = Guid.NewGuid(), ClassId = schoolClass.Id, TeacherSubjectId = teacherSubject.Id };

        context.Departments.Add(dept);
        context.SchoolClasses.Add(schoolClass);
        context.Subjects.Add(subject);
        context.Users.AddRange(teacher, student1, student2);
        context.TeacherSubjects.Add(teacherSubject);
        context.ClassSubjects.Add(classSubject);

        context.SaveChanges();
    }

    [Fact]
    public async Task GradeCalculationEngine_MatchGradeScale_ReturnsCorrectGradeAndPredicate()
    {
        using var context = GetInMemoryDbContext();
        var engine = new GradeCalculationService(context);

        var (letterA, predA) = await engine.GetGradeScaleAsync(95.5m);
        Assert.Equal("A", letterA);
        Assert.Equal("Sangat Baik", predA);

        var (letterC, predC) = await engine.GetGradeScaleAsync(72.0m);
        Assert.Equal("C", letterC);
        Assert.Equal("Cukup", predC);

        var (letterE, predE) = await engine.GetGradeScaleAsync(45.0m);
        Assert.Equal("E", letterE);
        Assert.Equal("Sangat Kurang", predE);
    }

    [Fact]
    public async Task GradeCalculationEngine_WeightedScoreAndRankings_CalculatesCorrectly()
    {
        using var context = GetInMemoryDbContext();
        var engine = new GradeCalculationService(context);

        var categories = await context.GradeCategories.ToListAsync();
        var catTugas = categories.First(c => c.Name == "Tugas"); // 30%
        var catUas = categories.First(c => c.Name == "UAS");     // 40%

        var ass1 = new Assessment { Id = Guid.NewGuid(), GradeCategoryId = catTugas.Id, MaxScore = 100.0m };
        var ass2 = new Assessment { Id = Guid.NewGuid(), GradeCategoryId = catUas.Id, MaxScore = 100.0m };

        var grades = new List<StudentGrade>
        {
            new StudentGrade { AssessmentId = ass1.Id, RawScore = 80.0m, IsPublished = true }, // 80 in Tugas (30% weight)
            new StudentGrade { AssessmentId = ass2.Id, RawScore = 90.0m, IsPublished = true }  // 90 in UAS (40% weight)
        };

        // Total weight present = 70. 
        // Weighted avg = (80 * 30/70) + (90 * 40/70) = 34.285 + 51.428 = 85.71
        decimal finalScore = engine.CalculateWeightedSubjectScore(grades, new[] { ass1, ass2 }, categories);
        Assert.Equal(85.71m, finalScore);

        var studentRows = new List<GradebookStudentRow>
        {
            new GradebookStudentRow { StudentName = "Budi", FinalSubjectScore = 85.71m },
            new GradebookStudentRow { StudentName = "Andi", FinalSubjectScore = 92.00m },
            new GradebookStudentRow { StudentName = "Cici", FinalSubjectScore = 70.00m }
        };

        var ranked = engine.CalculateClassRankings(studentRows);
        Assert.Equal(1, ranked.First(r => r.StudentName == "Andi").ClassRank);
        Assert.Equal(2, ranked.First(r => r.StudentName == "Budi").ClassRank);
        Assert.Equal(3, ranked.First(r => r.StudentName == "Cici").ClassRank);
    }

    [Fact]
    public async Task AssessmentService_CreateAndPublishAssessment_TriggersNotifications()
    {
        using var context = GetInMemoryDbContext();
        var assessmentService = new AssessmentService(context);

        var classSubject = await context.ClassSubjects.FirstAsync();
        var category = await context.GradeCategories.FirstAsync();
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);

        var req = new CreateAssessmentRequest
        {
            ClassSubjectId = classSubject.Id,
            GradeCategoryId = category.Id,
            Title = "Kuis 1 Pemrograman Web",
            Description = "Materi HTML & CSS",
            MaxScore = 100.0m,
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(3),
            IsPublished = true
        };

        var created = await assessmentService.CreateAssessmentAsync(teacher.Id, req);

        Assert.NotNull(created);
        Assert.Equal("Kuis 1 Pemrograman Web", created.Title);
        Assert.True(created.IsPublished);

        // Check Notification generated for enrolled students
        var notifs = await context.Notifications.ToListAsync();
        Assert.NotEmpty(notifs);
        Assert.Contains(notifs, n => n.Title.Contains("Penilaian Baru"));
    }

    [Fact]
    public async Task StudentGradeService_BulkGradingAndPublish_UpdatesGradesAndSendsNotifications()
    {
        using var context = GetInMemoryDbContext();
        var engine = new GradeCalculationService(context);
        var assessmentService = new AssessmentService(context);
        var gradeService = new StudentGradeService(context, engine);

        var classSubject = await context.ClassSubjects.FirstAsync();
        var category = await context.GradeCategories.FirstAsync();
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var students = await context.Users.Where(u => u.Role == UserRole.Student).ToListAsync();

        var ass = await assessmentService.CreateAssessmentAsync(teacher.Id, new CreateAssessmentRequest
        {
            ClassSubjectId = classSubject.Id,
            GradeCategoryId = category.Id,
            Title = "Tugas 1",
            MaxScore = 100.0m,
            IsPublished = true
        });

        var bulkReq = new BulkGradeRequest
        {
            AssessmentId = ass.Id,
            PublishImmediately = true,
            Items = new List<GradeItemRequest>
            {
                new GradeItemRequest { StudentId = students[0].Id, RawScore = 95.0m, Remarks = "Sangat Bagus" },
                new GradeItemRequest { StudentId = students[1].Id, RawScore = 78.0m, Remarks = "Perlu Perbaikan" }
            }
        };

        var graded = await gradeService.BulkGradeAsync(teacher.Id, bulkReq);
        Assert.Equal(2, graded.Count);
        Assert.Equal("A", graded.First(g => g.StudentId == students[0].Id).LetterGrade);
        Assert.Equal("C", graded.First(g => g.StudentId == students[1].Id).LetterGrade);

        // Verify Gradebook view
        var gradebook = await gradeService.GetTeacherGradebookAsync(teacher.Id, classSubject.Id);
        Assert.NotNull(gradebook);
        Assert.Equal(2, gradebook.TotalStudents);
        Assert.Single(gradebook.Assessments);

        // Verify Student Transcript
        var transcript = await gradeService.GetStudentTranscriptAsync(students[0].Id);
        Assert.NotNull(transcript);
        Assert.Equal(4.0m, transcript.OverallGpa);
    }

    [Fact]
    public async Task StudentGradeService_ImportExportCsv_HandlesDataCorrectly()
    {
        using var context = GetInMemoryDbContext();
        var engine = new GradeCalculationService(context);
        var assessmentService = new AssessmentService(context);
        var gradeService = new StudentGradeService(context, engine);

        var classSubject = await context.ClassSubjects.FirstAsync();
        var category = await context.GradeCategories.FirstAsync();
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);

        var ass = await assessmentService.CreateAssessmentAsync(teacher.Id, new CreateAssessmentRequest
        {
            ClassSubjectId = classSubject.Id,
            GradeCategoryId = category.Id,
            Title = "Ujian Tengah Semester",
            MaxScore = 100.0m
        });

        string csvContent = "NIS,Nama,RawScore,Remarks\n1001,Siswa 1,88.5,Bagus\n1002,Siswa 2,65.0,Kurang";

        var (importedCount, errors) = await gradeService.ImportGradesCsvAsync(teacher.Id, ass.Id, csvContent);
        Assert.Equal(2, importedCount);
        Assert.Empty(errors);

        string exportedCsv = await gradeService.ExportGradesCsvAsync(teacher.Id, ass.Id);
        Assert.Contains("1001", exportedCsv);
        Assert.Contains("88.5", exportedCsv);
        Assert.Contains("1002", exportedCsv);
    }

    [Fact]
    public async Task ReportCardService_AggregatesReportCardSummary_ReturnsCompleteData()
    {
        using var context = GetInMemoryDbContext();
        var engine = new GradeCalculationService(context);
        var gradeService = new StudentGradeService(context, engine);
        var reportCardService = new ReportCardService(context, gradeService);

        var student = await context.Users.FirstAsync(u => u.Role == UserRole.Student);

        var reportCard = await reportCardService.GetStudentReportCardSummaryAsync(student.Id);

        Assert.NotNull(reportCard);
        Assert.Equal(student.FullName, reportCard.StudentName);
        Assert.Equal(100.0, reportCard.AttendancePercentage);
        Assert.NotEmpty(reportCard.TeacherRemarks);
    }
}
