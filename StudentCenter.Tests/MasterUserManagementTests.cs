using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Xunit;

namespace StudentCenter.Tests;

public class MasterUserManagementTests
{
    private AppDbContext GetDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateStudent_Success()
    {
        using var context = GetDbContext(nameof(CreateStudent_Success));
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var userService = new UserService(context, jwtService, Mock.Of<ILogger<UserService>>());

        var req = new CreateUserRequest
        {
            FullName = "Ahmad Budi",
            Email = "ahmad@student.com",
            NIS = "12345",
            NISN = "0012345",
            Password = "Password123!",
            Role = UserRole.Student
        };

        var result = await userService.CreateUserAsync(req);

        Assert.NotNull(result);
        Assert.Equal("Ahmad Budi", result.FullName);
        Assert.Equal("12345", result.NIS);
    }

    [Fact]
    public async Task UpdateStudent_Success()
    {
        using var context = GetDbContext(nameof(UpdateStudent_Success));
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var userService = new UserService(context, jwtService, Mock.Of<ILogger<UserService>>());

        var req = new CreateUserRequest
        {
            FullName = "Budi Old",
            Email = "budiold@student.com",
            NIS = "22222",
            Password = "Password123!",
            Role = UserRole.Student
        };

        var created = await userService.CreateUserAsync(req);
        Assert.NotNull(created);

        var updateReq = new UpdateUserRequest
        {
            FullName = "Budi Updated",
            Email = "budiupdated@student.com",
            NIS = "22222",
            Role = UserRole.Student
        };

        var updated = await userService.UpdateUserAsync(created.Id, updateReq);

        Assert.NotNull(updated);
        Assert.Equal("Budi Updated", updated.FullName);
        Assert.Equal("budiupdated@student.com", updated.Email);
    }

    [Fact]
    public async Task DeleteStudent_Success()
    {
        using var context = GetDbContext(nameof(DeleteStudent_Success));
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var userService = new UserService(context, jwtService, Mock.Of<ILogger<UserService>>());

        var created = await userService.CreateUserAsync(new CreateUserRequest
        {
            FullName = "Delete Me",
            Email = "delete@student.com",
            Password = "Password123!",
            Role = UserRole.Student
        });

        var deleted = await userService.DeleteUserAsync(created!.Id);
        Assert.True(deleted);

        var found = await userService.GetUserByIdAsync(created.Id);
        Assert.Null(found);
    }

    [Fact]
    public async Task CreateTeacher_Success()
    {
        using var context = GetDbContext(nameof(CreateTeacher_Success));
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var userService = new UserService(context, jwtService, Mock.Of<ILogger<UserService>>());

        var created = await userService.CreateUserAsync(new CreateUserRequest
        {
            FullName = "Drs. Mulyono",
            Email = "mulyono@teacher.com",
            NIP = "19800101",
            Position = "Guru Fisika",
            Password = "Password123!",
            Role = UserRole.Teacher
        });

        Assert.NotNull(created);
        Assert.Equal("Drs. Mulyono", created.FullName);
        Assert.Equal("19800101", created.NIP);
    }

    [Fact]
    public async Task AssignHomeroomTeacher_Success()
    {
        using var context = GetDbContext(nameof(AssignHomeroomTeacher_Success));
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var userService = new UserService(context, jwtService, Mock.Of<ILogger<UserService>>());

        // Seed teacher & class
        var teacher = new User
        {
            Id = Guid.NewGuid(),
            FullName = "Guru Wali",
            Email = "wali@school.com",
            NIP = "19901111",
            Role = UserRole.Teacher,
            IsActive = true,
            PasswordHash = "hash"
        };
        context.Users.Add(teacher);

        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "Rekayasa Perangkat Lunak" };
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        var schoolClass = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };
        
        context.Departments.Add(dept);
        context.AcademicYears.Add(year);
        context.SchoolClasses.Add(schoolClass);
        await context.SaveChangesAsync();

        var assignRes = await userService.AssignTeacherAsync(new AssignTeacherRequest
        {
            TeacherId = teacher.Id,
            HomeroomClassId = schoolClass.Id
        });

        Assert.NotNull(assignRes);
        var clsInDb = await context.SchoolClasses.FindAsync(schoolClass.Id);
        Assert.Equal(teacher.Id, clsInDb?.HomeroomTeacherId);
    }

    [Fact]
    public async Task AssignAdvisor_Success()
    {
        using var context = GetDbContext(nameof(AssignAdvisor_Success));
        var jwtService = new JwtService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        var userService = new UserService(context, jwtService, Mock.Of<ILogger<UserService>>());

        var teacher = new User { Id = Guid.NewGuid(), FullName = "Guru Pembina", Email = "pembina@school.com", Role = UserRole.Teacher, IsActive = true, PasswordHash = "hash" };
        var extra1 = new Extracurricular { Id = Guid.NewGuid(), Name = "Basket" };
        var extra2 = new Extracurricular { Id = Guid.NewGuid(), Name = "Pramuka" };

        context.Users.Add(teacher);
        context.Extracurriculars.AddRange(extra1, extra2);
        await context.SaveChangesAsync();

        var assignRes = await userService.AssignTeacherAsync(new AssignTeacherRequest
        {
            TeacherId = teacher.Id,
            AdvisorExtracurricularIds = new List<Guid> { extra1.Id, extra2.Id }
        });

        Assert.NotNull(assignRes);
        var advisors = await context.ExtracurricularAdvisors.Where(a => a.TeacherId == teacher.Id).ToListAsync();
        Assert.Equal(2, advisors.Count);
    }

    [Fact]
    public async Task ImportStudents_Success_And_Duplicates_Skipped()
    {
        using var context = GetDbContext(nameof(ImportStudents_Success_And_Duplicates_Skipped));
        var importService = new UserImportService(context);

        // Seed department & class
        var dept = new Department { Id = Guid.NewGuid(), Code = "RPL", Name = "Rekayasa Perangkat Lunak" };
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        var schoolClass = new SchoolClass { Id = Guid.NewGuid(), Name = "X RPL 1", Grade = "X", DepartmentId = dept.Id, AcademicYearId = year.Id };

        context.Departments.Add(dept);
        context.AcademicYears.Add(year);
        context.SchoolClasses.Add(schoolClass);

        // Existing student with NIS 10001
        context.Users.Add(new User { Id = Guid.NewGuid(), FullName = "Existing", NIS = "10001", Email = "exist@school.com", Role = UserRole.Student, IsActive = true, PasswordHash = "hash" });
        await context.SaveChangesAsync();

        var csv = @"Nama,NIS,NISN,Jurusan,Kelas,Email,HP,Gender,Tanggal Lahir,Alamat,Nomor Absen,Password
Siswa Baru 1,10002,20002,RPL,X RPL 1,baru1@school.com,08123,Laki-laki,2008-01-01,Solo,1,Pass123!
Siswa Duplikat,10001,20003,RPL,X RPL 1,dup@school.com,08124,Laki-laki,2008-01-01,Solo,2,Pass123!
Siswa Invalid Class,10003,20004,RPL,Kelas Ga Ada,inv@school.com,08125,Laki-laki,2008-01-01,Solo,3,Pass123!";

        var report = await importService.ImportStudentsCsvAsync(csv);

        Assert.Equal(3, report.TotalRead);
        Assert.Equal(1, report.SuccessCount);
        Assert.Equal(1, report.SkippedCount); // NIS 10001 skipped
        Assert.Equal(1, report.FailedCount);  // Class missing failed
    }

    [Fact]
    public async Task DepartmentCRUD_Success()
    {
        using var context = GetDbContext(nameof(DepartmentCRUD_Success));
        var deptService = new DepartmentService(context);

        // Create
        var created = await deptService.CreateAsync(new CreateDepartmentRequest { Code = "TKJ", Name = "Teknik Komputer Jaringan" });
        Assert.Equal("TKJ", created.Code);

        // Update
        var updated = await deptService.UpdateAsync(created.Id, new UpdateDepartmentRequest { Code = "TKJ-EDIT", Name = "Teknik Komputer Jaringan Edit" });
        Assert.Equal("TKJ-EDIT", updated!.Code);

        // Delete
        var deleted = await deptService.DeleteAsync(created.Id);
        Assert.True(deleted);
    }

    [Fact]
    public async Task ClassCRUD_Success()
    {
        using var context = GetDbContext(nameof(ClassCRUD_Success));
        var classService = new SchoolClassService(context);

        var dept = new Department { Id = Guid.NewGuid(), Code = "DKV", Name = "Desain Komunikasi Visual" };
        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        context.Departments.Add(dept);
        context.AcademicYears.Add(year);
        await context.SaveChangesAsync();

        // Create
        var created = await classService.CreateAsync(new CreateSchoolClassRequest
        {
            Name = "X DKV 1",
            Grade = "X",
            DepartmentId = dept.Id,
            AcademicYearId = year.Id,
            Capacity = 36
        });
        Assert.Equal("X DKV 1", created.Name);

        // Update
        var updated = await classService.UpdateAsync(created.Id, new UpdateSchoolClassRequest
        {
            Name = "X DKV 1 Edit",
            Grade = "X",
            DepartmentId = dept.Id,
            AcademicYearId = year.Id,
            Capacity = 40
        });
        Assert.Equal("X DKV 1 Edit", updated!.Name);

        // Delete
        var deleted = await classService.DeleteAsync(created.Id);
        Assert.True(deleted);
    }

    [Fact]
    public async Task AcademicYearCRUD_SingleActiveEnforcement()
    {
        using var context = GetDbContext(nameof(AcademicYearCRUD_SingleActiveEnforcement));
        var yearService = new AcademicYearService(context);

        var year1 = await yearService.CreateAsync(new CreateAcademicYearRequest { Name = "2024/2025", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true });
        var year2 = await yearService.CreateAsync(new CreateAcademicYearRequest { Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true });

        // Year 2 set to active should turn off Year 1
        var list = await yearService.GetAllAsync();
        var activeItem = list.Single(y => y.IsActive);
        Assert.Equal(year2.Id, activeItem.Id);
    }

    [Fact]
    public async Task SemesterCRUD_SingleActiveEnforcement()
    {
        using var context = GetDbContext(nameof(SemesterCRUD_SingleActiveEnforcement));
        var semService = new SemesterService(context);

        var year = new AcademicYear { Id = Guid.NewGuid(), Name = "2025/2026", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        context.AcademicYears.Add(year);
        await context.SaveChangesAsync();

        var sem1 = await semService.CreateAsync(new CreateSemesterRequest { AcademicYearId = year.Id, Name = "Ganjil", Order = 1, IsActive = true });
        var sem2 = await semService.CreateAsync(new CreateSemesterRequest { AcademicYearId = year.Id, Name = "Genap", Order = 2, IsActive = true });

        var list = await semService.GetAllAsync();
        var activeSem = list.Single(s => s.IsActive);
        Assert.Equal(sem2.Id, activeSem.Id);
    }
}
