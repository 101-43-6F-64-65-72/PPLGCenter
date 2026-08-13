using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IClassLeadershipService
{
    Task<ClassLeadershipResponse?> GetActiveLeadershipAsync(Guid schoolClassId);
    Task<List<ClassLeadershipResponse>> GetLeadershipHistoryAsync(Guid schoolClassId);
    Task<ClassLeadershipResponse> AppointLeadershipAsync(AppointLeadershipRequest request, Guid appointedByUserId);
}
