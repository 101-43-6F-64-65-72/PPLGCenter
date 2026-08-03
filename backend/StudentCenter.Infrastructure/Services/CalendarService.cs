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
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(c => c.Category == category);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(c => c.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CalendarEventResponse
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Location = c.Location,
                Category = c.Category,
                IsAllDay = c.IsAllDay,
                CreatedByUserId = c.CreatedByUserId,
                CreatedByUserName = c.CreatedByUser.FullName,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
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
            .Where(c => c.StartDate >= now)
            .OrderBy(c => c.StartDate)
            .Take(count)
            .Select(c => new CalendarEventResponse
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Location = c.Location,
                Category = c.Category,
                IsAllDay = c.IsAllDay,
                CreatedByUserId = c.CreatedByUserId,
                CreatedByUserName = c.CreatedByUser.FullName,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<CalendarEventResponse?> GetEventByIdAsync(Guid id)
    {
        return await _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CalendarEventResponse
            {
                Id = c.Id,
                Title = c.Title,
                Description = c.Description,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                Location = c.Location,
                Category = c.Category,
                IsAllDay = c.IsAllDay,
                CreatedByUserId = c.CreatedByUserId,
                CreatedByUserName = c.CreatedByUser.FullName,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CalendarEventResponse> CreateEventAsync(CreateCalendarEventRequest request, Guid userId)
    {
        var calendarEvent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Location = request.Location,
            Category = request.Category,
            IsAllDay = request.IsAllDay,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<CalendarEvent>().Add(calendarEvent);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        return new CalendarEventResponse
        {
            Id = calendarEvent.Id,
            Title = calendarEvent.Title,
            Description = calendarEvent.Description,
            StartDate = calendarEvent.StartDate,
            EndDate = calendarEvent.EndDate,
            Location = calendarEvent.Location,
            Category = calendarEvent.Category,
            IsAllDay = calendarEvent.IsAllDay,
            CreatedByUserId = calendarEvent.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? string.Empty,
            CreatedAt = calendarEvent.CreatedAt,
            UpdatedAt = calendarEvent.UpdatedAt
        };
    }

    public async Task<CalendarEventResponse?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request, Guid userId, string userRole)
    {
        var calendarEvent = await _context.Set<CalendarEvent>()
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (calendarEvent is null)
            return null;

        if (userRole != "Admin" && calendarEvent.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update your own calendar events.");

        calendarEvent.Title = request.Title;
        calendarEvent.Description = request.Description;
        calendarEvent.StartDate = request.StartDate;
        calendarEvent.EndDate = request.EndDate;
        calendarEvent.Location = request.Location;
        calendarEvent.Category = request.Category;
        calendarEvent.IsAllDay = request.IsAllDay;
        calendarEvent.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new CalendarEventResponse
        {
            Id = calendarEvent.Id,
            Title = calendarEvent.Title,
            Description = calendarEvent.Description,
            StartDate = calendarEvent.StartDate,
            EndDate = calendarEvent.EndDate,
            Location = calendarEvent.Location,
            Category = calendarEvent.Category,
            IsAllDay = calendarEvent.IsAllDay,
            CreatedByUserId = calendarEvent.CreatedByUserId,
            CreatedByUserName = calendarEvent.CreatedByUser.FullName,
            CreatedAt = calendarEvent.CreatedAt,
            UpdatedAt = calendarEvent.UpdatedAt
        };
    }

    public async Task<bool> DeleteEventAsync(Guid id, Guid userId, string userRole)
    {
        var calendarEvent = await _context.Set<CalendarEvent>()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (calendarEvent is null)
            return false;

        if (userRole != "Admin" && calendarEvent.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own calendar events.");

        _context.Set<CalendarEvent>().Remove(calendarEvent);
        await _context.SaveChangesAsync();

        return true;
    }
}
