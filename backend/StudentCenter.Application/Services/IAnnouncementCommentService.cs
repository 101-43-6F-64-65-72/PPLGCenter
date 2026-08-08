using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAnnouncementCommentService
{
    Task<CommentResponse> AddCommentAsync(Guid announcementId, CommentRequest request, Guid userId, Guid? parentCommentId = null);
    Task<PagedResult<CommentResponse>> GetCommentsAsync(Guid announcementId, int page, int pageSize);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId, string userRole);
    Task<bool> ToggleCommentsLockAsync(Guid announcementId, Guid userId);
}
