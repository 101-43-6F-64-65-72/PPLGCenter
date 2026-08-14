using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ClassSubjectService : IClassSubjectService
{
    private readonly AppDbContext _context;

    public ClassSubjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ClassSubjectResponse>> GetAllAsync(Guid? classId = null, Guid? teacherId = null, Guid? subjectId = null)
    {
        var query = _context.ClassSubjects
            .AsNoTracking()
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Department)
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Teacher)
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Subject)
            .AsQueryable();

        if (classId.HasValue)
            query = query.Where(cs => cs.ClassId == classId.Value);

        if (teacherId.HasValue)
            query = query.Where(cs => cs.TeacherSubject.TeacherId == teacherId.Value);

        if (subjectId.HasValue)
            query = query.Where(cs => cs.TeacherSubject.SubjectId == subjectId.Value);

        var list = await query.OrderBy(cs => cs.Class.Name).ThenBy(cs => cs.TeacherSubject.Subject.Name).ToListAsync();

        return list.Select(cs => new ClassSubjectResponse
        {
            Id = cs.Id,
            ClassId = cs.ClassId,
            ClassName = cs.Class?.Name ?? string.Empty,
            DepartmentCode = cs.Class?.Department?.Code ?? string.Empty,
            TeacherSubjectId = cs.TeacherSubjectId,
            TeacherId = cs.TeacherSubject?.TeacherId ?? Guid.Empty,
            TeacherName = cs.TeacherSubject?.Teacher?.FullName ?? string.Empty,
            SubjectId = cs.TeacherSubject?.SubjectId ?? Guid.Empty,
            SubjectCode = cs.TeacherSubject?.Subject?.Code ?? string.Empty,
            SubjectName = cs.TeacherSubject?.Subject?.Name ?? string.Empty,
            CreatedAt = cs.CreatedAt
        }).ToList();
    }

    public async Task<ClassSubjectResponse?> GetByIdAsync(Guid id)
    {
        var cs = await _context.ClassSubjects
            .AsNoTracking()
            .Include(c => c.Class)
                .ThenInclude(cl => cl.Department)
            .Include(c => c.TeacherSubject)
                .ThenInclude(ts => ts.Teacher)
            .Include(c => c.TeacherSubject)
                .ThenInclude(ts => ts.Subject)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cs == null) return null;

        return new ClassSubjectResponse
        {
            Id = cs.Id,
            ClassId = cs.ClassId,
            ClassName = cs.Class?.Name ?? string.Empty,
            DepartmentCode = cs.Class?.Department?.Code ?? string.Empty,
            TeacherSubjectId = cs.TeacherSubjectId,
            TeacherId = cs.TeacherSubject?.TeacherId ?? Guid.Empty,
            TeacherName = cs.TeacherSubject?.Teacher?.FullName ?? string.Empty,
            SubjectId = cs.TeacherSubject?.SubjectId ?? Guid.Empty,
            SubjectCode = cs.TeacherSubject?.Subject?.Code ?? string.Empty,
            SubjectName = cs.TeacherSubject?.Subject?.Name ?? string.Empty,
            CreatedAt = cs.CreatedAt
        };
    }

    public async Task<ClassSubjectResponse> CreateAsync(CreateClassSubjectRequest request)
    {
        var schoolClass = await _context.SchoolClasses.FindAsync(request.ClassId);
        if (schoolClass == null) throw new ValidationException("Class not found.");

        var ts = await _context.TeacherSubjects
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .FirstOrDefaultAsync(t => t.Id == request.TeacherSubjectId);
        if (ts == null) throw new ValidationException("TeacherSubject assignment not found.");

        if (await _context.ClassSubjects.AnyAsync(cs => cs.ClassId == request.ClassId && cs.TeacherSubjectId == request.TeacherSubjectId))
        {
            throw new ValidationException($"Class '{schoolClass.Name}' is already assigned to teacher subject '{ts.Subject?.Name} ({ts.Teacher?.FullName})'.");
        }

        var cs = new ClassSubject
        {
            Id = Guid.NewGuid(),
            ClassId = request.ClassId,
            TeacherSubjectId = request.TeacherSubjectId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ClassSubjects.Add(cs);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(cs.Id))!;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var cs = await _context.ClassSubjects.FindAsync(id);
        if (cs == null) return false;

        _context.ClassSubjects.Remove(cs);
        await _context.SaveChangesAsync();
        return true;
    }
}
