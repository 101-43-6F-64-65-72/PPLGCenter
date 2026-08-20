using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ICalendarService
{
    Task<PagedResult<CalendarEventResponse>> GetEventsAsync(int page, int pageSize, string? category, string? userRole = null);
    Task<List<CalendarEventResponse>> GetUpcomingEventsAsync(int count, string? userRole = null);
    Task<List<CalendarEventResponse>> GetMonthlyEventsAsync(int year, int month, string? userRole = null);
    Task<List<CalendarEventResponse>> GetDailyEventsAsync(DateTime date, string? userRole = null);
    Task<CalendarEventResponse?> GetEventByIdAsync(Guid id, string? userRole = null);
    Task<CalendarEventResponse> CreateEventAsync(CreateCalendarEventRequest request, Guid userId, string? userRole = null);
    Task<CalendarEventResponse?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request, Guid userId, string userRole);
    Task<bool> DeleteEventAsync(Guid id, Guid userId, string userRole);
}
