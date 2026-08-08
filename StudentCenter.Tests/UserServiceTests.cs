using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace StudentCenter.Tests;

public class UserServiceTests
{
    private readonly AppDbContext _context;
    private readonly Mock<IJwtService> _mockJwtService;
    private readonly UserService _service;

    public UserServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _mockJwtService = new Mock<IJwtService>();
        _service = new UserService(_context, _mockJwtService.Object);
    }

    // ─────────────────────────────────────────────────────────
    // Admin login
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_Admin_ByEmail_ReturnsSuccess()
    {
        // Arrange
        var password = "Admin123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@test.com",
            FullName = "System Admin",
            Role = UserRole.Admin,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>())).Returns("admin-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Admin",
            Email = "admin@test.com",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("admin-token");
        result.Data.Role.Should().Be("Admin");
        result.Data.UserType.Should().Be("Admin");
    }

    [Fact]
    public async Task LoginAsync_Admin_ByUsername_ReturnsSuccess()
    {
        // Arrange
        var password = "Admin123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@test.com",
            Username = "admin",
            FullName = "System Admin",
            Role = UserRole.Admin,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>())).Returns("admin-token-2");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            Identifier = "admin",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("admin-token-2");
    }

    // ─────────────────────────────────────────────────────────
    // Student login
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_Student_ByNIS_ReturnsSuccess()
    {
        // Arrange
        var password = "Student123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@test.com",
            FullName = "Ahmad Rizky",
            NIS = "54321",
            NISN = "0051234567",
            Role = UserRole.Student,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), "54321", "Student")).Returns("student-nis-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Student",
            Identifier = "54321",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("student-nis-token");
        result.Data.UserType.Should().Be("Student");
        result.Data.PrimaryIdentifier.Should().Be("54321");
        result.Data.User!.NIS.Should().Be("54321");
    }

    [Fact]
    public async Task LoginAsync_Student_ByNISN_ReturnsSuccess()
    {
        // Arrange
        var password = "Student123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@test.com",
            FullName = "Ahmad Rizky",
            NIS = "54321",
            NISN = "0051234567",
            Role = UserRole.Student,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), "0051234567", "Student")).Returns("student-nisn-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Student",
            Identifier = "0051234567",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("student-nisn-token");
        result.Data.UserType.Should().Be("Student");
        result.Data.PrimaryIdentifier.Should().Be("0051234567");
    }

    [Fact]
    public async Task LoginAsync_Student_ByEmail_ShouldFail_WhenLoginTypeStudent()
    {
        // Arrange: Student trying to log in with email via Student login type
        var password = "Student123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@test.com",
            FullName = "Ahmad Rizky",
            NIS = "54321",
            NISN = "0051234567",
            Role = UserRole.Student,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act: Student login type with email identifier — must not find via email
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Student",
            Identifier = "student@test.com",
            Password = password
        });

        // Assert: Must return UserNotFound since Student login only matches NIS/NISN
        result.Status.Should().Be(LoginStatus.UserNotFound);
    }

    // ─────────────────────────────────────────────────────────
    // Teacher login
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_Teacher_ByNIP_ReturnsSuccess()
    {
        // Arrange
        var password = "Guru123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "guru@test.com",
            FullName = "Budi Santoso",
            NIP = "198501012010011001",
            Role = UserRole.Teacher,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), "198501012010011001", "Teacher")).Returns("teacher-nip-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Teacher",
            Identifier = "198501012010011001",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("teacher-nip-token");
        result.Data.UserType.Should().Be("Teacher");
        result.Data.PrimaryIdentifier.Should().Be("198501012010011001");
        result.Data.User!.NIP.Should().Be("198501012010011001");
    }

    [Fact]
    public async Task LoginAsync_Teacher_WrongNIP_ReturnsUserNotFound()
    {
        // Arrange
        var password = "Guru123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "guru@test.com",
            FullName = "Budi Santoso",
            NIP = "198501012010011001",
            Role = UserRole.Teacher,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Teacher",
            Identifier = "WRONG_NIP",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.UserNotFound);
    }

    // ─────────────────────────────────────────────────────────
    // General error cases
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_InvalidPassword_ReturnsInvalidPassword()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "test@test.com",
            PasswordHash = new PasswordHasher<User>().HashPassword(new User(), "Password123!"),
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.LoginAsync(new LoginRequest { Email = "test@test.com", Password = "wrongpassword" });

        // Assert
        result.Status.Should().Be(LoginStatus.InvalidPassword);
    }

    [Fact]
    public async Task LoginAsync_InactiveUser_ReturnsUserInactive()
    {
        // Arrange
        var password = "Student123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "inactive@test.com",
            FullName = "Inactive Student",
            NIS = "99999",
            NISN = "0099999999",
            Role = UserRole.Student,
            IsActive = false
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>())).Returns("token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Student",
            Identifier = "99999",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.UserInactive);
    }

    // ─────────────────────────────────────────────────────────
    // Response payload
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_Student_ResponseContainsMemberships()
    {
        // Arrange
        var password = "Student123!";
        var studentId = Guid.NewGuid();
        var user = new User
        {
            Id = studentId,
            Email = "student2@test.com",
            FullName = "Siti Nurbaya",
            NIS = "11111",
            NISN = "0011111111",
            Role = UserRole.Student,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);

        var extra = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "OSIS",
            Category = "General",
            IsActive = true,
            ManagedByUserId = studentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Extracurriculars.Add(extra);

        _context.ExtracurricularMembers.Add(new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            ExtracurricularId = extra.Id,
            Position = ExtracurricularMemberPosition.Leader,
            Status = "Active",
            JoinDate = DateTime.UtcNow,
            JoinedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>())).Returns("token-with-memberships");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Student",
            Identifier = "11111",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Memberships.Should().HaveCount(1);
        result.Data.Memberships[0].Name.Should().Be("OSIS");
        result.Data.Memberships[0].Position.Should().Be("Leader");
        result.Data.AdvisorFor.Should().BeEmpty();
    }

    [Fact]
    public async Task LoginAsync_Teacher_ResponseContainsAdvisorFor()
    {
        // Arrange
        var password = "Guru123!";
        var teacherId = Guid.NewGuid();
        var user = new User
        {
            Id = teacherId,
            Email = "guru2@test.com",
            FullName = "Pak Guru",
            NIP = "198888882020011001",
            Role = UserRole.Teacher,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);

        var extra = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = "Pramuka",
            Category = "General",
            IsActive = true,
            ManagedByUserId = teacherId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Extracurriculars.Add(extra);

        _context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            ExtracurricularId = extra.Id,
            AssignedDate = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>())).Returns("token-with-advisor");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Teacher",
            Identifier = "198888882020011001",
            Password = password
        });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.AdvisorFor.Should().HaveCount(1);
        result.Data.AdvisorFor[0].Name.Should().Be("Pramuka");
        result.Data.Memberships.Should().BeEmpty();
    }

    // ─────────────────────────────────────────────────────────
    // JWT Claims validation
    // ─────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_Student_JwtCalledWithCorrectUserTypeAndPrimaryIdentifier()
    {
        // Arrange
        var password = "Student123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "jwt@test.com",
            FullName = "JWT Test",
            NIS = "77777",
            NISN = "0077777777",
            Role = UserRole.Student,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService
            .Setup(x => x.GenerateToken(It.IsAny<User>(), "77777", "Student"))
            .Returns("claims-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Student",
            Identifier = "77777",
            Password = password
        });

        // Assert: JWT was called with correct userType and primaryIdentifier
        _mockJwtService.Verify(
            x => x.GenerateToken(It.IsAny<User>(), "77777", "Student"),
            Times.Once);
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("claims-token");
    }

    [Fact]
    public async Task LoginAsync_Teacher_JwtCalledWithNIPAsPrimaryIdentifier()
    {
        // Arrange
        var password = "Guru123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "jwt-guru@test.com",
            FullName = "JWT Guru",
            NIP = "197501012005011001",
            Role = UserRole.Teacher,
            IsActive = true
        };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService
            .Setup(x => x.GenerateToken(It.IsAny<User>(), "197501012005011001", "Teacher"))
            .Returns("teacher-claims-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest
        {
            LoginType = "Teacher",
            Identifier = "197501012005011001",
            Password = password
        });

        // Assert
        _mockJwtService.Verify(
            x => x.GenerateToken(It.IsAny<User>(), "197501012005011001", "Teacher"),
            Times.Once);
        result.Data!.Token.Should().Be("teacher-claims-token");
    }

    // ─────────────────────────────────────────────────────────
    // Backward-compatible fallback (no loginType)
    // ─────────────────────────────────────────────────────────

    [Theory]
    [InlineData("testuser")]
    [InlineData("12345")]
    [InlineData("987654321")]
    [InlineData("NIP001")]
    public async Task LoginAsync_NoLoginType_FallbackToMultiIdentifier_ReturnsSuccess(string identifierValue)
    {
        // Arrange
        var password = "Password123!";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "ident@test.com",
            Username = "testuser",
            NIS = "12345",
            NISN = "987654321",
            NIP = "NIP001",
            FullName = "Identifier User",
            Role = UserRole.Student,
            IsActive = true
        };
        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>())).Returns("fake-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest { Identifier = identifierValue, Password = password });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("fake-token");
    }
}
