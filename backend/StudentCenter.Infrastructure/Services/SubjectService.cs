using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class SubjectService : ISubjectService
{
    private readonly AppDbContext _context;

    public SubjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SubjectResponse>> GetAllAsync(bool? isActive = null)
    {
        var query = _context.Subjects.AsNoTracking().AsQueryable();
        if (isActive.HasValue)
            query = query.Where(s => s.IsActive == isActive.Value);

        return await query
            .OrderBy(s => s.Code)
            .Select(s => new SubjectResponse
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Description = s.Description,
                IsActive = s.IsActive,
                TeacherCount = s.TeacherSubjects.Count,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<SubjectResponse?> GetByIdAsync(Guid id)
    {
        var s = await _context.Subjects
            .AsNoTracking()
            .Include(sub => sub.TeacherSubjects)
            .FirstOrDefaultAsync(sub => sub.Id == id);

        if (s == null) return null;

        return new SubjectResponse
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            Description = s.Description,
            IsActive = s.IsActive,
            TeacherCount = s.TeacherSubjects.Count,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }

    public async Task<SubjectResponse> CreateAsync(CreateSubjectRequest request)
    {
        var codeUpper = request.Code.Trim().ToUpper();
        if (await _context.Subjects.AnyAsync(s => s.Code.ToUpper() == codeUpper))
        {
            throw new ValidationException($"Subject with code '{codeUpper}' already exists.");
        }

        var subject = new Subject
        {
            Id = Guid.NewGuid(),
            Code = codeUpper,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();

        return new SubjectResponse
        {
            Id = subject.Id,
            Code = subject.Code,
            Name = subject.Name,
            Description = subject.Description,
            IsActive = subject.IsActive,
            TeacherCount = 0,
            CreatedAt = subject.CreatedAt,
            UpdatedAt = subject.UpdatedAt
        };
    }

    public async Task<SubjectResponse?> UpdateAsync(Guid id, UpdateSubjectRequest request)
    {
        var subject = await _context.Subjects.FindAsync(id);
        if (subject == null) return null;

        var codeUpper = request.Code.Trim().ToUpper();
        if (await _context.Subjects.AnyAsync(s => s.Code.ToUpper() == codeUpper && s.Id != id))
        {
            throw new ValidationException($"Subject with code '{codeUpper}' already exists.");
        }

        subject.Code = codeUpper;
        subject.Name = request.Name.Trim();
        subject.Description = request.Description?.Trim();
        subject.IsActive = request.IsActive;
        subject.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var subject = await _context.Subjects.FindAsync(id);
        if (subject == null) return false;

        _context.Subjects.Remove(subject);
        await _context.SaveChangesAsync();
        return true;
    }
}
