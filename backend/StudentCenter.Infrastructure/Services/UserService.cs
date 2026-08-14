using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Application.Helpers;

namespace StudentCenter.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly ILogger<UserService> _logger;
    private readonly PasswordHasher<User> _passwordHasher;

    public UserService(AppDbContext context, IJwtService jwtService, ILogger<UserService> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _logger = logger;
        _passwordHasher = new PasswordHasher<User>();
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request)
    {
        var identifier = request.GetEffectiveIdentifier();
        if (string.IsNullOrWhiteSpace(identifier))
        {
            _logger.LogWarning("Login failed: Identifier is empty. LoginType: {LoginType}", request.LoginType);
            return new LoginResult { Status = LoginStatus.UserNotFound };
        }

        var identifierLower = identifier.ToLower();
        var loginType = request.LoginType?.Trim() ?? string.Empty;

        var baseQuery = _context.Set<User>()
            .Include(u => u.Class)
                .ThenInclude(c => c!.Department);

        User? user;
        string userType;
        string primaryIdentifier;

        if (loginType.Equals("Student", StringComparison.OrdinalIgnoreCase))
        {
            // Student: authenticate by NIS or NISN only
            user = await baseQuery
                .FirstOrDefaultAsync(u =>
                    u.Role == UserRole.Student &&
                    ((u.NIS != null && u.NIS.ToLower() == identifierLower) ||
                     (u.NISN != null && u.NISN.ToLower() == identifierLower)));

            userType = "Student";
            primaryIdentifier = identifier;
        }
        else if (loginType.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
        {
            // Teacher: authenticate by NIP, Email, or Username
            user = await baseQuery
                .FirstOrDefaultAsync(u =>
                    u.Role == UserRole.Teacher &&
                    ((u.NIP != null && u.NIP.ToLower() == identifierLower) ||
                     u.Email.ToLower() == identifierLower ||
                     (u.Username != null && u.Username.ToLower() == identifierLower)));

            userType = "Teacher";
            primaryIdentifier = identifier;
        }
        else
        {
            // Admin / fallback: Email or Username
            user = await baseQuery
                .FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == identifierLower ||
                    (u.Username != null && u.Username.ToLower() == identifierLower) ||
                    (u.NIS != null && u.NIS.ToLower() == identifierLower) ||
                    (u.NISN != null && u.NISN.ToLower() == identifierLower) ||
                    (u.NIP != null && u.NIP.ToLower() == identifierLower));

            userType = user?.Role.ToString() ?? "Unknown";
            primaryIdentifier = identifier;
        }

        if (user is null)
        {
            _logger.LogWarning("Login failed: User not found for Identifier '{Identifier}' with LoginType '{LoginType}'.", identifier, loginType);
            return new LoginResult { Status = LoginStatus.UserNotFound };
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            _logger.LogWarning("Login failed: Invalid password for User '{Email}' (Role: {Role}).", user.Email, user.Role);
            return new LoginResult { Status = LoginStatus.InvalidPassword };
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed: Account '{Email}' is inactive.", user.Email);
            return new LoginResult { Status = LoginStatus.UserInactive };
        }

        // Generate JWT with extended claims
        var token = _jwtService.GenerateToken(user, primaryIdentifier, userType);

        // Build memberships (for Student)
        var memberships = new List<MembershipInfo>();
        if (user.Role == UserRole.Student)
        {
            var memberRows = await _context.ExtracurricularMembers
                .Include(m => m.Extracurricular)
                .Where(m => m.StudentId == user.Id && m.Status == "Active")
                .ToListAsync();

            memberships = memberRows.Select(m => new MembershipInfo
            {
                ExtracurricularId = m.ExtracurricularId,
                Name = m.Extracurricular?.Name ?? string.Empty,
                Position = m.Position.ToString(),
                Status = m.Status
            }).ToList();
        }

        // Build advisorFor (for Teacher)
        var advisorFor = new List<AdvisorInfo>();
        if (user.Role == UserRole.Teacher)
        {
            var supervisedEkskul = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => e.SupervisorTeacherId == user.Id && e.IsActive)
                .Select(e => new AdvisorInfo { ExtracurricularId = e.Id, Name = e.Name })
                .ToListAsync();

            var advisorRows = await _context.ExtracurricularAdvisors
                .AsNoTracking()
                .Include(a => a.Extracurricular)
                .Where(a => a.TeacherId == user.Id && a.Extracurricular.IsActive)
                .Select(a => new AdvisorInfo { ExtracurricularId = a.ExtracurricularId, Name = a.Extracurricular.Name })
                .ToListAsync();

            advisorFor = supervisedEkskul.Concat(advisorRows)
                .GroupBy(a => a.ExtracurricularId)
                .Select(g => g.First())
                .ToList();
        }

        // Build granted permissions (capabilities)
        var userPermissions = await _context.UserPermissions
            .AsNoTracking()
            .Where(p => p.UserId == user.Id)
            .Select(p => p.Capability)
            .ToListAsync();

        // Build Community Groups memberships
        var communityGroups = await _context.CommunityGroupMembers
            .AsNoTracking()
            .Include(c => c.Group)
            .Where(c => c.UserId == user.Id && c.Status == Domain.Enums.CommunityMemberStatus.Accepted)
            .Select(c => new CommunityGroupMembershipInfo
            {
                GroupId = c.GroupId,
                Name = c.Group != null ? c.Group.Name : string.Empty,
                Role = c.Role.ToString(),
                Status = c.Status.ToString()
            })
            .ToListAsync();

        return new LoginResult
        {
            Status = LoginStatus.Success,
            Data = new LoginResponse
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                UserType = userType,
                PrimaryIdentifier = primaryIdentifier,
                Permissions = userPermissions,
                CommunityGroups = communityGroups,
                User = new LoginUserInfo
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Username = user.Username,
                    NIS = user.NIS,
                    NISN = user.NISN,
                    NIP = user.NIP,
                    PhoneNumber = user.PhoneNumber,
                    PhotoUrl = FileUrlHelper.ResolveUrl(user.PhotoUrl),
                    Role = user.Role.ToString(),
                    IsActive = user.IsActive,
                    ClassId = user.ClassId,
                    ClassName = user.Class?.Name,
                    DepartmentCode = user.Class?.Department?.Code,
                    StudentNumber = user.StudentNumber,
                    Gender = user.Gender,
                    BirthDate = user.BirthDate,
                    Address = user.Address,
                    Position = user.Position,
                    Permissions = userPermissions
                },
                Memberships = memberships,
                AdvisorFor = advisorFor
            }
        };
    }

    public async Task<PagedResult<UserResponse>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role, bool? isActive, Guid? classId = null, Guid? departmentId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<User>()
            .Include(u => u.Class)
                .ThenInclude(c => c!.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower) ||
                (u.Username != null && u.Username.ToLower().Contains(searchLower)) ||
                (u.NIS != null && u.NIS.ToLower().Contains(searchLower)) ||
                (u.NISN != null && u.NISN.ToLower().Contains(searchLower)) ||
                (u.NIP != null && u.NIP.ToLower().Contains(searchLower)));
        }

        if (role.HasValue)
        {
            query = query.Where(u => u.Role == role.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        if (classId.HasValue)
        {
            query = query.Where(u => u.ClassId == classId.Value);
        }

        if (departmentId.HasValue)
        {
            query = query.Where(u => u.Class != null && u.Class.DepartmentId == departmentId.Value);
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
                Username = u.Username,
                NIS = u.NIS,
                NISN = u.NISN,
                NIP = u.NIP,
                PhoneNumber = u.PhoneNumber,
                PhotoUrl = FileUrlHelper.ResolveUrl(u.PhotoUrl),
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                ClassId = u.ClassId,
                ClassName = u.Class != null ? u.Class.Name : null,
                DepartmentCode = u.Class != null && u.Class.Department != null ? u.Class.Department.Code : null,
                StudentNumber = u.StudentNumber,
                Gender = u.Gender,
                BirthDate = u.BirthDate,
                Address = u.Address,
                Position = u.Position,
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
        var user = await _context.Set<User>()
            .Include(u => u.Class)
                .ThenInclude(c => c!.Department)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return null;

        return new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Username = user.Username,
            NIS = user.NIS,
            NISN = user.NISN,
            NIP = user.NIP,
            PhoneNumber = user.PhoneNumber,
            PhotoUrl = FileUrlHelper.ResolveUrl(user.PhotoUrl),
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            ClassId = user.ClassId,
            ClassName = user.Class?.Name,
            DepartmentCode = user.Class?.Department?.Code,
            StudentNumber = user.StudentNumber,
            Gender = user.Gender,
            BirthDate = user.BirthDate,
            Address = user.Address,
            Position = user.Position,
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

        if (!string.IsNullOrWhiteSpace(request.Username) &&
            await _context.Set<User>().AnyAsync(u => u.Username != null && u.Username.ToLower() == request.Username.ToLower()))
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Username is already taken.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            Username = request.Username,
            NIS = request.NIS,
            NISN = request.NISN,
            NIP = request.NIP,
            PhoneNumber = request.PhoneNumber,
            PhotoUrl = request.PhotoUrl,
            ClassId = request.ClassId,
            StudentNumber = request.StudentNumber,
            Gender = request.Gender,
            BirthDate = request.BirthDate,
            Address = request.Address,
            Position = request.Position,
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Set<User>().Add(user);
        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserResponse?> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return null;

        if (await _context.Set<User>().AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.Id != id))
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Email is already taken.");
        }

        if (!string.IsNullOrWhiteSpace(request.Username) &&
            await _context.Set<User>().AnyAsync(u => u.Username != null && u.Username.ToLower() == request.Username.ToLower() && u.Id != id))
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Username is already taken.");
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Username = request.Username;
        user.NIS = request.NIS;
        user.NISN = request.NISN;
        user.NIP = request.NIP;
        user.PhoneNumber = request.PhoneNumber;
        user.PhotoUrl = request.PhotoUrl;
        user.ClassId = request.ClassId;
        user.StudentNumber = request.StudentNumber;
        user.Gender = request.Gender;
        user.BirthDate = request.BirthDate;
        user.Address = request.Address;
        user.Position = request.Position;
        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        }

        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserResponse?> UpdateUserStatusAsync(Guid id, bool isActive)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return null;

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _context.Set<User>().FindAsync(id);
        if (user is null) return false;

        _context.Set<User>().Remove(user);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<UserResponse?> AssignTeacherAsync(AssignTeacherRequest request)
    {
        var teacher = await _context.Set<User>().FirstOrDefaultAsync(u => u.Id == request.TeacherId && u.Role == UserRole.Teacher);
        if (teacher == null)
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Teacher not found.");
        }

        // 1. Manage Homeroom Class Assignment
        // Clear existing homeroom assignments for this teacher
        var existingHomeroomClasses = await _context.SchoolClasses.Where(c => c.HomeroomTeacherId == teacher.Id).ToListAsync();
        foreach (var cls in existingHomeroomClasses)
        {
            cls.HomeroomTeacherId = null;
            cls.UpdatedAt = DateTime.UtcNow;
        }

        if (request.HomeroomClassId.HasValue && request.HomeroomClassId.Value != Guid.Empty)
        {
            var targetClass = await _context.SchoolClasses.FindAsync(request.HomeroomClassId.Value);
            if (targetClass != null)
            {
                targetClass.HomeroomTeacherId = teacher.Id;
                targetClass.UpdatedAt = DateTime.UtcNow;
            }
        }

        // 2. Manage Extracurricular Advisor Assignments
        var currentAdvisors = await _context.ExtracurricularAdvisors.Where(a => a.TeacherId == teacher.Id).ToListAsync();
        _context.ExtracurricularAdvisors.RemoveRange(currentAdvisors);

        if (request.AdvisorExtracurricularIds != null && request.AdvisorExtracurricularIds.Any())
        {
            foreach (var meId in request.AdvisorExtracurricularIds.Distinct())
            {
                var extra = await _context.Extracurriculars.FindAsync(meId);
                if (extra != null)
                {
                    _context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
                    {
                        Id = Guid.NewGuid(),
                        TeacherId = teacher.Id,
                        ExtracurricularId = meId,
                        AssignedDate = DateTime.UtcNow
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        return await GetUserByIdAsync(teacher.Id);
    }

    public async Task<List<UserResponse>> GetActiveTeachersAsync()
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Teacher && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new UserResponse
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Username = u.Username,
                NIP = u.NIP,
                PhoneNumber = u.PhoneNumber,
                PhotoUrl = u.PhotoUrl,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                Position = u.Position,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();
    }
}
