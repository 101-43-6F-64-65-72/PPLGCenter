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

    [Fact]
    public async Task LoginAsync_ValidUser_ReturnsSuccess()
    {
        // Arrange
        var password = "Password123!";
        var user = new User 
        { 
            Id = Guid.NewGuid(), 
            Email = "test@test.com", 
            FullName = "Test User", 
            Role = UserRole.Student,
            IsActive = true 
        };
        var hasher = new PasswordHasher<User>();
        user.PasswordHash = hasher.HashPassword(user, password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _mockJwtService.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("fake-token");

        // Act
        var result = await _service.LoginAsync(new LoginRequest { Email = "test@test.com", Password = password });

        // Assert
        result.Status.Should().Be(LoginStatus.Success);
        result.Data!.Token.Should().Be("fake-token");
    }

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
}
