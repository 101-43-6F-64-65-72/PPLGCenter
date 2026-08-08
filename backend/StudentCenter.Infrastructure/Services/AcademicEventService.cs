using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AcademicEventService : IAcademicEventService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AcademicEventService(AppDbContext context, INotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService ?? new NotificationService(context);
    }

    public async Task<List<AcademicEventResponse>> GetAllAsync(string? targetType = null, Guid? classId = null, bool? isActive = null)
    {
        var query = _context.AcademicEvents
            .AsNoTracking()
            .Include(e => e.TargetClass)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(targetType))
            query = query.Where(e => e.TargetType.ToLower() == targetType.Trim().ToLower());

        if (classId.HasValue)
            query = query.Where(e => e.TargetClassId == classId.Value || e.TargetType.ToLower() == "all");

        if (isActive.HasValue)
            query = query.Where(e => e.IsActive == isActive.Value);

        var list = await query.OrderBy(e => e.StartDate).ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<AcademicEventResponse?> GetByIdAsync(Guid id)
    {
        var e = await _context.AcademicEvents
            .AsNoTracking()
            .Include(ev => ev.TargetClass)
            .FirstOrDefaultAsync(ev => ev.Id == id);

        if (e == null) return null;
        return MapToResponse(e);
    }

    public async Task<AcademicEventResponse> CreateAsync(CreateAcademicEventRequest request)
    {
        ValidateEventTarget(request.TargetType, request.TargetClassId);

        if (request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && request.TargetClassId.HasValue)
        {
            var cls = await _context.SchoolClasses.FindAsync(request.TargetClassId.Value);
            if (cls == null) throw new ValidationException("Target class not found.");
        }

        if (request.StartDate > request.EndDate)
        {
            throw new ValidationException("StartDate must be earlier than or equal to EndDate.");
        }

        var entity = new AcademicEvent
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Type = request.Type.Trim(),
            TargetType = request.TargetType.Trim(),
            TargetClassId = request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) ? request.TargetClassId : null,
            StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AcademicEvents.Add(entity);
        await _context.SaveChangesAsync();

        if (entity.IsActive)
        {
            if (entity.TargetType.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                await _notificationService.BroadcastAsync(
                    $"Agenda Akademik: {entity.Title}",
                    $"Agenda baru '{entity.Title}' ({entity.Type}) dijadwalkan pada {entity.StartDate:dd MMM yyyy}.",
                    NotificationType.AcademicEvent,
                    null,
                    NotificationPriority.Normal,
                    $"/calendar",
                    "calendar",
                    "#3b82f6"
                );
            }
            else if (entity.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && entity.TargetClassId.HasValue)
            {
                var studentsInClass = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.ClassId == entity.TargetClassId.Value && u.Role == UserRole.Student && u.IsActive)
                    .Select(u => u.Id)
                    .ToListAsync();

                if (studentsInClass.Any())
                {
                    await _notificationService.NotifyUsersAsync(
                        studentsInClass,
                        $"Agenda Akademik: {entity.Title}",
                        $"Agenda baru '{entity.Title}' ({entity.Type}) dijadwalkan pada {entity.StartDate:dd MMM yyyy}.",
                        NotificationType.AcademicEvent,
                        NotificationPriority.Normal,
                        entity.Id.ToString(),
                        NotificationReferenceType.AcademicEvent,
                        $"/calendar",
                        "calendar",
                        "#3b82f6"
                    );
                }
            }
        }

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<AcademicEventResponse?> UpdateAsync(Guid id, UpdateAcademicEventRequest request)
    {
        var entity = await _context.AcademicEvents.FindAsync(id);
        if (entity == null) return null;

        ValidateEventTarget(request.TargetType, request.TargetClassId);

        if (request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && request.TargetClassId.HasValue)
        {
            var cls = await _context.SchoolClasses.FindAsync(request.TargetClassId.Value);
            if (cls == null) throw new ValidationException("Target class not found.");
        }

        if (request.StartDate > request.EndDate)
        {
            throw new ValidationException("StartDate must be earlier than or equal to EndDate.");
        }

        entity.Title = request.Title.Trim();
        entity.Description = request.Description?.Trim();
        entity.Type = request.Type.Trim();
        entity.TargetType = request.TargetType.Trim();
        entity.TargetClassId = request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) ? request.TargetClassId : null;
        entity.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
        entity.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await _context.AcademicEvents.FindAsync(id);
        if (entity == null) return false;

        _context.AcademicEvents.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<AcademicEventResponse>> GetUpcomingEventsAsync(int limit = 5)
    {
        var now = DateTime.UtcNow;
        var list = await _context.AcademicEvents
            .AsNoTracking()
            .Include(e => e.TargetClass)
            .Where(e => e.IsActive && e.EndDate >= now.AddDays(-1))
            .OrderBy(e => e.StartDate)
            .Take(limit)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    private static void ValidateEventTarget(string targetType, Guid? targetClassId)
    {
        if (targetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && (!targetClassId.HasValue || targetClassId.Value == Guid.Empty))
        {
            throw new ValidationException("TargetClassId is required when TargetType is 'Class'.");
        }
    }

    private static AcademicEventResponse MapToResponse(AcademicEvent e)
    {
        return new AcademicEventResponse
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            Type = e.Type,
            TargetType = e.TargetType,
            TargetClassId = e.TargetClassId,
            TargetClassName = e.TargetClass?.Name,
            StartDate = e.StartDate,
            EndDate = e.EndDate,
            IsActive = e.IsActive,
            CreatedAt = e.CreatedAt
        };
    }
}
