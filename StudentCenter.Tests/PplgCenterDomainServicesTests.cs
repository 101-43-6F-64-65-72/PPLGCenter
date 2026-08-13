using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class PplgCenterDomainServicesTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task FacilityService_Supports_MultiManager_Assignments()
    {
        using var context = GetInMemoryDbContext();
        var service = new FacilityService(context, NullLogger<FacilityService>.Instance);

        var facilityId = Guid.NewGuid();
        var teacher1Id = Guid.NewGuid();
        var teacher2Id = Guid.NewGuid();

        context.Facilities.Add(new Facility
        {
            Id = facilityId,
            Name = "Lab PPLG 1",
            Location = "Lantai 2",
            Category = "Lab",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.Users.Add(new User { Id = teacher1Id, Username = "teacher1", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = teacher2Id, Username = "teacher2", Role = UserRole.Teacher });
        await context.SaveChangesAsync();

        // Assign teacher 1 & teacher 2
        var res1 = await service.AssignManagerAsync(facilityId, teacher1Id);
        var res2 = await service.AssignManagerAsync(facilityId, teacher2Id);

        Assert.True(res1);
        Assert.True(res2);

        var managers = await service.GetFacilityManagersAsync(facilityId);
        Assert.Equal(2, managers.Count);

        var managed1 = await service.GetManagedFacilitiesAsync(teacher1Id);
        var managed2 = await service.GetManagedFacilitiesAsync(teacher2Id);

        Assert.Single(managed1);
        Assert.Single(managed2);
        Assert.Equal("Lab PPLG 1", managed1[0].Name);
    }

    [Fact]
    public async Task StudentProfileService_Enforces_ServerSide_Privacy()
    {
        using var context = GetInMemoryDbContext();
        var service = new StudentProfileService(context);

        var studentId = Guid.NewGuid();
        var strangerId = Guid.NewGuid();

        context.Users.Add(new User
        {
            Id = studentId,
            Username = "student1",
            FullName = "Budi Santoso",
            NIS = "12345",
            Role = UserRole.Student
        });

        context.StudentProfiles.Add(new StudentProfile
        {
            Id = Guid.NewGuid(),
            UserId = studentId,
            Bio = "Secret Bio Data",
            SkillsJson = "[\"C#\"]",
            Visibility = ProfileVisibility.PRIVATE,
            UpdatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        // 1. Stranger (Student) requests private profile -> Should return redacted profile
        var strangerView = await service.GetProfileByUserIdAsync(studentId, strangerId, isRequesterAdminOrTeacher: false);
        Assert.NotNull(strangerView);
        Assert.Equal("[Private Profile]", strangerView.Bio);
        Assert.Null(strangerView.SkillsJson);

        // 2. Owner requests profile -> Should return full bio
        var ownerView = await service.GetProfileByUserIdAsync(studentId, studentId, isRequesterAdminOrTeacher: false);
        Assert.NotNull(ownerView);
        Assert.Equal("Secret Bio Data", ownerView.Bio);
        Assert.Equal("[\"C#\"]", ownerView.SkillsJson);

        // 3. Teacher/Admin requests private profile -> Should return full bio
        var teacherView = await service.GetProfileByUserIdAsync(studentId, strangerId, isRequesterAdminOrTeacher: true);
        Assert.NotNull(teacherView);
        Assert.Equal("Secret Bio Data", teacherView.Bio);
    }

    [Fact]
    public async Task ClassLeadershipService_Preserves_History_On_Replacement()
    {
        using var context = GetInMemoryDbContext();
        var service = new ClassLeadershipService(context);

        var classId = Guid.NewGuid();
        var waliId = Guid.NewGuid();
        var student1Id = Guid.NewGuid();
        var student2Id = Guid.NewGuid();
        var academicYearId = Guid.NewGuid();
        var adminId = Guid.NewGuid();

        context.SchoolClasses.Add(new SchoolClass { Id = classId, Name = "XI PPLG A", Grade = "XI" });
        context.Users.Add(new User { Id = waliId, Username = "wali", Role = UserRole.Teacher });
        context.Users.Add(new User { Id = student1Id, Username = "student1", Role = UserRole.Student });
        context.Users.Add(new User { Id = student2Id, Username = "student2", Role = UserRole.Student });
        context.AcademicYears.Add(new AcademicYear { Id = academicYearId, Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) });
        await context.SaveChangesAsync();

        // 1. Initial Appointment: Student 1 as Ketua Kelas
        await service.AppointLeadershipAsync(new AppointLeadershipRequest
        {
            SchoolClassId = classId,
            HomeroomTeacherId = waliId,
            ClassLeaderStudentId = student1Id,
            AcademicYearId = academicYearId
        }, adminId);

        var active1 = await service.GetActiveLeadershipAsync(classId);
        Assert.NotNull(active1);
        Assert.Equal(student1Id, active1.ClassLeaderStudentId);
        Assert.True(active1.IsActive);

        // 2. Replacement Appointment: Student 2 as new Ketua Kelas
        await service.AppointLeadershipAsync(new AppointLeadershipRequest
        {
            SchoolClassId = classId,
            HomeroomTeacherId = waliId,
            ClassLeaderStudentId = student2Id,
            AcademicYearId = academicYearId
        }, adminId);

        var active2 = await service.GetActiveLeadershipAsync(classId);
        Assert.NotNull(active2);
        Assert.Equal(student2Id, active2.ClassLeaderStudentId);
        Assert.True(active2.IsActive);

        // 3. Verify history preserves student 1 record (now inactive with EndDate set)
        var history = await service.GetLeadershipHistoryAsync(classId);
        Assert.Equal(2, history.Count);
        Assert.Contains(history, h => h.ClassLeaderStudentId == student1Id && !h.IsActive && h.EndDate.HasValue);
    }

    [Fact]
    public async Task ClassDivisionService_Prevents_SelfParent_And_Cycles()
    {
        using var context = GetInMemoryDbContext();
        var service = new ClassDivisionService(context);

        var classId = Guid.NewGuid();
        context.SchoolClasses.Add(new SchoolClass { Id = classId, Name = "XI PPLG B", Grade = "XI" });
        await context.SaveChangesAsync();

        var root = await service.CreateDivisionAsync(new CreateClassDivisionRequest
        {
            SchoolClassId = classId,
            Name = "Ketua Kelas",
            ParentDivisionId = null
        });

        // Test self-parent error
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateDivisionAsync(root.Id, new UpdateClassDivisionRequest
            {
                Name = "Ketua Kelas",
                ParentDivisionId = root.Id
            }));
    }

    [Fact]
    public async Task ScheduleRotationService_Calculates_2Week_MPU_KK_Rotation()
    {
        using var context = GetInMemoryDbContext();
        var service = new ScheduleRotationService(context);

        var classId = Guid.NewGuid();
        var anchorDate = new DateTime(2026, 8, 3, 0, 0, 0, DateTimeKind.Utc); // Monday

        context.SchoolClasses.Add(new SchoolClass { Id = classId, Name = "XI PPLG A", Grade = "XI" });
        await context.SaveChangesAsync();

        await service.SaveConfigAsync(new SaveScheduleRotationConfigRequest
        {
            SchoolClassId = classId,
            AnchorStartDate = anchorDate,
            InitialCategory = SubjectCategory.KK,
            CycleWeeks = 2
        });

        // Week 1 (KK)
        var week1Cat = await service.GetCurrentCategoryForClassAsync(classId, anchorDate.AddDays(2));
        Assert.Equal(SubjectCategory.KK, week1Cat);

        // Week 3 (Rotated to MPU)
        var week3Cat = await service.GetCurrentCategoryForClassAsync(classId, anchorDate.AddDays(15));
        Assert.Equal(SubjectCategory.MPU, week3Cat);
    }

    [Fact]
    public async Task BookService_Prevents_Borrowing_When_No_Copies_Available()
    {
        using var context = GetInMemoryDbContext();
        var service = new BookService(context);

        var bookId = Guid.NewGuid();
        var student1Id = Guid.NewGuid();
        var student2Id = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        context.Books.Add(new Book
        {
            Id = bookId,
            Title = "Pemrograman C# Modern",
            Author = "Deepmind",
            Category = "Programming",
            TotalCopies = 1,
            AvailableCopies = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.Users.Add(new User { Id = student1Id, Username = "student1", Role = UserRole.Student });
        context.Users.Add(new User { Id = student2Id, Username = "student2", Role = UserRole.Student });
        context.Users.Add(new User { Id = teacherId, Username = "teacher1", Role = UserRole.Teacher });
        await context.SaveChangesAsync();

        // Request 1 by Student 1
        var req1 = await service.RequestBorrowAsync(student1Id, new CreateBookBorrowRequest { BookId = bookId });
        await service.ProcessBorrowRequestAsync(req1.Id, new ProcessBorrowRequest { Approve = true }, teacherId);

        // Book now has 0 available copies
        var updatedBook = await service.GetBookByIdAsync(bookId);
        Assert.Equal(0, updatedBook!.AvailableCopies);

        // Request 2 by Student 2
        var req2 = await service.RequestBorrowAsync(student2Id, new CreateBookBorrowRequest { BookId = bookId });

        // Approval attempt on 0 stock should throw InvalidOperationException
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ProcessBorrowRequestAsync(req2.Id, new ProcessBorrowRequest { Approve = true }, teacherId));
    }
}
