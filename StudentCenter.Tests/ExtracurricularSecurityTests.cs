using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using StudentCenter.Api.Controllers;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class ExtracurricularSecurityTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_NonSupervisorTeacher_ThrowsUnauthorizedException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var supervisorId = Guid.NewGuid();
        var unauthorizedTeacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = supervisorId, FullName = "Supervisor Teacher", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = unauthorizedTeacherId, FullName = "Unauthorized Teacher", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = studentId, FullName = "Student Member", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Pramuka",
            Description = "Ekskul Pramuka",
            Category = "Kepramukaan",
            ManagedByUserId = supervisorId,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateMemberStatusAsync(ekskulId, memberId, "Active", unauthorizedTeacherId));
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_SupervisorTeacher_Succeeds()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var supervisorId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = supervisorId, FullName = "Supervisor Teacher", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = studentId, FullName = "Student Member", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Pramuka",
            Description = "Ekskul Pramuka",
            Category = "Kepramukaan",
            ManagedByUserId = supervisorId,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        var result = await service.UpdateMemberStatusAsync(ekskulId, memberId, "Active", supervisorId);

        Assert.True(result);
        var updated = await context.ExtracurricularMembers.FindAsync(memberId);
        Assert.Equal("Active", updated?.Status);
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_AdvisorTeacher_Succeeds()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var advisorTeacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = advisorTeacherId, FullName = "Advisor Teacher", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = studentId, FullName = "Student Member", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Robotika",
            Description = "Ekskul Robotika",
            Category = "Sains",
            ManagedByUserId = advisorTeacherId,
            IsActive = true
        });

        context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
        {
            Id = Guid.NewGuid(),
            ExtracurricularId = ekskulId,
            TeacherId = advisorTeacherId
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        var result = await service.UpdateMemberStatusAsync(ekskulId, memberId, "Active", advisorTeacherId);

        Assert.True(result);
        var updated = await context.ExtracurricularMembers.FindAsync(memberId);
        Assert.Equal("Active", updated?.Status);
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_ManagedByTeacher_Succeeds()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var managerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = managerId, FullName = "Manager Teacher", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = studentId, FullName = "Student Member", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Paskibra",
            Description = "Paskibra",
            Category = "Paskibra",
            ManagedByUserId = managerId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        var result = await service.UpdateMemberStatusAsync(ekskulId, memberId, "Active", managerId);

        Assert.True(result);
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_Admin_Succeeds()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var adminId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = adminId, FullName = "System Admin", Role = UserRole.Admin });
        context.Users.Add(new User { Id = studentId, FullName = "Student Member", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Pensi",
            Description = "Pensi",
            Category = "Seni",
            ManagedByUserId = adminId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        var result = await service.UpdateMemberStatusAsync(ekskulId, memberId, "Active", adminId);

        Assert.True(result);
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_Student_ThrowsUnauthorizedException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var studentReviewerId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = studentReviewerId, FullName = "Student Reviewer", Role = UserRole.Student });
        context.Users.Add(new User { Id = studentId, FullName = "Student Member", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Pramuka",
            Description = "Ekskul",
            Category = "Kepramukaan",
            ManagedByUserId = studentReviewerId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateMemberStatusAsync(ekskulId, memberId, "Active", studentReviewerId));
    }

    [Fact]
    public async Task UpdateMemberStatusAsync_InvalidStatusString_ThrowsValidationException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var adminId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = adminId, FullName = "Admin", Role = UserRole.Admin });
        context.Users.Add(new User { Id = studentId, FullName = "Student", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Koding",
            Description = "Coding",
            Category = "IT",
            ManagedByUserId = adminId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.UpdateMemberStatusAsync(ekskulId, memberId, "HackedStatus", adminId));
    }

    [Fact]
    public async Task UpdateExtracurricularAsync_NonSupervisorTeacher_ThrowsUnauthorizedException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var supervisorId = Guid.NewGuid();
        var otherTeacherId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();

        context.Users.Add(new User { Id = supervisorId, FullName = "Supervisor", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = otherTeacherId, FullName = "Other Teacher", Role = UserRole.Teacher });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Original Name",
            Description = "Desc",
            Category = "Cat",
            ManagedByUserId = supervisorId,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateExtracurricularAsync(ekskulId, new UpdateExtracurricularRequest
            {
                Name = "Updated Name",
                Description = "Desc",
                Category = "Cat",
                MaxMembers = 10,
                SupervisorTeacherId = supervisorId,
                IsActive = true
            }, otherTeacherId));
    }

    [Fact]
    public async Task UpdateExtracurricularAsync_SupervisorTeacher_Succeeds()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var supervisorId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();

        context.Users.Add(new User { Id = supervisorId, FullName = "Supervisor", Role = UserRole.Teacher });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Original Name",
            Description = "Desc",
            Category = "Cat",
            ManagedByUserId = supervisorId,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        await context.SaveChangesAsync();

        var result = await service.UpdateExtracurricularAsync(ekskulId, new UpdateExtracurricularRequest
        {
            Name = "Updated Name",
            Description = "Desc Updated",
            Category = "Cat Updated",
            MaxMembers = 25,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        }, supervisorId);

        Assert.NotNull(result);
        Assert.Equal("Updated Name", result.Name);
    }

    [Fact]
    public async Task CreateExtracurricularAsync_InvalidSupervisorRole_ThrowsValidationException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var adminId = Guid.NewGuid();
        var studentAsSupervisorId = Guid.NewGuid();

        context.Users.Add(new User { Id = adminId, FullName = "Admin", Role = UserRole.Admin });
        context.Users.Add(new User { Id = studentAsSupervisorId, FullName = "Student Fake Supervisor", Role = UserRole.Student });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() =>
            service.CreateExtracurricularAsync(new CreateExtracurricularRequest
            {
                Name = "Invalid Ekskul",
                Description = "Desc",
                Category = "Cat",
                MaxMembers = 10,
                SupervisorTeacherId = studentAsSupervisorId
            }, adminId));
    }

    [Fact]
    public async Task CreateExtracurricularAsync_NonexistentSupervisor_ThrowsKeyNotFoundException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var adminId = Guid.NewGuid();
        context.Users.Add(new User { Id = adminId, FullName = "Admin", Role = UserRole.Admin });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateExtracurricularAsync(new CreateExtracurricularRequest
            {
                Name = "Nonexistent Supervisor Ekskul",
                Description = "Desc",
                Category = "Cat",
                MaxMembers = 10,
                SupervisorTeacherId = Guid.NewGuid()
            }, adminId));
    }

    [Fact]
    public async Task JoinExtracurricularAsync_FullCapacity_ThrowsInvalidOperationException()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var student1Id = Guid.NewGuid();
        var student2Id = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();

        context.Users.Add(new User { Id = student1Id, FullName = "Student 1", Role = UserRole.Student });
        context.Users.Add(new User { Id = student2Id, FullName = "Student 2", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Full Ekskul",
            Description = "Desc",
            Category = "Cat",
            MaxMembers = 1,
            ManagedByUserId = student1Id,
            IsActive = true,
            RegistrationOpen = true
        });

        await context.SaveChangesAsync();

        // Join 1 -> Success
        await service.JoinExtracurricularAsync(ekskulId, student1Id);

        // Join 2 -> Full Capacity Error
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.JoinExtracurricularAsync(ekskulId, student2Id));
    }

    [Fact]
    public async Task JoinExtracurricularAsync_RejoinRemovedMember_ResetsStatusAndPosition()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();

        context.Users.Add(new User { Id = studentId, FullName = "Student Rejoin", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Rejoin Ekskul",
            Description = "Desc",
            Category = "Cat",
            MaxMembers = 10,
            ManagedByUserId = studentId,
            IsActive = true,
            RegistrationOpen = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Removed",
            Position = ExtracurricularMemberPosition.Leader
        });

        await context.SaveChangesAsync();

        var result = await service.JoinExtracurricularAsync(ekskulId, studentId);

        Assert.Equal("Pending", result.Status);
        Assert.Equal(ExtracurricularMemberPosition.Member.ToString(), result.Position);
    }

    [Fact]
    public async Task GetSupervisedByTeacherAsync_UsesExactProposalCategoryMatching()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());

        var teacherId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();

        context.Users.Add(new User { Id = teacherId, FullName = "Teacher Supervisor", Role = UserRole.Teacher });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "IT",
            Description = "Club IT",
            Category = "IT",
            ManagedByUserId = teacherId,
            SupervisorTeacherId = teacherId,
            IsActive = true
        });

        // Exact match proposal
        context.Proposals.Add(new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Proposal IT",
            Category = "IT",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = Guid.NewGuid()
        });

        // Substring match proposal (should NOT be counted for "IT")
        context.Proposals.Add(new Proposal
        {
            Id = Guid.NewGuid(),
            Title = "Pentas Seni",
            Category = "Pentas Seni",
            Status = ProposalStatus.Pending,
            SubmittedByUserId = Guid.NewGuid()
        });

        await context.SaveChangesAsync();

        var supervised = await service.GetSupervisedByTeacherAsync(teacherId);

        Assert.Single(supervised);
        Assert.Equal("IT", supervised[0].Name);
        Assert.Equal(1, supervised[0].PendingProposalsCount);
    }

    [Fact]
    public async Task ExtracurricularMembersController_UnauthorizedTeacher_Returns403()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());
        var controller = new ExtracurricularMembersController(service);

        var supervisorId = Guid.NewGuid();
        var unauthorizedTeacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();
        var memberId = Guid.NewGuid();

        context.Users.Add(new User { Id = supervisorId, FullName = "Supervisor", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = unauthorizedTeacherId, FullName = "Unauthorized Teacher", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = studentId, FullName = "Student", Role = UserRole.Student });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Seni",
            Description = "Seni",
            Category = "Seni",
            ManagedByUserId = supervisorId,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = memberId,
            ExtracurricularId = ekskulId,
            StudentId = studentId,
            Status = "Pending"
        });

        await context.SaveChangesAsync();

        // Setup Controller Claims
        var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, unauthorizedTeacherId.ToString()) };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "Test");
        controller.ControllerContext = new ControllerContext { HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext { User = new System.Security.Claims.ClaimsPrincipal(identity) } };

        var actionResult = await controller.UpdateMemberStatus(ekskulId, memberId, new UpdateMemberStatusRequest { Status = "Active" });

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(403, objectResult.StatusCode);
    }

    [Fact]
    public async Task ExtracurricularController_UnauthorizedTeacherUpdate_Returns403()
    {
        using var context = GetInMemoryDbContext();
        var service = new ExtracurricularService(context, Mock.Of<INotificationService>());
        
        var mockCurrentUserService = new Mock<ICurrentUserService>();
        var unauthorizedTeacherId = Guid.NewGuid();
        mockCurrentUserService.Setup(u => u.UserId).Returns(unauthorizedTeacherId);

        var controller = new ExtracurricularController(service, mockCurrentUserService.Object);

        var supervisorId = Guid.NewGuid();
        var ekskulId = Guid.NewGuid();

        context.Users.Add(new User { Id = supervisorId, FullName = "Supervisor", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = unauthorizedTeacherId, FullName = "Unauthorized Teacher", Role = UserRole.Teacher });

        context.Extracurriculars.Add(new Extracurricular
        {
            Id = ekskulId,
            Name = "Bahasa",
            Description = "Bahasa",
            Category = "Bahasa",
            ManagedByUserId = supervisorId,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        await context.SaveChangesAsync();

        var actionResult = await controller.UpdateExtracurricular(ekskulId, new UpdateExtracurricularRequest
        {
            Name = "Unauthorized Rename",
            Description = "Desc",
            Category = "Bahasa",
            MaxMembers = 10,
            SupervisorTeacherId = supervisorId,
            IsActive = true
        });

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(403, objectResult.StatusCode);
    }
}
