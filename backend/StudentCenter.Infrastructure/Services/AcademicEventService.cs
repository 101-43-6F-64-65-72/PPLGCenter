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

    public async Task<List<AcademicEventResponse>> GetAllAsync(
        Guid requestingUserId = default,
        string requestingUserRole = "Admin",
        string? targetType = null,
        Guid? classId = null,
        bool? isActive = null)
    {
        var query = _context.AcademicEvents
            .AsNoTracking()
            .Include(e => e.TargetClass)
            .AsQueryable();

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId);
            var studentClassId = student?.ClassId;

            if (studentClassId.HasValue)
            {
                query = query.Where(e => e.TargetType.ToLower() == "all" ||
                                         (e.TargetType.ToLower() == "class" && e.TargetClassId == studentClassId.Value));
            }
            else
            {
                query = query.Where(e => e.TargetType.ToLower() == "all");
            }

            if (classId.HasValue && classId.Value != studentClassId)
            {
                // If student requests an explicit classId parameter outside their own class scope, return empty
                return new List<AcademicEventResponse>();
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(targetType))
                query = query.Where(e => e.TargetType.ToLower() == targetType.Trim().ToLower());

            if (classId.HasValue)
                query = query.Where(e => e.TargetClassId == classId.Value || e.TargetType.ToLower() == "all");
        }

        if (isActive.HasValue)
            query = query.Where(e => e.IsActive == isActive.Value);

        var list = await query.OrderBy(e => e.StartDate).ToListAsync();
        return list.Select(MapToResponse).ToList();
    }

    public async Task<AcademicEventResponse?> GetByIdAsync(Guid id, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        var e = await _context.AcademicEvents
            .AsNoTracking()
            .Include(ev => ev.TargetClass)
            .FirstOrDefaultAsync(ev => ev.Id == id);

        if (e == null) return null;

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId);
            var studentClassId = student?.ClassId;

            var isAll = string.Equals(e.TargetType, "All", StringComparison.OrdinalIgnoreCase);
            var isOwnClass = string.Equals(e.TargetType, "Class", StringComparison.OrdinalIgnoreCase) &&
                             studentClassId.HasValue && e.TargetClassId == studentClassId.Value;

            if (!isAll && !isOwnClass)
            {
                throw new UnauthorizedAccessException("Student is not authorized to access academic events outside their class scope.");
            }
        }
        else if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(e.TargetType, "Class", StringComparison.OrdinalIgnoreCase) && e.TargetClassId.HasValue)
            {
                await ValidateTeacherClassAssignmentAsync(requestingUserId, e.TargetClassId.Value);
            }
        }

        return MapToResponse(e);
    }

    public async Task<AcademicEventResponse> CreateAsync(CreateAcademicEventRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Students are not authorized to create academic events.");

        if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (!request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Teachers can only create academic events targeted to classes they teach or manage.");
            }
        }

        ValidateAcademicEventRequest(request.Title, request.TargetType, request.TargetClassId, request.StartDate, request.EndDate);

        if (request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && request.TargetClassId.HasValue)
        {
            var cls = await _context.SchoolClasses.FindAsync(request.TargetClassId.Value);
            if (cls == null) throw new ValidationException("Target class not found.");

            if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                await ValidateTeacherClassAssignmentAsync(requestingUserId, request.TargetClassId.Value);
            }
        }

        var entity = new AcademicEvent
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Type = request.Type?.Trim() ?? "School",
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

        var saved = await _context.AcademicEvents.AsNoTracking().Include(e => e.TargetClass).FirstOrDefaultAsync(e => e.Id == entity.Id);
        return MapToResponse(saved ?? entity);
    }

    public async Task<AcademicEventResponse?> UpdateAsync(Guid id, UpdateAcademicEventRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Students are not authorized to update academic events.");

        var entity = await _context.AcademicEvents.FindAsync(id);
        if (entity == null) return null;

        if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (!request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Teachers can only manage academic events targeted to classes they teach or manage.");
            }

            if (entity.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && entity.TargetClassId.HasValue)
            {
                await ValidateTeacherClassAssignmentAsync(requestingUserId, entity.TargetClassId.Value);
            }

            if (request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && request.TargetClassId.HasValue)
            {
                await ValidateTeacherClassAssignmentAsync(requestingUserId, request.TargetClassId.Value);
            }
        }

        ValidateAcademicEventRequest(request.Title, request.TargetType, request.TargetClassId, request.StartDate, request.EndDate);

        if (request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && request.TargetClassId.HasValue)
        {
            var cls = await _context.SchoolClasses.FindAsync(request.TargetClassId.Value);
            if (cls == null) throw new ValidationException("Target class not found.");
        }

        entity.Title = request.Title.Trim();
        entity.Description = request.Description?.Trim();
        entity.Type = request.Type?.Trim() ?? "School";
        entity.TargetType = request.TargetType.Trim();
        entity.TargetClassId = request.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) ? request.TargetClassId : null;
        entity.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
        entity.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        var saved = await _context.AcademicEvents.AsNoTracking().Include(e => e.TargetClass).FirstOrDefaultAsync(e => e.Id == id);
        return MapToResponse(saved ?? entity);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("Students are not authorized to delete academic events.");

        var entity = await _context.AcademicEvents.FindAsync(id);
        if (entity == null) return false;

        if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (!entity.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Teachers can only delete academic events targeted to classes they teach or manage.");
            }

            if (entity.TargetType.Equals("Class", StringComparison.OrdinalIgnoreCase) && entity.TargetClassId.HasValue)
            {
                await ValidateTeacherClassAssignmentAsync(requestingUserId, entity.TargetClassId.Value);
            }
        }

        _context.AcademicEvents.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<AcademicEventResponse>> GetUpcomingEventsAsync(int limit = 5, Guid requestingUserId = default, string requestingUserRole = "Student")
    {
        var now = DateTime.UtcNow;
        var query = _context.AcademicEvents
            .AsNoTracking()
            .Include(e => e.TargetClass)
            .Where(e => e.IsActive && e.EndDate >= now.AddDays(-1));

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId);
            var studentClassId = student?.ClassId;

            if (studentClassId.HasValue)
            {
                query = query.Where(e => e.TargetType.ToLower() == "all" ||
                                         (e.TargetType.ToLower() == "class" && e.TargetClassId == studentClassId.Value));
            }
            else
            {
                query = query.Where(e => e.TargetType.ToLower() == "all");
            }
        }

        var list = await query
            .OrderBy(e => e.StartDate)
            .Take(limit)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    private async Task ValidateTeacherClassAssignmentAsync(Guid teacherId, Guid classId)
    {
        var isHomeroom = await _context.SchoolClasses.AsNoTracking()
            .AnyAsync(c => c.Id == classId && c.HomeroomTeacherId == teacherId);

        if (isHomeroom) return;

        var isSubjectTeacher = await _context.ClassSubjects.AsNoTracking()
            .AnyAsync(cs => cs.ClassId == classId && cs.TeacherSubject.TeacherId == teacherId);

        if (isSubjectTeacher) return;

        throw new UnauthorizedAccessException("Teacher is not authorized to target a class they do not teach or manage.");
    }

    private static void ValidateAcademicEventRequest(string title, string targetType, Guid? targetClassId, DateTime startDate, DateTime endDate)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ValidationException("Title is required and cannot be empty.");
        }

        if (startDate > endDate)
        {
            throw new ValidationException("StartDate must be earlier than or equal to EndDate.");
        }

        var validTargets = new[] { "all", "teacher", "student", "class" };
        if (string.IsNullOrWhiteSpace(targetType) || !validTargets.Contains(targetType.Trim().ToLower()))
        {
            throw new ValidationException("Invalid TargetType. Must be All, Teacher, Student, or Class.");
        }

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
