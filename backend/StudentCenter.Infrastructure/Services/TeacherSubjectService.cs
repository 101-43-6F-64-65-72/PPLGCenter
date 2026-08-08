using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class TeacherSubjectService : ITeacherSubjectService
{
    private readonly AppDbContext _context;

    public TeacherSubjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeacherSubjectResponse>> GetAllAsync(Guid? teacherId = null, Guid? subjectId = null)
    {
        var query = _context.TeacherSubjects
            .AsNoTracking()
            .Include(ts => ts.Teacher)
            .Include(ts => ts.Subject)
            .AsQueryable();

        if (teacherId.HasValue)
            query = query.Where(ts => ts.TeacherId == teacherId.Value);

        if (subjectId.HasValue)
            query = query.Where(ts => ts.SubjectId == subjectId.Value);

        var list = await query.OrderBy(ts => ts.Subject.Name).ThenBy(ts => ts.Teacher.FullName).ToListAsync();

        return list.Select(ts => new TeacherSubjectResponse
        {
            Id = ts.Id,
            TeacherId = ts.TeacherId,
            TeacherName = ts.Teacher?.FullName ?? string.Empty,
            TeacherNip = ts.Teacher?.NIP ?? string.Empty,
            SubjectId = ts.SubjectId,
            SubjectCode = ts.Subject?.Code ?? string.Empty,
            SubjectName = ts.Subject?.Name ?? string.Empty,
            CreatedAt = ts.CreatedAt
        }).ToList();
    }

    public async Task<TeacherSubjectResponse?> GetByIdAsync(Guid id)
    {
        var ts = await _context.TeacherSubjects
            .AsNoTracking()
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ts == null) return null;

        return new TeacherSubjectResponse
        {
            Id = ts.Id,
            TeacherId = ts.TeacherId,
            TeacherName = ts.Teacher?.FullName ?? string.Empty,
            TeacherNip = ts.Teacher?.NIP ?? string.Empty,
            SubjectId = ts.SubjectId,
            SubjectCode = ts.Subject?.Code ?? string.Empty,
            SubjectName = ts.Subject?.Name ?? string.Empty,
            CreatedAt = ts.CreatedAt
        };
    }

    public async Task<TeacherSubjectResponse> CreateAsync(CreateTeacherSubjectRequest request)
    {
        var teacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.TeacherId && u.Role == UserRole.Teacher);
        if (teacher == null) throw new ValidationException("Teacher not found.");

        var subject = await _context.Subjects.FindAsync(request.SubjectId);
        if (subject == null) throw new ValidationException("Subject not found.");

        if (await _context.TeacherSubjects.AnyAsync(ts => ts.TeacherId == request.TeacherId && ts.SubjectId == request.SubjectId))
        {
            throw new ValidationException($"Teacher '{teacher.FullName}' is already assigned to subject '{subject.Name}'.");
        }

        var ts = new TeacherSubject
        {
            Id = Guid.NewGuid(),
            TeacherId = request.TeacherId,
            SubjectId = request.SubjectId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.TeacherSubjects.Add(ts);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(ts.Id))!;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var ts = await _context.TeacherSubjects.FindAsync(id);
        if (ts == null) return false;

        _context.TeacherSubjects.Remove(ts);
        await _context.SaveChangesAsync();
        return true;
    }
}
