namespace StudentCenter.Application.Services;

public interface IAnnouncementReactionService
{
    Task<bool> ToggleReactionAsync(Guid announcementId, string type, Guid userId);
    Task<bool> RemoveReactionAsync(Guid announcementId, Guid userId);
    Task<StudentCenter.Application.DTOs.AnnouncementReactionSummaryResponse> GetReactionSummaryAsync(Guid announcementId, Guid? userId);
}
