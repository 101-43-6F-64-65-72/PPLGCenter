using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
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

    public async Task<ClassLeadershipResponse> AppointLeadershipAsync(AppointLeadershipRequest request, Guid appointedByUserId, string requestingUserRole = "Admin")
    {
        // 1. Verify Target Class Existence & Authorization (SEC-04 / SEC-05)
        var targetClass = await _context.SchoolClasses
            .FirstOrDefaultAsync(c => c.Id == request.SchoolClassId);

        if (targetClass is null)
            throw new KeyNotFoundException("Target school class not found.");

        bool isAdmin = string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase);
        bool isWaliKelas = targetClass.HomeroomTeacherId.HasValue && targetClass.HomeroomTeacherId.Value == appointedByUserId;

        if (!isAdmin && !isWaliKelas)
        {
            throw new UnauthorizedAccessException("Only Admin or the assigned Wali Kelas (Homeroom Teacher) of this class can appoint class leadership.");
        }

        // 2. Validate Student Class Enrollment (SEC-03)
        var student = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.ClassLeaderStudentId);

        if (student is null || student.Role != UserRole.Student || student.ClassId != request.SchoolClassId)
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Target class leader student must be an active student enrolled in this class.");
        }

        var teacher = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.HomeroomTeacherId);

        if (teacher is null || teacher.Role != UserRole.Teacher)
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Assigned homeroom teacher must be a valid teacher.");
        }

        // 3. Concurrency Protection & Dual-State Homeroom Synchronization (SEC-10 & SEC-11)
        var now = DateTime.UtcNow;
        Guid createdId = Guid.Empty;
        int retries = 3;

        while (retries > 0)
        {
            try
            {
                using var transaction = _context.Database.IsRelational()
                    ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable)
                    : null;

                // Deactivate existing active leadership for this class & academic year
                var currentActive = await _context.ClassLeadership
                    .FirstOrDefaultAsync(cl => cl.SchoolClassId == request.SchoolClassId 
                                            && cl.AcademicYearId == request.AcademicYearId 
                                            && cl.IsActive);

                if (currentActive is not null)
                {
                    currentActive.IsActive = false;
                    currentActive.EndDate = now;
                }

                // Synchronize dual-state model: Update SchoolClass.HomeroomTeacherId
                targetClass.HomeroomTeacherId = request.HomeroomTeacherId;
                targetClass.UpdatedAt = now;

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

                if (transaction != null)
                    await transaction.CommitAsync();

                createdId = newLeadership.Id;
                break;
            }
            catch (DbUpdateException) when (retries > 1)
            {
                _context.ChangeTracker.Clear();
                retries--;
                await Task.Delay(50);
            }
            catch
            {
                throw;
            }
        }

        var created = await _context.ClassLeadership
            .Include(cl => cl.SchoolClass)
            .Include(cl => cl.HomeroomTeacher)
            .Include(cl => cl.ClassLeaderStudent)
            .Include(cl => cl.AcademicYear)
            .AsNoTracking()
            .FirstAsync(cl => cl.Id == createdId);

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
