using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class CsvImportAuditTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        SeedPrerequisiteData(context);
        return context;
    }

    private void SeedPrerequisiteData(AppDbContext context)
    {
        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "Rekayasa Perangkat Lunak" };
        var ay = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = new DateTime(2025, 7, 1), EndDate = new DateTime(2026, 6, 30), IsActive = true };
        var schoolClass = new SchoolClass { Id = Guid.NewGuid(), DepartmentId = dept.Id, AcademicYearId = ay.Id, Name = "X RPL 1", Grade = "X" };
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Test", Email = "guru@test.id", Role = UserRole.Teacher, IsActive = true };
        
        var subject = new Subject { Id = Guid.NewGuid(), Code = "RPL-KDD", Name = "Pemrograman Dasar" };
        var teacherSubject = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher.Id, SubjectId = subject.Id };
        var classSubject = new ClassSubject { Id = Guid.NewGuid(), ClassId = schoolClass.Id, TeacherSubjectId = teacherSubject.Id };
        var category = new GradeCategory { Id = Guid.NewGuid(), Name = "Ujian", Weight = 100, Type = GradeCategoryType.Exam, IsActive = true };
        var assessment = new Assessment { Id = Guid.NewGuid(), ClassSubjectId = classSubject.Id, GradeCategoryId = category.Id, TeacherId = teacher.Id, Title = "Kuis 1", MaxScore = 100 };

        context.Departments.Add(dept);
        context.AcademicYears.Add(ay);
        context.SchoolClasses.Add(schoolClass);
        context.Users.Add(teacher);
        context.Subjects.Add(subject);
        context.TeacherSubjects.Add(teacherSubject);
        context.ClassSubjects.Add(classSubject);
        context.GradeCategories.Add(category);
        context.Assessments.Add(assessment);
        context.SaveChanges();
    }

    [Fact]
    public async Task Import_TeachersCsv_01_Succeeds_5RowsProcessed()
    {
        var context = GetInMemoryDbContext();
        var userImportService = new UserImportService(context);

        string csvContent = File.ReadAllText(@"d:\.SCHOOL\StudentCenter\sample-data\01_teachers.csv");
        var result = await userImportService.ImportTeachersCsvAsync(csvContent);

        Assert.Equal(5, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public async Task Import_StudentsCsv_02_Succeeds_5RowsProcessed()
    {
        var context = GetInMemoryDbContext();
        var userImportService = new UserImportService(context);

        string csvContent = File.ReadAllText(@"d:\.SCHOOL\StudentCenter\sample-data\02_students.csv");
        var result = await userImportService.ImportStudentsCsvAsync(csvContent);

        Assert.Equal(5, result.SuccessCount);
        Assert.Equal(0, result.FailedCount);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public async Task Import_StudentGradesCsv_03_Succeeds_5RowsProcessed()
    {
        var context = GetInMemoryDbContext();
        var userImportService = new UserImportService(context);
        var gradeCalculationService = new GradeCalculationService(context);
        var notificationService = new NotificationService(context);
        var studentGradeService = new StudentGradeService(context, gradeCalculationService, notificationService);

        // First import students so NIS values exist
        string studentCsv = File.ReadAllText(@"d:\.SCHOOL\StudentCenter\sample-data\02_students.csv");
        await userImportService.ImportStudentsCsvAsync(studentCsv);

        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var assessment = await context.Assessments.FirstAsync();

        string gradeCsv = File.ReadAllText(@"d:\.SCHOOL\StudentCenter\sample-data\03_student_grades.csv");
        var (importedCount, errors) = await studentGradeService.ImportGradesCsvAsync(teacher.Id, assessment.Id, gradeCsv);

        Assert.Equal(5, importedCount);
        Assert.Empty(errors);
    }
}
