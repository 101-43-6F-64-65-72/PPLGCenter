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

    public async Task<PagedResult<CalendarEventResponse>> GetEventsAsync(int page, int pageSize, string? category)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category == category);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => MapToResponse(c))
            .ToListAsync();

        return new PagedResult<CalendarEventResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<List<CalendarEventResponse>> GetUpcomingEventsAsync(int count)
    {
        if (count < 1) count = 5;
        if (count > 50) count = 50;

        var now = DateTime.UtcNow;

        return await _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.DeletedAt == null && c.StartDate >= now)
            .OrderBy(c => c.StartDate)
            .Take(count)
            .Select(c => MapToResponse(c))
            .ToListAsync();
    }

    public async Task<List<CalendarEventResponse>> GetMonthlyEventsAsync(int year, int month, string? userRole = null)
    {
        var startOfMonth = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

        var query = _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.DeletedAt == null && c.StartDate <= endOfMonth && c.EndDate >= startOfMonth);

        if (userRole == "Student")
        {
            query = query.Where(c => c.Visibility == "Public");
        }
        else if (userRole == "Teacher")
        {
            query = query.Where(c => c.Visibility == "Public" || c.Visibility == "TeacherOnly");
        }

        return await query
            .OrderBy(c => c.StartDate)
            .Select(c => MapToResponse(c))
            .ToListAsync();
    }

    public async Task<List<CalendarEventResponse>> GetDailyEventsAsync(DateTime date, string? userRole = null)
    {
        var startOfDay = date.Date;
        var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

        var query = _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.DeletedAt == null && c.StartDate <= endOfDay && c.EndDate >= startOfDay);

        if (userRole == "Student")
        {
            query = query.Where(c => c.Visibility == "Public");
        }
        else if (userRole == "Teacher")
        {
            query = query.Where(c => c.Visibility == "Public" || c.Visibility == "TeacherOnly");
        }

        return await query
            .OrderBy(c => c.StartDate)
            .Select(c => MapToResponse(c))
            .ToListAsync();
    }

    public async Task<CalendarEventResponse?> GetEventByIdAsync(Guid id)
    {
        var calendarEvent = await _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

        if (calendarEvent is null) return null;

        return MapToResponse(calendarEvent);
    }

    public async Task<CalendarEventResponse> CreateEventAsync(CreateCalendarEventRequest request, Guid userId)
    {
        var calendarEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDate = request.StartDate != default ? request.StartDate : request.EventDate,
            EndDate = request.EndDate != default ? request.EndDate : request.StartDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Location = request.Location?.Trim(),
            Category = request.Category ?? "Academic",
            Color = request.Color,
            Visibility = request.Visibility ?? "Public",
            IsAllDay = request.IsAllDay,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<CalendarEvent>().Add(calendarEvent);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);
        var response = MapToResponse(calendarEvent);
        response.CreatedByUserName = user?.FullName ?? string.Empty;
        return response;
    }

    public async Task<CalendarEventResponse?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request, Guid userId, string userRole)
    {
        var calendarEvent = await _context.Set<CalendarEvent>()
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

        if (calendarEvent is null)
            return null;

        if (userRole != "Admin" && calendarEvent.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update your own calendar events.");

        calendarEvent.Title = request.Title.Trim();
        calendarEvent.Description = request.Description?.Trim();
        calendarEvent.StartDate = request.StartDate != default ? request.StartDate : request.EventDate;
        calendarEvent.EndDate = request.EndDate != default ? request.EndDate : request.StartDate;
        calendarEvent.StartTime = request.StartTime;
        calendarEvent.EndTime = request.EndTime;
        calendarEvent.Location = request.Location?.Trim();
        calendarEvent.Category = request.Category ?? "Academic";
        calendarEvent.Color = request.Color;
        calendarEvent.Visibility = request.Visibility ?? "Public";
        calendarEvent.IsAllDay = request.IsAllDay;
        calendarEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(calendarEvent);
    }

    public async Task<bool> DeleteEventAsync(Guid id, Guid userId, string userRole)
    {
        var calendarEvent = await _context.Set<CalendarEvent>()
            .FirstOrDefaultAsync(c => c.Id == id && c.DeletedAt == null);

        if (calendarEvent is null)
            return false;

        if (userRole != "Admin" && calendarEvent.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own calendar events.");

        calendarEvent.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    private static CalendarEventResponse MapToResponse(CalendarEvent c)
    {
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
            Category = c.Category,
            Color = c.Color,
            Visibility = c.Visibility,
            IsAllDay = c.IsAllDay,
            CreatedByUserId = c.CreatedByUserId,
            CreatedByUserName = c.CreatedByUser?.FullName ?? string.Empty,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}
