using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAcademicEventService
{
    Task<List<AcademicEventResponse>> GetAllAsync(Guid requestingUserId = default, string requestingUserRole = "Admin", string? targetType = null, Guid? classId = null, bool? isActive = null);
    Task<AcademicEventResponse?> GetByIdAsync(Guid id, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<AcademicEventResponse> CreateAsync(CreateAcademicEventRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<AcademicEventResponse?> UpdateAsync(Guid id, UpdateAcademicEventRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<bool> DeleteAsync(Guid id, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<List<AcademicEventResponse>> GetUpcomingEventsAsync(int limit = 5, Guid requestingUserId = default, string requestingUserRole = "Student");
}
