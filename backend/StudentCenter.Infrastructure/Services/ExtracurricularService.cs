using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ExtracurricularService : IExtracurricularService
{
    private readonly AppDbContext _context;

    public ExtracurricularService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ExtracurricularResponse>> GetExtracurricularsAsync(int page, int pageSize, string? category = null, bool? isActive = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Extracurricular>()
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(e => e.Category.ToLower().Contains(category.ToLower()));
        }

        if (isActive.HasValue)
        {
            query = query.Where(e => e.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExtracurricularResponse
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                MaxMembers = e.MaxMembers,
                CurrentMembers = e.Members.Count,
                IsActive = e.IsActive,
                ManagedByUserId = e.ManagedByUserId,
                ManagedByUserName = e.ManagedByUser.FullName,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<ExtracurricularResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ExtracurricularResponse?> GetExtracurricularByIdAsync(Guid id)
    {
        return await _context.Set<Extracurricular>()
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new ExtracurricularResponse
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                MaxMembers = e.MaxMembers,
                CurrentMembers = e.Members.Count,
                IsActive = e.IsActive,
                ManagedByUserId = e.ManagedByUserId,
                ManagedByUserName = e.ManagedByUser.FullName,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ExtracurricularResponse> CreateExtracurricularAsync(CreateExtracurricularRequest request, Guid managerId)
    {
        var manager = await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == managerId);

        if (manager is null)
            throw new KeyNotFoundException("Manager not found.");

        if (manager.Role != UserRole.Admin && manager.Role != UserRole.Teacher)
            throw new InvalidOperationException("Only Admin and Teacher can create extracurriculars.");

        var extracurricular = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            Category = request.Category,
            MaxMembers = request.MaxMembers,
            IsActive = true,
            ManagedByUserId = managerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<Extracurricular>().Add(extracurricular);
        await _context.SaveChangesAsync();

        return new ExtracurricularResponse
        {
            Id = extracurricular.Id,
            Name = extracurricular.Name,
            Description = extracurricular.Description,
            ImageUrl = extracurricular.ImageUrl,
            Category = extracurricular.Category,
            MaxMembers = extracurricular.MaxMembers,
            CurrentMembers = 0,
            IsActive = extracurricular.IsActive,
            ManagedByUserId = extracurricular.ManagedByUserId,
            ManagedByUserName = manager.FullName,
            CreatedAt = extracurricular.CreatedAt,
            UpdatedAt = extracurricular.UpdatedAt
        };
    }

    public async Task<ExtracurricularResponse?> UpdateExtracurricularAsync(Guid id, UpdateExtracurricularRequest request, Guid managerId)
    {
        var extracurricular = await _context.Set<Extracurricular>()
            .Include(e => e.ManagedByUser)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (extracurricular is null)
            return null;

        if (extracurricular.ManagedByUserId != managerId)
        {
            var manager = await _context.Set<User>()
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (manager?.Role != UserRole.Admin)
                throw new UnauthorizedAccessException("You can only update extracurriculars you manage, or be Admin.");
        }

        extracurricular.Name = request.Name;
        extracurricular.Description = request.Description;
        extracurricular.ImageUrl = request.ImageUrl;
        extracurricular.Category = request.Category;
        extracurricular.MaxMembers = request.MaxMembers;
        extracurricular.IsActive = request.IsActive;
        extracurricular.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var memberCount = await _context.Set<ExtracurricularMember>()
            .AsNoTracking()
            .CountAsync(m => m.ExtracurricularId == id);

        return new ExtracurricularResponse
        {
            Id = extracurricular.Id,
            Name = extracurricular.Name,
            Description = extracurricular.Description,
            ImageUrl = extracurricular.ImageUrl,
            Category = extracurricular.Category,
            MaxMembers = extracurricular.MaxMembers,
            CurrentMembers = memberCount,
            IsActive = extracurricular.IsActive,
            ManagedByUserId = extracurricular.ManagedByUserId,
            ManagedByUserName = extracurricular.ManagedByUser.FullName,
            CreatedAt = extracurricular.CreatedAt,
            UpdatedAt = extracurricular.UpdatedAt
        };
    }

    public async Task<bool> DeleteExtracurricularAsync(Guid id, Guid managerId)
    {
        var extracurricular = await _context.Set<Extracurricular>()
            .FirstOrDefaultAsync(e => e.Id == id);

        if (extracurricular is null)
            return false;

        if (extracurricular.ManagedByUserId != managerId)
        {
            var manager = await _context.Set<User>()
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (manager?.Role != UserRole.Admin)
                throw new UnauthorizedAccessException("You can only delete extracurriculars you manage, or be Admin.");
        }

        _context.Set<Extracurricular>().Remove(extracurricular);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ExtracurricularMemberResponse> JoinExtracurricularAsync(Guid extracurricularId, Guid studentId)
    {
        var extracurricular = await _context.Set<Extracurricular>()
            .FirstOrDefaultAsync(e => e.Id == extracurricularId);

        if (extracurricular is null)
            throw new KeyNotFoundException("Extracurricular not found.");

        if (!extracurricular.IsActive)
            throw new InvalidOperationException("Cannot join inactive extracurricular.");

        var student = await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student is null)
            throw new KeyNotFoundException("Student not found.");

        if (student.Role != UserRole.Student)
            throw new InvalidOperationException("Only students can join extracurriculars.");

        var existingMembership = await _context.Set<ExtracurricularMember>()
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.StudentId == studentId);

        if (existingMembership is not null)
            throw new InvalidOperationException("Student is already a member of this extracurricular.");

        var memberCount = await _context.Set<ExtracurricularMember>()
            .AsNoTracking()
            .CountAsync(m => m.ExtracurricularId == extracurricularId);

        if (memberCount >= extracurricular.MaxMembers)
            throw new InvalidOperationException("This extracurricular has reached its maximum member capacity.");

        var member = new ExtracurricularMember
        {
            Id = Guid.NewGuid(),
            ExtracurricularId = extracurricularId,
            StudentId = studentId,
            JoinedAt = DateTime.UtcNow
        };

        _context.Set<ExtracurricularMember>().Add(member);
        await _context.SaveChangesAsync();

        return new ExtracurricularMemberResponse
        {
            Id = member.Id,
            ExtracurricularId = member.ExtracurricularId,
            StudentId = member.StudentId,
            StudentName = student.FullName,
            StudentEmail = student.Email,
            JoinedAt = member.JoinedAt
        };
    }

    public async Task<bool> LeaveExtracurricularAsync(Guid extracurricularId, Guid studentId)
    {
        var membership = await _context.Set<ExtracurricularMember>()
            .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.StudentId == studentId);

        if (membership is null)
            return false;

        _context.Set<ExtracurricularMember>().Remove(membership);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PagedResult<ExtracurricularMemberResponse>> GetExtracurricularMembersAsync(Guid extracurricularId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var extracurricular = await _context.Set<Extracurricular>()
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == extracurricularId);

        if (extracurricular is null)
            throw new KeyNotFoundException("Extracurricular not found.");

        var query = _context.Set<ExtracurricularMember>()
            .AsNoTracking()
            .Where(m => m.ExtracurricularId == extracurricularId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.JoinedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new ExtracurricularMemberResponse
            {
                Id = m.Id,
                ExtracurricularId = m.ExtracurricularId,
                StudentId = m.StudentId,
                StudentName = m.Student.FullName,
                StudentEmail = m.Student.Email,
                JoinedAt = m.JoinedAt
            })
            .ToListAsync();

        return new PagedResult<ExtracurricularMemberResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
