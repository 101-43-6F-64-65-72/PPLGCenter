using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;

    public DepartmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DepartmentResponse>> GetAllAsync()
    {
        return await _context.Departments
            .AsNoTracking()
            .OrderBy(d => d.Code)
            .Select(d => new DepartmentResponse
            {
                Id = d.Id,
                Code = d.Code,
                Name = d.Name,
                TotalClasses = d.Classes.Count,
                TotalStudents = d.Classes.SelectMany(c => c.Students).Count()
            })
            .ToListAsync();
    }

    public async Task<DepartmentResponse?> GetByIdAsync(Guid id)
    {
        var d = await _context.Departments
            .AsNoTracking()
            .Include(dep => dep.Classes)
                .ThenInclude(c => c.Students)
            .FirstOrDefaultAsync(dep => dep.Id == id);

        if (d == null) return null;

        return new DepartmentResponse
        {
            Id = d.Id,
            Code = d.Code,
            Name = d.Name,
            TotalClasses = d.Classes.Count,
            TotalStudents = d.Classes.SelectMany(c => c.Students).Count()
        };
    }

    public async Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request)
    {
        var codeUpper = request.Code.Trim().ToUpper();
        if (await _context.Departments.AnyAsync(d => d.Code.ToUpper() == codeUpper))
        {
            throw new ValidationException($"Department code '{codeUpper}' already exists.");
        }

        var department = new Department
        {
            Id = Guid.NewGuid(),
            Code = codeUpper,
            Name = request.Name.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        return new DepartmentResponse
        {
            Id = department.Id,
            Code = department.Code,
            Name = department.Name,
            TotalClasses = 0,
            TotalStudents = 0
        };
    }

    public async Task<DepartmentResponse?> UpdateAsync(Guid id, UpdateDepartmentRequest request)
    {
        var department = await _context.Departments.FindAsync(id);
        if (department == null) return null;

        var codeUpper = request.Code.Trim().ToUpper();
        if (await _context.Departments.AnyAsync(d => d.Code.ToUpper() == codeUpper && d.Id != id))
        {
            throw new ValidationException($"Department code '{codeUpper}' already exists.");
        }

        department.Code = codeUpper;
        department.Name = request.Name.Trim();
        department.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var totalClasses = await _context.SchoolClasses.CountAsync(c => c.DepartmentId == id);
        var totalStudents = await _context.Users.CountAsync(u => u.Class != null && u.Class.DepartmentId == id);

        return new DepartmentResponse
        {
            Id = department.Id,
            Code = department.Code,
            Name = department.Name,
            TotalClasses = totalClasses,
            TotalStudents = totalStudents
        };
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var department = await _context.Departments.FindAsync(id);
        if (department == null) return false;

        var hasClasses = await _context.SchoolClasses.AnyAsync(c => c.DepartmentId == id);
        if (hasClasses)
        {
            throw new ValidationException("Jurusan tidak dapat dihapus karena masih memiliki kelas terdaftar. Hapus atau pindahkan kelas terlebih dahulu.");
        }

        _context.Departments.Remove(department);
        await _context.SaveChangesAsync();
        return true;
    }
}
