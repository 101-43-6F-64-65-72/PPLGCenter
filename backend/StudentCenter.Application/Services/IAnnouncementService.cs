using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAnnouncementService
{
    Task<PagedResult<AnnouncementResponse>> GetAnnouncementsAsync(int page, int pageSize, string? category, Guid? requestingUserId = null, string? requestingUserRole = null, Guid? requestingClassId = null);
    Task<PagedResult<AnnouncementFeedResponse>> GetFeedAsync(int page, int pageSize, string? category, Guid? requestingUserId = null, string? requestingUserRole = null, Guid? requestingClassId = null);
    Task<List<AnnouncementResponse>> GetShowcaseAnnouncementsAsync(Guid? requestingUserId = null, string? requestingUserRole = null, Guid? requestingClassId = null);
    Task<AnnouncementResponse?> GetAnnouncementByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null, Guid? requestingClassId = null);
    Task<AnnouncementResponse> CreateAnnouncementAsync(CreateAnnouncementRequest request, Guid userId, string userRole = "Admin");
    Task<AnnouncementResponse?> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<AnnouncementResponse?> ToggleShowcaseAsync(Guid id, ToggleShowcaseRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<bool> DeleteAnnouncementAsync(Guid id, Guid requestingUserId = default, string requestingUserRole = "Admin");
    Task<PagedResult<AnnouncementResponse>> SearchAsync(int page, int pageSize, string? keyword = null, bool? isPinned = null);
}
