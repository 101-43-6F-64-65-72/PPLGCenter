using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class SecurityAuthorizationTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task SubmissionService_GetSubmissionByIdAsync_EnforcesResourceOwnership()
    {
        using var context = GetInMemoryDbContext();
        var submissionService = new SubmissionService(context);

        var studentA = new User { Id = Guid.NewGuid(), FullName = "Student A", Email = "a@test.id", Role = UserRole.Student };
        var studentB = new User { Id = Guid.NewGuid(), FullName = "Student B", Email = "b@test.id", Role = UserRole.Student };
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Teacher 1", Email = "t@test.id", Role = UserRole.Teacher };

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher.Id,
            Title = "Tugas Web",
            DueDate = DateTime.UtcNow.AddDays(7),
            PublishAt = DateTime.UtcNow.AddDays(-1)
        };

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = studentA.Id,
            LatestVersion = 1,
            SubmittedAt = DateTime.UtcNow
        };

        context.Users.AddRange(studentA, studentB, teacher);
        context.Assignments.Add(assignment);
        context.Submissions.Add(submission);
        await context.SaveChangesAsync();

        // 1. Owner Student A can access own submission
        var resOwner = await submissionService.GetSubmissionByIdAsync(submission.Id, studentA.Id, "Student");
        Assert.NotNull(resOwner);

        // 2. Non-owner Student B access throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            submissionService.GetSubmissionByIdAsync(submission.Id, studentB.Id, "Student"));

        // 3. Assigned Teacher can access submission
        var resTeacher = await submissionService.GetSubmissionByIdAsync(submission.Id, teacher.Id, "Teacher");
        Assert.NotNull(resTeacher);

        // 4. Admin can access any submission
        var resAdmin = await submissionService.GetSubmissionByIdAsync(submission.Id, Guid.NewGuid(), "Admin");
        Assert.NotNull(resAdmin);
    }

    [Fact]
    public async Task StudentGradeService_GetTeacherGradebookAsync_EnforcesTeacherAssignment()
    {
        using var context = GetInMemoryDbContext();
        var gradeEngine = new GradeCalculationService(context);
        var gradeService = new StudentGradeService(context, gradeEngine);

        var dept = new Department { Id = Guid.NewGuid(), Name = "RPL", Code = "RPL" };
        var schoolClass = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", DepartmentId = dept.Id };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algoritma", Code = "ALG" };

        var assignedTeacher = new User { Id = Guid.NewGuid(), FullName = "Assigned Teacher", Email = "assigned@test.id", Role = UserRole.Teacher };
        var unassignedTeacher = new User { Id = Guid.NewGuid(), FullName = "Unassigned Teacher", Email = "unassigned@test.id", Role = UserRole.Teacher };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@test.id", Role = UserRole.Admin };

        var teacherSubject = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = assignedTeacher.Id, SubjectId = subject.Id };
        var classSubject = new ClassSubject { Id = Guid.NewGuid(), ClassId = schoolClass.Id, TeacherSubjectId = teacherSubject.Id };

        context.Departments.Add(dept);
        context.SchoolClasses.Add(schoolClass);
        context.Subjects.Add(subject);
        context.Users.AddRange(assignedTeacher, unassignedTeacher, admin);
        context.TeacherSubjects.Add(teacherSubject);
        context.ClassSubjects.Add(classSubject);
        await context.SaveChangesAsync();

        // 1. Assigned Teacher can view gradebook
        var resAssigned = await gradeService.GetTeacherGradebookAsync(assignedTeacher.Id, classSubject.Id);
        Assert.NotNull(resAssigned);

        // 2. Admin can view gradebook
        var resAdmin = await gradeService.GetTeacherGradebookAsync(admin.Id, classSubject.Id);
        Assert.NotNull(resAdmin);

        // 3. Unassigned Teacher throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            gradeService.GetTeacherGradebookAsync(unassignedTeacher.Id, classSubject.Id));
    }

    [Fact]
    public async Task JwtService_GenerateToken_InjectsOsisRoleClaimForActiveOsisMembers()
    {
        using var context = GetInMemoryDbContext();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:SecretKey", "SuperSecretTestKeyThatIsAtLeast32BytesLong123456789!" },
                { "Jwt:Issuer", "PPLGCenter" },
                { "Jwt:Audience", "PPLGCenterApp" },
                { "Jwt:ExpirationMinutes", "60" }
            })
            .Build();

        var jwtService = new JwtService(config, context);

        var osisStudent = new User { Id = Guid.NewGuid(), FullName = "Ketua OSIS", Email = "osis@test.id", Role = UserRole.Student };
        var regularStudent = new User { Id = Guid.NewGuid(), FullName = "Siswa Biasa", Email = "regular@test.id", Role = UserRole.Student };

        var permission = new UserPermission
        {
            Id = Guid.NewGuid(),
            UserId = osisStudent.Id,
            Capability = "OSIS",
            GrantedAt = DateTime.UtcNow
        };

        context.Users.AddRange(osisStudent, regularStudent);
        context.UserPermissions.Add(permission);
        await context.SaveChangesAsync();

        // 1. Token for OSIS Student contains "OSIS" role claim
        var tokenOsis = jwtService.GenerateToken(osisStudent);
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var parsedTokenOsis = handler.ReadJwtToken(tokenOsis);
        var roleClaimsOsis = parsedTokenOsis.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value).ToList();
        
        Assert.Contains("OSIS", roleClaimsOsis);
        Assert.Contains("Student", roleClaimsOsis);

        // 2. Token for Regular Student does NOT contain "OSIS" role claim
        var tokenRegular = jwtService.GenerateToken(regularStudent);
        var parsedTokenRegular = handler.ReadJwtToken(tokenRegular);
        var roleClaimsRegular = parsedTokenRegular.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "role").Select(c => c.Value).ToList();

        Assert.DoesNotContain("OSIS", roleClaimsRegular);
        Assert.Contains("Student", roleClaimsRegular);
    }

    [Fact]
    public async Task ProposalService_UpdateProposalAsync_EnforcesOwnerOrAdminAuthorization()
    {
        using var context = GetInMemoryDbContext();
        var proposalService = new ProposalService(context, new NotificationService(context), new SupabaseStorageService(new ConfigurationBuilder().Build()));

        var studentA = new User { Id = Guid.NewGuid(), FullName = "Submitter A", Email = "subA@test.id", Role = UserRole.Student };
        var studentB = new User { Id = Guid.NewGuid(), FullName = "Student B", Email = "subB@test.id", Role = UserRole.Student };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@test.id", Role = UserRole.Admin };

        context.Users.AddRange(studentA, studentB, admin);
        await context.SaveChangesAsync();

        var proposal = await proposalService.CreateProposalAsync(new CreateProposalRequest
        {
            Title = "Proposal Pentas Seni",
            Description = "Deskripsi Pensi",
            Category = "OSIS",
            FileUrl = "proposals/pensi-osis.pdf"
        }, studentA.Id);

        // 1. Submitter Student A can update proposal
        var updatedOwner = await proposalService.UpdateProposalAsync(proposal.Id, new UpdateProposalRequest
        {
            Title = "Proposal Pentas Seni Revisi 1",
            Description = "Deskripsi Pensi Terbaru",
            FileUrl = "proposals/pensi-osis.pdf"
        }, studentA.Id);
        Assert.NotNull(updatedOwner);
        Assert.Equal("Proposal Pentas Seni Revisi 1", updatedOwner.Title);

        // 2. Non-owner Student B update throws UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            proposalService.UpdateProposalAsync(proposal.Id, new UpdateProposalRequest
            {
                Title = "Proposal Hack B",
                Description = "Hack",
                FileUrl = "proposals/pensi-osis.pdf"
            }, studentB.Id));

        // 3. Admin can update proposal
        var updatedAdmin = await proposalService.UpdateProposalAsync(proposal.Id, new UpdateProposalRequest
        {
            Title = "Proposal Pentas Seni Admin Edit",
            Description = "Deskripsi Admin",
            FileUrl = "proposals/pensi-osis.pdf"
        }, admin.Id);
        Assert.NotNull(updatedAdmin);
        Assert.Equal("Proposal Pentas Seni Admin Edit", updatedAdmin.Title);
    }

    [Fact]
    public async Task SubmissionService_SecurityAndRevisionBoundaries_Enforced()
    {
        using var context = GetInMemoryDbContext();
        var submissionService = new SubmissionService(context);

        var dept = new Department { Id = Guid.NewGuid(), Name = "RPL", Code = "RPL" };
        var cls1 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", DepartmentId = dept.Id };
        var cls2 = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 2", DepartmentId = dept.Id };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Pemrograman Web", Code = "PW" };

        var teacher1 = new User { Id = Guid.NewGuid(), FullName = "Guru 1", Email = "g1@test.id", Role = UserRole.Teacher };
        var teacher2 = new User { Id = Guid.NewGuid(), FullName = "Guru 2", Email = "g2@test.id", Role = UserRole.Teacher };
        var student1 = new User { Id = Guid.NewGuid(), FullName = "Siswa Class 1", Email = "s1@test.id", Role = UserRole.Student, ClassId = cls1.Id };
        var student2 = new User { Id = Guid.NewGuid(), FullName = "Siswa Class 2", Email = "s2@test.id", Role = UserRole.Student, ClassId = cls2.Id };
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin User", Email = "admin@test.id", Role = UserRole.Admin };

        var ts1 = new TeacherSubject { Id = Guid.NewGuid(), TeacherId = teacher1.Id, SubjectId = subject.Id };
        var cs1 = new ClassSubject { Id = Guid.NewGuid(), ClassId = cls1.Id, TeacherSubjectId = ts1.Id };

        var assignment1 = new Assignment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = cs1.Id,
            TeacherId = teacher1.Id,
            Title = "Tugas 1 Class 1",
            PublishAt = DateTime.UtcNow.AddHours(-1),
            DueDate = DateTime.UtcNow.AddDays(7),
            MaxScore = 100
        };

        context.Departments.Add(dept);
        context.SchoolClasses.AddRange(cls1, cls2);
        context.Subjects.Add(subject);
        context.Users.AddRange(teacher1, teacher2, student1, student2, admin);
        context.TeacherSubjects.Add(ts1);
        context.ClassSubjects.Add(cs1);
        context.Assignments.Add(assignment1);
        await context.SaveChangesAsync();

        // 1. Student 2 (Class 2) cannot submit to Class 1 assignment
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            submissionService.SubmitAssignmentAsync(student2.Id, new CreateSubmissionRequest
            {
                AssignmentId = assignment1.Id,
                SubmissionType = "FILE",
                FileUrl = "https://example.com/sub2.pdf"
            }));

        // 2. Student 1 (Class 1) submits to own assignment (Revision 1)
        var sub1 = await submissionService.SubmitAssignmentAsync(student1.Id, new CreateSubmissionRequest
        {
            AssignmentId = assignment1.Id,
            SubmissionType = "FILE",
            FileUrl = "https://example.com/sub1_v1.pdf",
            Comment = "Versi 1"
        });

        Assert.NotNull(sub1);
        Assert.Equal(1, sub1.LatestVersion);

        // 3. Resubmission increments revision version to 2
        var sub1_v2 = await submissionService.SubmitAssignmentAsync(student1.Id, new CreateSubmissionRequest
        {
            AssignmentId = assignment1.Id,
            SubmissionType = "FILE",
            FileUrl = "https://example.com/sub1_v2.pdf",
            Comment = "Versi 2"
        });

        Assert.NotNull(sub1_v2);
        Assert.Equal(2, sub1_v2.LatestVersion);
        Assert.Equal(2, sub1_v2.Revisions.Count);

        // 4. Student 2 cannot read Student 1's submission
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            submissionService.GetSubmissionByIdAsync(sub1.Id, student2.Id, "Student"));

        // 5. Unauthorized Teacher 2 cannot view Class 1 submissions
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            submissionService.GetSubmissionsByAssignmentAsync(assignment1.Id, teacher2.Id, "Teacher"));

        // 6. Unauthorized Teacher 2 cannot grade Class 1 submission
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            submissionService.GradeSubmissionAsync(sub1.Id, teacher2.Id, new GradeSubmissionRequest { Score = 90 }));

        // 7. Authorized Teacher 1 can grade submission
        var graded = await submissionService.GradeSubmissionAsync(sub1.Id, teacher1.Id, new GradeSubmissionRequest
        {
            Score = 95,
            Feedback = "Bagus sekali!"
        });
        Assert.NotNull(graded);
        Assert.Equal(95, graded!.Score);

        // 8. Admin can view submissions
        var adminView = await submissionService.GetSubmissionsByAssignmentAsync(assignment1.Id, admin.Id, "Admin");
        Assert.Single(adminView);
    }
}
