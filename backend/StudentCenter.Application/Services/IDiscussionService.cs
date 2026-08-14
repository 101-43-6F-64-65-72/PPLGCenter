using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IDiscussionService
{
    Task<DiscussionThreadResponse> CreateThreadAsync(Guid userId, CreateDiscussionThreadRequest request);
    Task<CursorPagedResult<DiscussionThreadResponse>> GetClassSubjectThreadsAsync(Guid classSubjectId, string? cursor, int limit = 15);
    Task<DiscussionThreadResponse> GetThreadByIdAsync(Guid threadId);
    Task<DiscussionThreadResponse> UpdateThreadAsync(Guid userId, Guid threadId, UpdateDiscussionThreadRequest request);
    Task<bool> DeleteThreadAsync(Guid userId, Guid threadId);

    Task<DiscussionReplyResponse> CreateReplyAsync(Guid userId, CreateDiscussionReplyRequest request);
    Task<List<DiscussionReplyResponse>> GetThreadRepliesAsync(Guid threadId);
    Task<bool> DeleteReplyAsync(Guid userId, Guid replyId);

    Task<DiscussionThreadResponse> TogglePinThreadAsync(Guid userId, Guid threadId);
    Task<DiscussionThreadResponse> ToggleLockThreadAsync(Guid userId, Guid threadId);
}
