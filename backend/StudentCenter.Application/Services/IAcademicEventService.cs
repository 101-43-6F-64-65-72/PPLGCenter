using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAcademicEventService
{
    Task<List<AcademicEventResponse>> GetAllAsync(string? targetType = null, Guid? classId = null, bool? isActive = null);
    Task<AcademicEventResponse?> GetByIdAsync(Guid id);
    Task<AcademicEventResponse> CreateAsync(CreateAcademicEventRequest request);
    Task<AcademicEventResponse?> UpdateAsync(Guid id, UpdateAcademicEventRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<List<AcademicEventResponse>> GetUpcomingEventsAsync(int limit = 5);
}
