using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class SemesterService : ISemesterService
{
    private readonly AppDbContext _context;

    public SemesterService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SemesterResponse>> GetAllAsync(Guid? academicYearId = null)
    {
        var query = _context.Semesters
            .AsNoTracking()
            .Include(s => s.AcademicYear)
            .AsQueryable();

        if (academicYearId.HasValue)
            query = query.Where(s => s.AcademicYearId == academicYearId.Value);

        var list = await query.OrderBy(s => s.Order).ToListAsync();

        return list.Select(s => new SemesterResponse
        {
            Id = s.Id,
            AcademicYearId = s.AcademicYearId,
            AcademicYearName = s.AcademicYear?.Name ?? string.Empty,
            Name = s.Name,
            Order = s.Order,
            IsActive = s.IsActive
        }).ToList();
    }

    public async Task<SemesterResponse?> GetByIdAsync(Guid id)
    {
        var s = await _context.Semesters
            .AsNoTracking()
            .Include(sem => sem.AcademicYear)
            .FirstOrDefaultAsync(sem => sem.Id == id);

        if (s == null) return null;

        return new SemesterResponse
        {
            Id = s.Id,
            AcademicYearId = s.AcademicYearId,
            AcademicYearName = s.AcademicYear?.Name ?? string.Empty,
            Name = s.Name,
            Order = s.Order,
            IsActive = s.IsActive
        };
    }

    public async Task<SemesterResponse> CreateAsync(CreateSemesterRequest request)
    {
        var nameTrim = request.Name.Trim();
        var academicYear = await _context.AcademicYears.FindAsync(request.AcademicYearId);
        if (academicYear == null) throw new ValidationException("Academic Year not found.");

        if (request.IsActive)
        {
            var activeSemesters = await _context.Semesters.Where(s => s.IsActive).ToListAsync();
            foreach (var sem in activeSemesters)
            {
                sem.IsActive = false;
            }
        }

        var semester = new Semester
        {
            Id = Guid.NewGuid(),
            AcademicYearId = request.AcademicYearId,
            Name = nameTrim,
            Order = request.Order,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Semesters.Add(semester);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(semester.Id))!;
    }

    public async Task<SemesterResponse?> UpdateAsync(Guid id, UpdateSemesterRequest request)
    {
        var semester = await _context.Semesters.FindAsync(id);
        if (semester == null) return null;

        var academicYear = await _context.AcademicYears.FindAsync(request.AcademicYearId);
        if (academicYear == null) throw new ValidationException("Academic Year not found.");

        if (request.IsActive && !semester.IsActive)
        {
            var activeSemesters = await _context.Semesters.Where(s => s.IsActive && s.Id != id).ToListAsync();
            foreach (var sem in activeSemesters)
            {
                sem.IsActive = false;
            }
        }

        semester.AcademicYearId = request.AcademicYearId;
        semester.Name = request.Name.Trim();
        semester.Order = request.Order;
        semester.IsActive = request.IsActive;
        semester.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var semester = await _context.Semesters.FindAsync(id);
        if (semester == null) return false;

        _context.Semesters.Remove(semester);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<SemesterResponse?> SetActiveAsync(Guid id)
    {
        var semester = await _context.Semesters.FindAsync(id);
        if (semester == null) return null;

        var allSemesters = await _context.Semesters.ToListAsync();
        foreach (var sem in allSemesters)
        {
            sem.IsActive = (sem.Id == id);
            sem.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }
}
