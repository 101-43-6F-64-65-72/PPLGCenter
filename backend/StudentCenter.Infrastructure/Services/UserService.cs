using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly PasswordHasher<User> _passwordHasher;
 
    public UserService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var user = await _context.Set<User>()
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null)
        {
            return new LoginResult { Status = LoginStatus.UserNotFound };
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            return new LoginResult { Status = LoginStatus.InvalidPassword };
        }

        if (!user.IsActive)
        {
            return new LoginResult { Status = LoginStatus.UserInactive };
        }

        var token = _jwtService.GenerateToken(user);

        return new LoginResult
        {
            Status = LoginStatus.Success,
            Data = new LoginResponse
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString()
            }
        };
    }

    public async Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role, bool? isActive)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<User>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(searchLower) || u.Email.ToLower().Contains(searchLower));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<UserResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<UserResponse?> GetUserByIdAsync(Guid id)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return null;

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<UserResponse?> CreateUserAsync(CreateUserRequest request)
    {
        if (await _context.Set<User>().AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Email is already taken.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Set<User>().Add(user);
        await _context.SaveChangesAsync();

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return null;

        if (await _context.Set<User>().AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != id))
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Email is already taken.");
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        }

        await _context.SaveChangesAsync();

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<UserResponse?> UpdateUserStatusAsync(Guid id, bool isActive)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return null;

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return false;

        _context.Set<User>().Remove(user);
        await _context.SaveChangesAsync();

        return true;
    }
}
