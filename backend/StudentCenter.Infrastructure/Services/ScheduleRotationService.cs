using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ScheduleRotationService : IScheduleRotationService
{
    private readonly AppDbContext _context;

    public ScheduleRotationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ScheduleRotationConfigResponse?> GetConfigByClassIdAsync(Guid schoolClassId, Guid requestingUserId, string requestingUserRole)
    {
        await VerifyClassReadAuthorizationAsync(schoolClassId, requestingUserId, requestingUserRole);

        var config = await _context.ScheduleRotationConfigs
            .Include(c => c.SchoolClass)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.SchoolClassId == schoolClassId && c.IsActive);

        if (config is null) return null;

        var currentCat = CalculateCategory(config, DateTime.UtcNow);
        return MapResponse(config, currentCat);
    }

    public async Task<ScheduleRotationConfigResponse> SaveConfigAsync(SaveScheduleRotationConfigRequest request, Guid requestingUserId, string requestingUserRole)
    {
        if (request.CycleWeeks <= 0)
            throw new ValidationException("CycleWeeks harus lebih besar dari 0.");

        if (!Enum.IsDefined(typeof(SubjectCategory), request.InitialCategory))
            throw new ValidationException("Kategori rotasi awal tidak valid.");

        var classExists = await _context.SchoolClasses.AnyAsync(c => c.Id == request.SchoolClassId);
        if (!classExists)
            throw new KeyNotFoundException("Kelas target tidak ditemukan.");

        await VerifyClassWriteAuthorizationAsync(request.SchoolClassId, requestingUserId, requestingUserRole);

        var existing = await _context.ScheduleRotationConfigs
            .FirstOrDefaultAsync(c => c.SchoolClassId == request.SchoolClassId && c.IsActive);

        if (existing is null)
        {
            existing = new ScheduleRotationConfig
            {
                Id = Guid.NewGuid(),
                SchoolClassId = request.SchoolClassId,
                AnchorStartDate = DateTime.SpecifyKind(request.AnchorStartDate, DateTimeKind.Utc),
                InitialCategory = request.InitialCategory,
                CycleWeeks = request.CycleWeeks,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            _context.ScheduleRotationConfigs.Add(existing);
        }
        else
        {
            existing.AnchorStartDate = DateTime.SpecifyKind(request.AnchorStartDate, DateTimeKind.Utc);
            existing.InitialCategory = request.InitialCategory;
            existing.CycleWeeks = request.CycleWeeks;
            existing.IsActive = request.IsActive;
        }

        await _context.SaveChangesAsync();

        var saved = await _context.ScheduleRotationConfigs
            .Include(c => c.SchoolClass)
            .AsNoTracking()
            .FirstAsync(c => c.Id == existing.Id);

        var currentCat = CalculateCategory(saved, DateTime.UtcNow);
        return MapResponse(saved, currentCat);
    }

    public async Task<SubjectCategory> GetCurrentCategoryForClassAsync(Guid schoolClassId, DateTime targetDate, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        if (requestingUserId != default)
        {
            await VerifyClassReadAuthorizationAsync(schoolClassId, requestingUserId, requestingUserRole);
        }

        var config = await _context.ScheduleRotationConfigs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.SchoolClassId == schoolClassId && c.IsActive);

        if (config is null)
            return SubjectCategory.MPU; // Default fallback

        return CalculateCategory(config, targetDate);
    }

    private async Task VerifyClassReadAuthorizationAsync(Guid schoolClassId, Guid requestingUserId, string requestingUserRole)
    {
        if (string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase)) return;

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId);
            if (student?.ClassId != schoolClassId)
            {
                throw new UnauthorizedAccessException("Siswa hanya dapat mengakses konfigurasi rotasi kelasnya sendiri.");
            }
            return;
        }

        if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            var teachesClass = await _context.ClassSubjects
                .AsNoTracking()
                .AnyAsync(cs => cs.ClassId == schoolClassId && cs.TeacherSubject != null && cs.TeacherSubject.TeacherId == requestingUserId);

            if (!teachesClass)
            {
                throw new UnauthorizedAccessException("Guru hanya dapat mengakses rotasi kelas yang diampu.");
            }
            return;
        }

        throw new UnauthorizedAccessException("Akses ditolak.");
    }

    private async Task VerifyClassWriteAuthorizationAsync(Guid schoolClassId, Guid requestingUserId, string requestingUserRole)
    {
        if (string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase)) return;

        if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            var teachesClass = await _context.ClassSubjects
                .AsNoTracking()
                .AnyAsync(cs => cs.ClassId == schoolClassId && cs.TeacherSubject != null && cs.TeacherSubject.TeacherId == requestingUserId);

            if (!teachesClass)
            {
                throw new UnauthorizedAccessException("Guru hanya dapat mengonfigurasi rotasi kelas yang diampu.");
            }
            return;
        }

        throw new UnauthorizedAccessException("Siswa tidak memiliki akses mengonfigurasi rotasi jadwal.");
    }

    private static SubjectCategory CalculateCategory(ScheduleRotationConfig config, DateTime targetDate)
    {
        if (targetDate < config.AnchorStartDate)
            return config.InitialCategory;

        var elapsedDays = (targetDate.Date - config.AnchorStartDate.Date).Days;
        var elapsedWeeks = elapsedDays / 7;
        var cycleIndex = (elapsedWeeks / config.CycleWeeks) % 2;

        if (cycleIndex == 0)
            return config.InitialCategory;

        return config.InitialCategory == SubjectCategory.KK
            ? SubjectCategory.MPU
            : SubjectCategory.KK;
    }

    private static ScheduleRotationConfigResponse MapResponse(ScheduleRotationConfig c, SubjectCategory currentCategory) => new()
    {
        Id = c.Id,
        SchoolClassId = c.SchoolClassId,
        ClassName = c.SchoolClass?.Name ?? string.Empty,
        AnchorStartDate = c.AnchorStartDate,
        InitialCategory = c.InitialCategory,
        CycleWeeks = c.CycleWeeks,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt,
        CurrentCategory = currentCategory
    };
}
