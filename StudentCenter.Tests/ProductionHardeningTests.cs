using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using StudentCenter.Api.Controllers;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class ProductionHardeningTests
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
        var admin = new User { Id = Guid.NewGuid(), FullName = "Admin Hardening", Email = "admin@h.id", Role = UserRole.Admin, IsActive = true };
        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Hardening", Email = "guru@h.id", Role = UserRole.Teacher, IsActive = true };
        var student = new User { Id = Guid.NewGuid(), FullName = "Siswa Hardening", Email = "siswa@h.id", Role = UserRole.Student, IsActive = true };

        context.Users.AddRange(admin, teacher, student);
        context.SaveChanges();
    }

    [Fact]
    public async Task UploadController_ExecutableFile_RejectsWithBadRequest()
    {
        var mockEnv = new Mock<IWebHostEnvironment>();
        var mockConfig = new Mock<IConfiguration>();
        var controller = new UploadController(mockEnv.Object, mockConfig.Object);

        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("malicious_script.exe");
        fileMock.Setup(f => f.Length).Returns(1024);
        fileMock.Setup(f => f.ContentType).Returns("application/x-msdownload");

        var result = await controller.UploadFile(new UploadFileRequest { File = fileMock.Object });
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task UploadController_FileExceeds10MB_RejectsWithBadRequest()
    {
        var mockEnv = new Mock<IWebHostEnvironment>();
        var mockConfig = new Mock<IConfiguration>();
        var controller = new UploadController(mockEnv.Object, mockConfig.Object);

        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns("large_video.mp4");
        fileMock.Setup(f => f.Length).Returns(15 * 1024 * 1024); // 15MB
        fileMock.Setup(f => f.ContentType).Returns("video/mp4");

        var result = await controller.UploadFile(new UploadFileRequest { File = fileMock.Object });
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }

    [Fact]
    public async Task DashboardAggregation_AllRoles_ReturnNonNullAndCleanMetrics()
    {
        var context = GetInMemoryDbContext();
        var scheduleMock = new Mock<Application.Services.IScheduleService>();
        var materialMock = new Mock<Application.Services.ILessonMaterialService>();
        var assignmentMock = new Mock<Application.Services.IAssignmentService>();
        var eventMock = new Mock<Application.Services.IAcademicEventService>();

        scheduleMock.Setup(s => s.GetTodaySchedulesForTeacherAsync(It.IsAny<Guid>())).ReturnsAsync(new List<ScheduleResponse>());
        scheduleMock.Setup(s => s.GetTodaySchedulesForStudentAsync(It.IsAny<Guid>())).ReturnsAsync(new List<ScheduleResponse>());
        materialMock.Setup(m => m.GetTeacherMaterialsAsync(It.IsAny<Guid>())).ReturnsAsync(new List<LessonMaterialResponse>());
        materialMock.Setup(m => m.GetStudentMaterialsAsync(It.IsAny<Guid>())).ReturnsAsync(new List<LessonMaterialResponse>());
        assignmentMock.Setup(a => a.GetTeacherAssignmentsAsync(It.IsAny<Guid>())).ReturnsAsync(new List<AssignmentResponse>());
        assignmentMock.Setup(a => a.GetStudentAssignmentsAsync(It.IsAny<Guid>())).ReturnsAsync(new List<AssignmentResponse>());
        eventMock.Setup(e => e.GetUpcomingEventsAsync(It.IsAny<int>())).ReturnsAsync(new List<AcademicEventResponse>());

        var aggregationService = new DashboardAggregationService(context, scheduleMock.Object, materialMock.Object, assignmentMock.Object, eventMock.Object);

        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin);
        var teacher = await context.Users.FirstAsync(u => u.Role == UserRole.Teacher);
        var student = await context.Users.FirstAsync(u => u.Role == UserRole.Student);

        var adminDash = await aggregationService.GetAdminDashboardAsync();
        Assert.NotNull(adminDash);
        Assert.NotNull(adminDash.LatestAnnouncements);

        var teacherDash = await aggregationService.GetTeacherDashboardAsync(teacher.Id);
        Assert.NotNull(teacherDash);
        Assert.Equal(teacher.Id, teacherDash.TeacherId);

        var studentDash = await aggregationService.GetStudentDashboardAsync(student.Id);
        Assert.NotNull(studentDash);
        Assert.Equal(student.Id, studentDash.StudentId);
    }

    [Fact]
    public async Task SearchService_WildcardAndFilters_ReturnsCleanSearchResponse()
    {
        var context = GetInMemoryDbContext();
        var searchService = new SearchService(context);
        var student = await context.Users.FirstAsync(u => u.Role == UserRole.Student);

        var res = await searchService.SearchAsync("Test", 1, 10, student.Id, "Student");
        Assert.NotNull(res);
        Assert.NotNull(res.Announcements);
        Assert.NotNull(res.Materials);
        Assert.NotNull(res.Assignments);
        Assert.NotNull(res.Facilities);
        Assert.NotNull(res.Extracurriculars);
        Assert.NotNull(res.Proposals);
        Assert.NotNull(res.Discussions);
        Assert.NotNull(res.Messages);
    }
}
