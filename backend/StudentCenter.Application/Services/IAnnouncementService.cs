using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAnnouncementService
{
    Task<PagedResult<AnnouncementResponse>> GetAnnouncementsAsync(int page, int pageSize, string? category);
    Task<AnnouncementResponse?> GetAnnouncementByIdAsync(Guid id);
    Task<AnnouncementResponse> CreateAnnouncementAsync(CreateAnnouncementRequest request, Guid userId);
    Task<AnnouncementResponse?> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementRequest request);
    Task<bool> DeleteAnnouncementAsync(Guid id);
}
