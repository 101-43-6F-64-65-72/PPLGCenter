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

    [Fact]
    public async Task AssessmentService_AuthorizationAndValidationBoundaries_Enforced()
    {
        using var context = GetInMemoryDbContext();
        var assessmentService = new AssessmentService(context);

        var dept = new Department { Id = Guid.NewGuid(), Name = "TKJ", Code = "TKJ" };
        var cls1 = await context.SchoolClasses.FirstAsync();
        var cls2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X TKJ 1", DepartmentId = dept.Id };
        var subject = await context.Subjects.FirstAsync();
        var category = await context.GradeCategories.FirstAsync();

        var teacher1 = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2@test.id", Role = UserRole.Teacher };
        var student1 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1001");
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Class 2", Email = "s2_cls2@test.id", Role = UserRole.Student, ClassId = cls2.Id };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@test.id", Role = UserRole.Admin };

        var classSubject1 = await context.ClassSubjects.FirstAsync();

        context.Departments.Add(dept);
        context.SchoolClasses.Add(cls2);
        context.Users.AddRange(teacher2, student2, admin);
        await context.SaveChangesAsync();

        // 1. Invalid MaxScore <= 0 throws ValidationException
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            assessmentService.CreateAssessmentAsync(teacher1.Id, new CreateAssessmentRequest
            {
                ClassSubjectId = classSubject1.Id,
                GradeCategoryId = category.Id,
                Title = "MaxScore Invalid",
                MaxScore = 0.0m
            }));

        // 2. Invalid DueDate <= PublishAt throws ValidationException
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            assessmentService.CreateAssessmentAsync(teacher1.Id, new CreateAssessmentRequest
            {
                ClassSubjectId = classSubject1.Id,
                GradeCategoryId = category.Id,
                Title = "Dates Invalid",
                MaxScore = 100.0m,
                PublishAt = DateTime.UtcNow.AddDays(5),
                DueDate = DateTime.UtcNow.AddDays(2)
            }));

        // 3. Authorized Teacher 1 creates published assessment for classSubject1
        var ass1 = await assessmentService.CreateAssessmentAsync(teacher1.Id, new CreateAssessmentRequest
        {
            ClassSubjectId = classSubject1.Id,
            GradeCategoryId = category.Id,
            Title = "Kuis 1",
            MaxScore = 100.0m,
            PublishAt = DateTime.UtcNow.AddHours(-1),
            DueDate = DateTime.UtcNow.AddDays(3),
            IsPublished = true
        });
        Assert.NotNull(ass1);

        // 4. Authorized Teacher 1 creates draft (unpublished) assessment
        var draftAss = await assessmentService.CreateAssessmentAsync(teacher1.Id, new CreateAssessmentRequest
        {
            ClassSubjectId = classSubject1.Id,
            GradeCategoryId = category.Id,
            Title = "Draft Exam",
            MaxScore = 100.0m,
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(5),
            IsPublished = false
        });

        // 5. Unauthorized Teacher 2 cannot create assessment for ClassSubject 1
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            assessmentService.CreateAssessmentAsync(teacher2.Id, new CreateAssessmentRequest
            {
                ClassSubjectId = classSubject1.Id,
                GradeCategoryId = category.Id,
                Title = "Hacked Assessment",
                MaxScore = 100.0m
            }));

        // 6. Unauthorized Teacher 2 cannot update Teacher 1's assessment
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            assessmentService.UpdateAssessmentAsync(ass1.Id, teacher2.Id, new UpdateAssessmentRequest
            {
                GradeCategoryId = category.Id,
                Title = "Hacked Update",
                MaxScore = 100.0m
            }));

        // 7. Unauthorized Teacher 2 cannot delete Teacher 1's assessment
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            assessmentService.DeleteAssessmentAsync(ass1.Id, teacher2.Id));

        // 8. Student 1 (Class 1) can read published ass1
        var studentView = await assessmentService.GetAssessmentByIdAsync(ass1.Id, student1.Id, "Student");
        Assert.NotNull(studentView);

        // 9. Student 1 cannot read draftAss (unpublished)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            assessmentService.GetAssessmentByIdAsync(draftAss.Id, student1.Id, "Student"));

        // 10. Student 2 (Class 2) cannot read ass1 (belongs to Class 1)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            assessmentService.GetAssessmentByIdAsync(ass1.Id, student2.Id, "Student"));

        // 11. Admin can update ass1
        var adminUpdated = await assessmentService.UpdateAssessmentAsync(ass1.Id, admin.Id, new UpdateAssessmentRequest
        {
            GradeCategoryId = category.Id,
            Title = "Admin Updated Title",
            MaxScore = 100.0m
        });
        Assert.NotNull(adminUpdated);
        Assert.Equal("Admin Updated Title", adminUpdated!.Title);
    }

    [Fact]
    public async Task StudentGradeService_SecurityAndBoundaryRules_Enforced()
    {
        using var context = GetInMemoryDbContext();
        var engine = new GradeCalculationService(context);
        var gradeService = new StudentGradeService(context, engine);
        var assessmentService = new AssessmentService(context);

        var teacher1 = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2_grade@test.id", Role = UserRole.Teacher };
        var student1 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1001");
        var student2 = await context.Users.FirstAsync(u => u.Role == UserRole.Student && u.NIS == "1002");
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Grade", Email = "admin_grade@test.id", Role = UserRole.Admin };

        var classSubject1 = await context.ClassSubjects.FirstAsync();
        var category = await context.GradeCategories.FirstAsync();

        context.Users.AddRange(teacher2, admin);
        await context.SaveChangesAsync();

        var ass = await assessmentService.CreateAssessmentAsync(teacher1.Id, new CreateAssessmentRequest
        {
            ClassSubjectId = classSubject1.Id,
            GradeCategoryId = category.Id,
            Title = "Kuis Matematika",
            MaxScore = 100.0m,
            IsPublished = true
        });

        // 1. Assigned Teacher 1 can read gradebook
        var gb1 = await gradeService.GetTeacherGradebookAsync(teacher1.Id, classSubject1.Id);
        Assert.NotNull(gb1);

        // 2. Unassigned Teacher 2 cannot read Class 1 gradebook (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            gradeService.GetTeacherGradebookAsync(teacher2.Id, classSubject1.Id));

        // 3. Assigned Teacher 1 upserts grade for Student 1
        var g1 = await gradeService.UpsertGradeAsync(teacher1.Id, ass.Id, new GradeItemRequest
        {
            StudentId = student1.Id,
            RawScore = 85.0m,
            Remarks = "Bagus"
        }, publish: true);
        Assert.NotNull(g1);
        Assert.Equal(85.0m, g1.RawScore);

        // 4. Repeated upsert updates existing record without creating duplicates
        var g1Updated = await gradeService.UpsertGradeAsync(teacher1.Id, ass.Id, new GradeItemRequest
        {
            StudentId = student1.Id,
            RawScore = 90.0m,
            Remarks = "Sangat Bagus"
        }, publish: true);
        Assert.Equal(g1.Id, g1Updated.Id);
        Assert.Equal(90.0m, g1Updated.RawScore);
        var totalGradesForStudent1 = await context.StudentGrades.CountAsync(g => g.AssessmentId == ass.Id && g.StudentId == student1.Id);
        Assert.Equal(1, totalGradesForStudent1);

        // 5. Unassigned Teacher 2 cannot modify Student 1's grade (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            gradeService.UpsertGradeAsync(teacher2.Id, ass.Id, new GradeItemRequest
            {
                StudentId = student1.Id,
                RawScore = 50.0m
            }));

        // 6. Negative score < 0 rejected (ValidationException)
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            gradeService.UpsertGradeAsync(teacher1.Id, ass.Id, new GradeItemRequest
            {
                StudentId = student1.Id,
                RawScore = -10.0m
            }));

        // 7. Score > MaxScore (100) rejected (ValidationException)
        await Assert.ThrowsAsync<System.ComponentModel.DataAnnotations.ValidationException>(() =>
            gradeService.UpsertGradeAsync(teacher1.Id, ass.Id, new GradeItemRequest
            {
                StudentId = student1.Id,
                RawScore = 105.0m
            }));

        // 8. Student 1 can read own published grade record
        var student1GradeView = await gradeService.GetGradeByIdAsync(g1.Id, student1.Id, "Student");
        Assert.NotNull(student1GradeView);
        Assert.Equal(90.0m, student1GradeView!.RawScore);

        // 9. Student 2 cannot read Student 1's grade record (throws UnauthorizedAccessException)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            gradeService.GetGradeByIdAsync(g1.Id, student2.Id, "Student"));

        // 10. Admin can read gradebook and upsert grade
        var adminGb = await gradeService.GetTeacherGradebookAsync(admin.Id, classSubject1.Id);
        Assert.NotNull(adminGb);
        var adminGrade = await gradeService.UpsertGradeAsync(admin.Id, ass.Id, new GradeItemRequest
        {
            StudentId = student2.Id,
            RawScore = 75.0m
        }, publish: true);
        Assert.NotNull(adminGrade);
    }
}
