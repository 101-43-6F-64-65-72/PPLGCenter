using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class SchoolClassService : ISchoolClassService
{
    private readonly AppDbContext _context;

    public SchoolClassService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SchoolClassResponse>> GetAllAsync(Guid? departmentId = null, Guid? academicYearId = null)
    {
        var query = _context.SchoolClasses
            .AsNoTracking()
            .Include(c => c.Department)
            .Include(c => c.HomeroomTeacher)
            .Include(c => c.AcademicYear)
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(c => c.DepartmentId == departmentId.Value);

        if (academicYearId.HasValue)
            query = query.Where(c => c.AcademicYearId == academicYearId.Value);

        var list = await query.OrderBy(c => c.Grade).ThenBy(c => c.Name).ToListAsync();

        var result = new List<SchoolClassResponse>();
        foreach (var c in list)
        {
            result.Add(new SchoolClassResponse
            {
                Id = c.Id,
                Name = c.Name,
                Grade = c.Grade,
                DepartmentId = c.DepartmentId,
                DepartmentCode = c.Department?.Code ?? string.Empty,
                DepartmentName = c.Department?.Name ?? string.Empty,
                Capacity = c.Capacity,
                HomeroomTeacherId = c.HomeroomTeacherId,
                HomeroomTeacherName = c.HomeroomTeacher?.FullName,
                AcademicYearId = c.AcademicYearId,
                AcademicYearName = c.AcademicYear?.Name ?? string.Empty,
                StudentCount = await _context.Users.CountAsync(u => u.ClassId == c.Id)
            });
        }
        return result;
    }

    public async Task<SchoolClassResponse?> GetByIdAsync(Guid id)
    {
        var c = await _context.SchoolClasses
            .AsNoTracking()
            .Include(cls => cls.Department)
            .Include(cls => cls.HomeroomTeacher)
            .Include(cls => cls.AcademicYear)
            .FirstOrDefaultAsync(cls => cls.Id == id);

        if (c == null) return null;

        return new SchoolClassResponse
        {
            Id = c.Id,
            Name = c.Name,
            Grade = c.Grade,
            DepartmentId = c.DepartmentId,
            DepartmentCode = c.Department?.Code ?? string.Empty,
            DepartmentName = c.Department?.Name ?? string.Empty,
            Capacity = c.Capacity,
            HomeroomTeacherId = c.HomeroomTeacherId,
            HomeroomTeacherName = c.HomeroomTeacher?.FullName,
            AcademicYearId = c.AcademicYearId,
            AcademicYearName = c.AcademicYear?.Name ?? string.Empty,
            StudentCount = await _context.Users.CountAsync(u => u.ClassId == c.Id)
        };
    }

    public async Task<SchoolClassResponse> CreateAsync(CreateSchoolClassRequest request)
    {
        var nameTrim = request.Name.Trim();
        if (await _context.SchoolClasses.AnyAsync(c => c.Name.ToLower() == nameTrim.ToLower() && c.AcademicYearId == request.AcademicYearId))
        {
            throw new ValidationException($"Class '{nameTrim}' already exists for this academic year.");
        }

        var department = await _context.Departments.FindAsync(request.DepartmentId);
        if (department == null) throw new ValidationException("Department not found.");

        var academicYear = await _context.AcademicYears.FindAsync(request.AcademicYearId);
        if (academicYear == null) throw new ValidationException("Academic Year not found.");

        if (request.HomeroomTeacherId.HasValue)
        {
            var teacher = await _context.Users.FindAsync(request.HomeroomTeacherId.Value);
            if (teacher == null) throw new ValidationException("Homeroom Teacher not found.");
        }

        var schoolClass = new SchoolClass
        {
            Id = Guid.NewGuid(),
            Name = nameTrim,
            Grade = request.Grade.Trim(),
            DepartmentId = request.DepartmentId,
            Capacity = request.Capacity > 0 ? request.Capacity : 36,
            HomeroomTeacherId = request.HomeroomTeacherId,
            AcademicYearId = request.AcademicYearId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SchoolClasses.Add(schoolClass);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(schoolClass.Id))!;
    }

    public async Task<SchoolClassResponse?> UpdateAsync(Guid id, UpdateSchoolClassRequest request)
    {
        var schoolClass = await _context.SchoolClasses.FindAsync(id);
        if (schoolClass == null) return null;

        var nameTrim = request.Name.Trim();
        if (await _context.SchoolClasses.AnyAsync(c => c.Name.ToLower() == nameTrim.ToLower() && c.AcademicYearId == request.AcademicYearId && c.Id != id))
        {
            throw new ValidationException($"Class '{nameTrim}' already exists for this academic year.");
        }

        schoolClass.Name = nameTrim;
        schoolClass.Grade = request.Grade.Trim();
        schoolClass.DepartmentId = request.DepartmentId;
        schoolClass.Capacity = request.Capacity;
        schoolClass.HomeroomTeacherId = request.HomeroomTeacherId;
        schoolClass.AcademicYearId = request.AcademicYearId;
        schoolClass.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var schoolClass = await _context.SchoolClasses.FindAsync(id);
        if (schoolClass == null) return false;

        _context.SchoolClasses.Remove(schoolClass);
        await _context.SaveChangesAsync();
        return true;
    }
}
