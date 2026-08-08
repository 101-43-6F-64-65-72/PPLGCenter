using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AcademicYearService : IAcademicYearService
{
    private readonly AppDbContext _context;

    public AcademicYearService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AcademicYearResponse>> GetAllAsync()
    {
        return await _context.AcademicYears
            .AsNoTracking()
            .OrderByDescending(a => a.StartDate)
            .Select(a => new AcademicYearResponse
            {
                Id = a.Id,
                Name = a.Name,
                StartDate = a.StartDate,
                EndDate = a.EndDate,
                IsActive = a.IsActive
            })
            .ToListAsync();
    }

    public async Task<AcademicYearResponse?> GetByIdAsync(Guid id)
    {
        var a = await _context.AcademicYears.FindAsync(id);
        if (a == null) return null;

        return new AcademicYearResponse
        {
            Id = a.Id,
            Name = a.Name,
            StartDate = a.StartDate,
            EndDate = a.EndDate,
            IsActive = a.IsActive
        };
    }

    public async Task<AcademicYearResponse> CreateAsync(CreateAcademicYearRequest request)
    {
        var nameTrim = request.Name.Trim();
        if (await _context.AcademicYears.AnyAsync(a => a.Name.ToLower() == nameTrim.ToLower()))
        {
            throw new ValidationException($"Academic Year '{nameTrim}' already exists.");
        }

        if (request.IsActive)
        {
            var activeYears = await _context.AcademicYears.Where(a => a.IsActive).ToListAsync();
            foreach (var year in activeYears)
            {
                year.IsActive = false;
            }
        }

        var entity = new AcademicYear
        {
            Id = Guid.NewGuid(),
            Name = nameTrim,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AcademicYears.Add(entity);
        await _context.SaveChangesAsync();

        return new AcademicYearResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            IsActive = entity.IsActive
        };
    }

    public async Task<AcademicYearResponse?> UpdateAsync(Guid id, UpdateAcademicYearRequest request)
    {
        var entity = await _context.AcademicYears.FindAsync(id);
        if (entity == null) return null;

        var nameTrim = request.Name.Trim();
        if (await _context.AcademicYears.AnyAsync(a => a.Name.ToLower() == nameTrim.ToLower() && a.Id != id))
        {
            throw new ValidationException($"Academic Year '{nameTrim}' already exists.");
        }

        if (request.IsActive && !entity.IsActive)
        {
            var activeYears = await _context.AcademicYears.Where(a => a.IsActive && a.Id != id).ToListAsync();
            foreach (var year in activeYears)
            {
                year.IsActive = false;
            }
        }

        entity.Name = nameTrim;
        entity.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
        entity.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AcademicYearResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            IsActive = entity.IsActive
        };
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _context.AcademicYears.FindAsync(id);
        if (entity == null) return false;

        _context.AcademicYears.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AcademicYearResponse?> SetActiveAsync(Guid id)
    {
        var entity = await _context.AcademicYears.FindAsync(id);
        if (entity == null) return null;

        var allYears = await _context.AcademicYears.ToListAsync();
        foreach (var year in allYears)
        {
            year.IsActive = (year.Id == id);
            year.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return new AcademicYearResponse
        {
            Id = entity.Id,
            Name = entity.Name,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate,
            IsActive = true
        };
    }
}
