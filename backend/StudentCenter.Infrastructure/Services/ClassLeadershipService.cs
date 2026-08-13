using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ClassLeadershipService : IClassLeadershipService
{
    private readonly AppDbContext _context;

    public ClassLeadershipService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ClassLeadershipResponse?> GetActiveLeadershipAsync(Guid schoolClassId)
    {
        var active = await _context.ClassLeadership
            .Include(cl => cl.SchoolClass)
            .Include(cl => cl.HomeroomTeacher)
            .Include(cl => cl.ClassLeaderStudent)
            .Include(cl => cl.AcademicYear)
            .AsNoTracking()
            .FirstOrDefaultAsync(cl => cl.SchoolClassId == schoolClassId && cl.IsActive);

        return active is null ? null : MapResponse(active);
    }

    public async Task<List<ClassLeadershipResponse>> GetLeadershipHistoryAsync(Guid schoolClassId)
    {
        var history = await _context.ClassLeadership
            .Include(cl => cl.SchoolClass)
            .Include(cl => cl.HomeroomTeacher)
            .Include(cl => cl.ClassLeaderStudent)
            .Include(cl => cl.AcademicYear)
            .AsNoTracking()
            .Where(cl => cl.SchoolClassId == schoolClassId)
            .OrderByDescending(cl => cl.EffectiveDate)
            .ToListAsync();

        return history.Select(MapResponse).ToList();
    }

    public async Task<ClassLeadershipResponse> AppointLeadershipAsync(AppointLeadershipRequest request, Guid appointedByUserId)
    {
        var now = DateTime.UtcNow;

        using var transaction = await _context.Database.BeginTransactionAsync();

        // 1. Deactivate existing active leadership for this class & academic year
        var currentActive = await _context.ClassLeadership
            .FirstOrDefaultAsync(cl => cl.SchoolClassId == request.SchoolClassId 
                                    && cl.AcademicYearId == request.AcademicYearId 
                                    && cl.IsActive);

        if (currentActive is not null)
        {
            currentActive.IsActive = false;
            currentActive.EndDate = now;
        }

        // 2. Create new active appointment record
        var newLeadership = new ClassLeadership
        {
            Id = Guid.NewGuid(),
            SchoolClassId = request.SchoolClassId,
            HomeroomTeacherId = request.HomeroomTeacherId,
            ClassLeaderStudentId = request.ClassLeaderStudentId,
            AcademicYearId = request.AcademicYearId,
            AppointedByUserId = appointedByUserId,
            AppointedAt = now,
            IsActive = true,
            EffectiveDate = now,
            EndDate = null
        };

        _context.ClassLeadership.Add(newLeadership);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        var created = await _context.ClassLeadership
            .Include(cl => cl.SchoolClass)
            .Include(cl => cl.HomeroomTeacher)
            .Include(cl => cl.ClassLeaderStudent)
            .Include(cl => cl.AcademicYear)
            .AsNoTracking()
            .FirstAsync(cl => cl.Id == newLeadership.Id);

        return MapResponse(created);
    }

    private static ClassLeadershipResponse MapResponse(ClassLeadership cl) => new()
    {
        Id = cl.Id,
        SchoolClassId = cl.SchoolClassId,
        ClassName = cl.SchoolClass?.Name ?? string.Empty,
        HomeroomTeacherId = cl.HomeroomTeacherId,
        HomeroomTeacherName = cl.HomeroomTeacher?.FullName ?? cl.HomeroomTeacher?.Username ?? string.Empty,
        ClassLeaderStudentId = cl.ClassLeaderStudentId,
        ClassLeaderStudentName = cl.ClassLeaderStudent?.FullName ?? cl.ClassLeaderStudent?.Username ?? string.Empty,
        AcademicYearId = cl.AcademicYearId,
        AcademicYearName = cl.AcademicYear?.Name ?? string.Empty,
        AppointedByUserId = cl.AppointedByUserId,
        AppointedAt = cl.AppointedAt,
        IsActive = cl.IsActive,
        EffectiveDate = cl.EffectiveDate,
        EndDate = cl.EndDate
    };
}
