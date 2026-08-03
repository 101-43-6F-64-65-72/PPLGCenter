using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ICalendarService
{
    Task<PagedResult<CalendarEventResponse>> GetEventsAsync(int page, int pageSize, string? category);
    Task<List<CalendarEventResponse>> GetUpcomingEventsAsync(int count);
    Task<CalendarEventResponse?> GetEventByIdAsync(Guid id);
    Task<CalendarEventResponse> CreateEventAsync(CreateCalendarEventRequest request, Guid userId);
    Task<CalendarEventResponse?> UpdateEventAsync(Guid id, UpdateCalendarEventRequest request, Guid userId, string userRole);
    Task<bool> DeleteEventAsync(Guid id, Guid userId, string userRole);
}
