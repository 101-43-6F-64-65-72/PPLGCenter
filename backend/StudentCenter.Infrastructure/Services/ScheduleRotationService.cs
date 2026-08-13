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

    public async Task<ScheduleRotationConfigResponse?> GetConfigByClassIdAsync(Guid schoolClassId)
    {
        var config = await _context.ScheduleRotationConfigs
            .Include(c => c.SchoolClass)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.SchoolClassId == schoolClassId && c.IsActive);

        if (config is null) return null;

        var currentCat = CalculateCategory(config, DateTime.UtcNow);
        return MapResponse(config, currentCat);
    }

    public async Task<ScheduleRotationConfigResponse> SaveConfigAsync(SaveScheduleRotationConfigRequest request)
    {
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
                CycleWeeks = request.CycleWeeks > 0 ? request.CycleWeeks : 2,
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            _context.ScheduleRotationConfigs.Add(existing);
        }
        else
        {
            existing.AnchorStartDate = DateTime.SpecifyKind(request.AnchorStartDate, DateTimeKind.Utc);
            existing.InitialCategory = request.InitialCategory;
            existing.CycleWeeks = request.CycleWeeks > 0 ? request.CycleWeeks : 2;
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

    public async Task<SubjectCategory> GetCurrentCategoryForClassAsync(Guid schoolClassId, DateTime targetDate)
    {
        var config = await _context.ScheduleRotationConfigs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.SchoolClassId == schoolClassId && c.IsActive);

        if (config is null)
            return SubjectCategory.MPU; // Default fallback

        return CalculateCategory(config, targetDate);
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
