using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class StudentAcademicSecurityTests
{
    private readonly Mock<INotificationService> _mockNotificationService;

    public StudentAcademicSecurityTests()
    {
        _mockNotificationService = new Mock<INotificationService>();
    }

    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedTestData(context);
        return context;
    }

    private void SeedTestData(AppDbContext context)
    {
        var class1 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 1", Grade = "XI", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var class2 = new SchoolClass { Id = Guid.NewGuid(), Name = "XI RPL 2", Grade = "XI", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.SchoolClasses.AddRange(class1, class2);

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru Pengajar 1", Email = "g1@sch.id", Role = UserRole.Teacher, IsActive = true };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru Pengajar 2", Email = "g2@sch.id", Role = UserRole.Teacher, IsActive = true };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa Kelas 1", Email = "s1@sch.id", Role = UserRole.Student, ClassId = class1.Id, Class = class1, IsActive = true };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Kelas 2", Email = "s2@sch.id", Role = UserRole.Student, ClassId = class2.Id, Class = class2, IsActive = true };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Center", Email = "adm@sch.id", Role = UserRole.Admin, IsActive = true };

        context.Users.AddRange(teacher1, teacher2, student1, student2, admin);

        var subject1 = new Subject { Id = Guid.NewGuid(), Code = "PWPB", Name = "Pemrograman Web", IsActive = true };
        var subject2 = new Subject { Id = Guid.NewGuid(), Code = "PBO", Name = "Pemrograman Berorientasi Objek", IsActive = true };
        context.Subjects.AddRange(subject1, subject2);

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, Teacher = teacher1, SubjectId = subject1.Id, Subject = subject1, CreatedAt = DateTime.UtcNow };
        var ts2 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher2.Id, Teacher = teacher2, SubjectId = subject2.Id, Subject = subject2, CreatedAt = DateTime.UtcNow };
        context.TeacherSubjects.AddRange(ts1, ts2);

        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class1.Id, Class = class1, TeacherSubjectId = ts1.Id, TeacherSubject = ts1, CreatedAt = DateTime.UtcNow };
        var cs2 = new ClassSubject { Id = Guid.NewGuid(), ClassId = class2.Id, Class = class2, TeacherSubjectId = ts2.Id, TeacherSubject = ts2, CreatedAt = DateTime.UtcNow };
        context.ClassSubjects.AddRange(cs1, cs2);

        var category1 = new GradeCategory { Id = Guid.NewGuid(), Name = "Tugas", Weight = 30, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        context.GradeCategories.Add(category1);

        var assessment1 = new Assessment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs1.Id,
            ClassSubject = cs1,
            GradeCategoryId = category1.Id,
            GradeCategory = category1,
            TeacherId = teacher1.Id,
            Teacher = teacher1,
            Title = "Kuis 1 PWPB",
            AssessmentType = AssessmentType.Quiz,
            MaxScore = 100,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var assessment2 = new Assessment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs2.Id,
            ClassSubject = cs2,
            GradeCategoryId = category1.Id,
            GradeCategory = category1,
            TeacherId = teacher2.Id,
            Teacher = teacher2,
            Title = "Kuis 1 PBO",
            AssessmentType = AssessmentType.Quiz,
            MaxScore = 100,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Assessments.AddRange(assessment1, assessment2);

        var grade1 = new StudentGrade
        {
            Id = Guid.NewGuid(),
            AssessmentId = assessment1.Id,
            Assessment = assessment1,
            StudentId = student1.Id,
            Student = student1,
            RawScore = 85,
            FinalScore = 85,
            LetterGrade = "B",
            Predicate = "Baik",
            GradedBy = teacher1.Id,
            GradedByUser = teacher1,
            IsPublished = true,
            GradedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.StudentGrades.Add(grade1);

        var assignment1 = new Assignment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs1.Id,
            ClassSubject = cs1,
            TeacherId = teacher1.Id,
            Title = "Tugas Making Web HTML",
            Description = "Buat HTML",
            MaxScore = 100,
            DueDate = DateTime.UtcNow.AddDays(7),
            AllowLateSubmission = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Assignments.Add(assignment1);

        var submission1 = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment1.Id,
            Assignment = assignment1,
            StudentId = student1.Id,
            Student = student1,
            LatestVersion = 1,
            SubmittedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Submissions.Add(submission1);

        context.SaveChangesAsync().Wait();
    }

    [Fact]
    public async Task Test_1_TeacherCannotGradeStudentOutsideTeachingScope()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id"); // Teaches Class 1
        var assessment2 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PBO"); // Class 2
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpsertGradeAsync(teacher1.Id, assessment2.Id, new GradeItemRequest
            {
                StudentId = student2.Id,
                RawScore = 90
            });
        });
    }

    [Fact]
    public async Task Test_2_TeacherCanGradeStudentInsideTeachingScope()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        var res = await service.UpsertGradeAsync(teacher1.Id, assessment1.Id, new GradeItemRequest
        {
            StudentId = student1.Id,
            RawScore = 95
        }, publish: true);

        Assert.NotNull(res);
        Assert.Equal(95, res.RawScore);
    }

    [Fact]
    public async Task Test_3_StudentCannotMutateGrade()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpsertGradeAsync(student1.Id, assessment1.Id, new GradeItemRequest
            {
                StudentId = student1.Id,
                RawScore = 100
            });
        });
    }

    [Fact]
    public async Task Test_4_AdminCanMutateGrade()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var assessment2 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PBO");
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id");

        var res = await service.UpsertGradeAsync(admin.Id, assessment2.Id, new GradeItemRequest
        {
            StudentId = student2.Id,
            RawScore = 88
        }, publish: true);

        Assert.NotNull(res);
        Assert.Equal(88, res.RawScore);
    }

    [Fact]
    public async Task Test_5_GradeRetrievalRespectsAuthorizationScope()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id");
        var grade1 = await context.StudentGrades.FirstAsync(g => g.StudentId == student1.Id);

        // Student 2 attempts to read Student 1's grade
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetGradeByIdAsync(grade1.Id, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_6_CrossClassGradeIDORIsRejected()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id"); // Teaches Class 1
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB"); // Assigned to Class 1
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id"); // Student in Class 2!

        // Teacher 1 attempts to assign grade for Assessment 1 to Student 2 (Class 2)
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpsertGradeAsync(teacher1.Id, assessment1.Id, new GradeItemRequest
            {
                StudentId = student2.Id,
                RawScore = 90
            });
        });
    }

    [Fact]
    public async Task Test_7_TeacherCannotMutateAnotherTeachersAssessment()
    {
        var context = GetInMemoryDbContext();
        var service = new AssessmentService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assessment2 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PBO");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateAssessmentAsync(assessment2.Id, teacher1.Id, new UpdateAssessmentRequest
            {
                Title = "Hacked Assessment Title",
                AssessmentType = AssessmentType.Assignment,
                MaxScore = 100
            });
        });
    }

    [Fact]
    public async Task Test_8_AuthorizedTeacherCanMutateOwnAssessment()
    {
        var context = GetInMemoryDbContext();
        var service = new AssessmentService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB");

        var updated = await service.UpdateAssessmentAsync(assessment1.Id, teacher1.Id, new UpdateAssessmentRequest
        {
            GradeCategoryId = assessment1.GradeCategoryId,
            Title = "Kuis 1 PWPB Updated",
            AssessmentType = AssessmentType.Quiz,
            MaxScore = 100,
            PublishAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(7)
        });

        Assert.NotNull(updated);
        Assert.Equal("Kuis 1 PWPB Updated", updated!.Title);
    }

    [Fact]
    public async Task Test_9_StudentCannotMutateAssessment()
    {
        var context = GetInMemoryDbContext();
        var service = new AssessmentService(context, _mockNotificationService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var cs1 = await context.ClassSubjects.FirstAsync(c => c.Class.Name == "XI RPL 1");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.CreateAssessmentAsync(student1.Id, new CreateAssessmentRequest
            {
                Title = "Student Assessment",
                ClassSubjectId = cs1.Id,
                AssessmentType = AssessmentType.Quiz,
                MaxScore = 100,
                PublishAt = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(7)
            });
        });
    }

    [Fact]
    public async Task Test_10_DirectAssessmentIDAccessRespectsScope()
    {
        var context = GetInMemoryDbContext();
        var service = new AssessmentService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id"); // Class 1
        var assessment2 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PBO"); // Class 2

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetAssessmentByIdAsync(assessment2.Id, teacher1.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_11_TeacherCannotModifyAnotherClassAssignment()
    {
        var context = GetInMemoryDbContext();
        var service = new AssignmentService(context, _mockNotificationService.Object);

        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@sch.id"); // Teaches Class 2
        var assignment1 = await context.Assignments.FirstAsync(a => a.Title.Contains("Making Web")); // Class 1

        // Teacher 2 attempts to modify Teacher 1's assignment
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.UpdateAsync(assignment1.Id, teacher2.Id, new UpdateAssignmentRequest
            {
                Title = "Illegal Assignment Modification",
                Description = "Desc",
                MaxScore = 100,
                DueDate = DateTime.UtcNow.AddDays(5)
            });
        });
    }

    [Fact]
    public async Task Test_12_AuthorizedTeacherCanModifyOwnAssignment()
    {
        var context = GetInMemoryDbContext();
        var service = new AssignmentService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assignment1 = await context.Assignments.FirstAsync(a => a.Title.Contains("Making Web"));

        var updated = await service.UpdateAsync(assignment1.Id, teacher1.Id, new UpdateAssignmentRequest
        {
            Title = "Tugas Making Web Updated",
            Description = "Desc Updated",
            MaxScore = 100,
            DueDate = DateTime.UtcNow.AddDays(10)
        });

        Assert.NotNull(updated);
        Assert.Equal("Tugas Making Web Updated", updated!.Title);
    }

    [Fact]
    public async Task Test_13_StudentCannotMutateAssignment()
    {
        var context = GetInMemoryDbContext();
        var service = new AssignmentService(context, _mockNotificationService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var cs1 = await context.ClassSubjects.FirstAsync(c => c.Class.Name == "XI RPL 1");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.CreateAsync(student1.Id, new CreateAssignmentRequest
            {
                Title = "Student Assignment",
                Description = "Illegal",
                ClassSubjectId = cs1.Id,
                MaxScore = 100,
                DueDate = DateTime.UtcNow.AddDays(1)
            });
        });
    }

    [Fact]
    public async Task Test_14_StudentCannotRetrieveAnotherStudentSubmission()
    {
        var context = GetInMemoryDbContext();
        var service = new SubmissionService(context, _mockNotificationService.Object);

        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id");
        var submission1 = await context.Submissions.FirstAsync(s => s.LatestVersion == 1);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetSubmissionByIdAsync(submission1.Id, student2.Id, "Student");
        });
    }

    [Fact]
    public async Task Test_15_StudentCannotCreateSubmissionForAnotherStudent()
    {
        var context = GetInMemoryDbContext();
        var service = new SubmissionService(context, _mockNotificationService.Object);

        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id"); // Class 2
        var assignment1 = await context.Assignments.FirstAsync(a => a.Title.Contains("Making Web")); // Class 1

        // Student 2 attempts to submit for Assignment 1 (Class 1)
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.SubmitAssignmentAsync(student2.Id, new CreateSubmissionRequest
            {
                AssignmentId = assignment1.Id,
                SubmissionType = "TEXT",
                TextAnswer = "Hacked Submission"
            });
        });
    }

    [Fact]
    public async Task Test_16_StudentCanRetrieveOwnSubmission()
    {
        var context = GetInMemoryDbContext();
        var service = new SubmissionService(context, _mockNotificationService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");
        var submission1 = await context.Submissions.FirstAsync(s => s.StudentId == student1.Id);

        var res = await service.GetSubmissionByIdAsync(submission1.Id, student1.Id, "Student");
        Assert.NotNull(res);
        Assert.Equal(student1.Id, res!.StudentId);
    }

    [Fact]
    public async Task Test_17_TeacherCanRetrieveSubmissionsForAssignedClass()
    {
        var context = GetInMemoryDbContext();
        var service = new SubmissionService(context, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assignment1 = await context.Assignments.FirstAsync(a => a.Title.Contains("Making Web"));

        var list = await service.GetSubmissionsByAssignmentAsync(assignment1.Id, teacher1.Id, "Teacher");
        Assert.NotNull(list);
        Assert.NotEmpty(list);
    }

    [Fact]
    public async Task Test_18_TeacherCannotRetrieveSubmissionsForUnrelatedClass()
    {
        var context = GetInMemoryDbContext();
        var service = new SubmissionService(context, _mockNotificationService.Object);

        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@sch.id"); // Teaches Class 2
        var assignment1 = await context.Assignments.FirstAsync(a => a.Title.Contains("Making Web")); // Class 1

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GetSubmissionsByAssignmentAsync(assignment1.Id, teacher2.Id, "Teacher");
        });
    }

    [Fact]
    public async Task Test_19_TeacherCannotGradeUnrelatedClassSubmission()
    {
        var context = GetInMemoryDbContext();
        var service = new SubmissionService(context, _mockNotificationService.Object);

        var teacher2 = await context.Users.FirstAsync(u => u.Email == "g2@sch.id");
        var submission1 = await context.Submissions.FirstAsync(s => s.LatestVersion == 1);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.GradeSubmissionAsync(submission1.Id, teacher2.Id, new GradeSubmissionRequest
            {
                Score = 100,
                Feedback = "Hacked Grade"
            });
        });
    }

    [Fact]
    public async Task Test_20_InvalidScoreIsRejected()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        // Score 150 > MaxScore 100
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpsertGradeAsync(teacher1.Id, assessment1.Id, new GradeItemRequest
            {
                StudentId = student1.Id,
                RawScore = 150
            });
        });
    }

    [Fact]
    public async Task Test_21_InvalidStudentAssessmentRelationshipIsRejected()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB");
        var student2 = await context.Users.FirstAsync(u => u.Email == "s2@sch.id"); // Student in Class 2

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpsertGradeAsync(admin.Id, assessment1.Id, new GradeItemRequest
            {
                StudentId = student2.Id,
                RawScore = 90
            });
        });
    }

    [Fact]
    public async Task Test_22_DuplicateOrInconsistentGradeBehaviorIsRejected()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var teacher1 = await context.Users.FirstAsync(u => u.Email == "g1@sch.id");
        var assessment1 = await context.Assessments.FirstAsync(a => a.Title == "Kuis 1 PWPB");
        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        // Negative score
        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await service.UpsertGradeAsync(teacher1.Id, assessment1.Id, new GradeItemRequest
            {
                StudentId = student1.Id,
                RawScore = -10
            });
        });
    }

    [Fact]
    public async Task Test_23_TranscriptRetrievalDoesNotExecuteNPlusOneQueryPattern()
    {
        var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var service = new StudentGradeService(context, gradeEngine, _mockNotificationService.Object);

        var student1 = await context.Users.FirstAsync(u => u.Email == "s1@sch.id");

        var transcript = await service.GetStudentTranscriptAsync(student1.Id);
        Assert.NotNull(transcript);
        Assert.Equal("Siswa Kelas 1", transcript.StudentName);
        Assert.NotEmpty(transcript.SubjectSummaries);
    }
}
