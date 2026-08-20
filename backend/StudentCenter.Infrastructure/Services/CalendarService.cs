using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class CalendarService : ICalendarService
{
    private readonly AppDbContext _context;

    public CalendarService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CalendarEventResponse>> GetEventsAsync(int page, int pageSize, string? category, string? userRole = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<CalendarEvent>().AsNoTracking();

        // Apply SQL-level visibility filter
        query = ApplyVisibilityFilter(query, userRole);

        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCategory = category.Trim();
            query = query.Where(c => c.Category == trimmedCategory || c.Category.StartsWith(trimmedCategory + "|Visibility:"));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.CreatedByUser)
            .ToListAsync();

        return new PagedResult<CalendarEventResponse>
        {
            Items = items.Select(MapToResponse).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<List<CalendarEventResponse>> GetUpcomingEventsAsync(int count, string? userRole = null)
    {
        if (count < 1) count = 5;
        if (count > 50) count = 50;

        var now = DateTime.UtcNow;

        var query = _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.StartDate >= now);

        query = ApplyVisibilityFilter(query, userRole);

        var list = await query
            .OrderBy(c => c.StartDate)
            .Take(count)
            .Include(c => c.CreatedByUser)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<List<CalendarEventResponse>> GetMonthlyEventsAsync(int year, int month, string? userRole = null)
    {
        var startOfMonth = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var query = _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.StartDate <= endOfMonth && c.EndDate >= startOfMonth);

        query = ApplyVisibilityFilter(query, userRole);

        var list = await query
            .OrderBy(c => c.StartDate)
            .Include(c => c.CreatedByUser)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<List<CalendarEventResponse>> GetDailyEventsAsync(DateTime date, string? userRole = null)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

        var query = _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.StartDate <= endOfDay && c.EndDate >= startOfDay);

        query = ApplyVisibilityFilter(query, userRole);

        var list = await query
            .OrderBy(c => c.StartDate)
            .Include(c => c.CreatedByUser)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<CalendarEventResponse?> GetEventByIdAsync(Guid id, string? userRole = null)
    {
        var calendarEvent = await _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (calendarEvent is null) return null;

        var vis = GetVisibility(calendarEvent);

        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(vis, "Public", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Student is not authorized to view non-public calendar events.");
        }

        if (string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(vis, "AdminOnly", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Teacher is not authorized to view admin-only calendar events.");
        }

        return MapToResponse(calendarEvent);
    }

    public async Task<CalendarEventResponse> CreateEventAsync(CreateCalendarEventRequest request, Guid userId, string? userRole = null)
    {
        var resolvedRole = userRole;
        if (string.IsNullOrWhiteSpace(resolvedRole))
        {
            var user = await _context.Set<User>().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            resolvedRole = user?.Role.ToString() ?? "Student";
        }

        if (string.Equals(resolvedRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not authorized to create calendar events.");
        }

        var visibility = request.Visibility ?? "Public";
        if (string.Equals(resolvedRole, "Teacher", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(visibility, "AdminOnly", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Teachers cannot create AdminOnly calendar events.");
        }

        var startDate = request.StartDate != default ? request.StartDate : request.EventDate;
        var endDate = request.EndDate != default ? request.EndDate : startDate;

        ValidateCalendarEventRequest(request.Title, startDate, endDate);

        var rawCategory = request.Category ?? "Academic";
        var storedCategory = visibility.Equals("Public", StringComparison.OrdinalIgnoreCase)
            ? rawCategory
            : $"{rawCategory}|Visibility:{visibility}";

        var calendarEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc),
            EndDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Location = request.Location?.Trim(),
            Category = storedCategory,
            Color = request.Color,
            Visibility = visibility,
            IsAllDay = request.IsAllDay,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<CalendarEvent>().Add(calendarEvent);
        await _context.SaveChangesAsync();

        var creator = await _context.Set<User>().FindAsync(userId);
        var response = MapToResponse(calendarEvent);
        response.CreatedByUserName = creator?.FullName ?? string.Empty;
        return response;
    }

    public async Task<CalendarEventResponse?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request, Guid userId, string userRole)
    {
        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not authorized to update calendar events.");
        }

        var calendarEvent = await _context.Set<CalendarEvent>()
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (calendarEvent is null)
            return null;

        var existingVis = GetVisibility(calendarEvent);

        if (string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(existingVis, "AdminOnly", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Teachers cannot update AdminOnly calendar events.");
            }

            var requestedVis = request.Visibility ?? "Public";
            if (string.Equals(requestedVis, "AdminOnly", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Teachers cannot set event visibility to AdminOnly.");
            }

            if (calendarEvent.CreatedByUserId != userId)
            {
                throw new UnauthorizedAccessException("You can only update your own calendar events.");
            }
        }

        var startDate = request.StartDate != default ? request.StartDate : request.EventDate;
        var endDate = request.EndDate != default ? request.EndDate : startDate;

        ValidateCalendarEventRequest(request.Title, startDate, endDate);

        var visibility = request.Visibility ?? "Public";
        var rawCategory = request.Category ?? "Academic";
        var storedCategory = visibility.Equals("Public", StringComparison.OrdinalIgnoreCase)
            ? rawCategory
            : $"{rawCategory}|Visibility:{visibility}";

        calendarEvent.Title = request.Title.Trim();
        calendarEvent.Description = request.Description?.Trim();
        calendarEvent.StartDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        calendarEvent.EndDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);
        calendarEvent.StartTime = request.StartTime;
        calendarEvent.EndTime = request.EndTime;
        calendarEvent.Location = request.Location?.Trim();
        calendarEvent.Category = storedCategory;
        calendarEvent.Color = request.Color;
        calendarEvent.Visibility = visibility;
        calendarEvent.IsAllDay = request.IsAllDay;
        calendarEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(calendarEvent);
    }

    public async Task<bool> DeleteEventAsync(Guid id, Guid userId, string userRole)
    {
        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not authorized to delete calendar events.");
        }

        var calendarEvent = await _context.Set<CalendarEvent>()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (calendarEvent is null)
            return false;

        var existingVis = GetVisibility(calendarEvent);

        if (string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(existingVis, "AdminOnly", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Teachers cannot delete AdminOnly calendar events.");
            }

            if (calendarEvent.CreatedByUserId != userId)
            {
                throw new UnauthorizedAccessException("You can only delete your own calendar events.");
            }
        }

        _context.Set<CalendarEvent>().Remove(calendarEvent);
        await _context.SaveChangesAsync();

        return true;
    }

    private static IQueryable<CalendarEvent> ApplyVisibilityFilter(IQueryable<CalendarEvent> query, string? userRole)
    {
        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(c =>
                !c.Category.Contains("|Visibility:TeacherOnly") &&
                !c.Category.Contains("|Visibility:AdminOnly"));
        }

        if (string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(c =>
                !c.Category.Contains("|Visibility:AdminOnly"));
        }

        return query;
    }

    private static string GetVisibility(CalendarEvent c)
    {
        if (!string.IsNullOrEmpty(c.Category) && c.Category.Contains("|Visibility:"))
        {
            return c.Category.Split("|Visibility:")[1];
        }
        return c.Visibility ?? "Public";
    }

    private static void ValidateCalendarEventRequest(string title, DateTime startDate, DateTime endDate)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ValidationException("Title is required and cannot be empty.");
        }

        if (startDate > endDate)
        {
            throw new ValidationException("StartDate must be earlier than or equal to EndDate.");
        }
    }

    private static CalendarEventResponse MapToResponse(CalendarEvent c)
    {
        var category = c.Category ?? "Academic";
        var visibility = GetVisibility(c);
        if (category.Contains("|Visibility:"))
        {
            category = category.Split("|Visibility:")[0];
        }

        return new CalendarEventResponse
        {
            Id = c.Id,
            Title = c.Title,
            Description = c.Description,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            EventDate = c.EventDate,
            StartTime = c.StartTime,
            EndTime = c.EndTime,
            Location = c.Location,
            Category = category,
            Color = c.Color,
            Visibility = visibility,
            IsAllDay = c.IsAllDay,
            CreatedByUserId = c.CreatedByUserId,
            CreatedByUserName = c.CreatedByUser?.FullName ?? string.Empty,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}
