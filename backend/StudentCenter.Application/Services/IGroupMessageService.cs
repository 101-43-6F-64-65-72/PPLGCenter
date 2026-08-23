using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IGroupMessageService
{
    Task<PagedResult<GroupMessageResponse>> GetGroupMessagesAsync(Guid groupId, Guid currentUserId, int page, int pageSize);
    Task<GroupMessageResponse> SendMessageAsync(SendGroupMessageRequest request, Guid senderUserId);
    Task<GroupMessageResponse> ToggleReactionAsync(Guid messageId, string emoji, Guid userId);
    Task<GroupMessageResponse> EditMessageAsync(Guid messageId, EditGroupMessageRequest request, Guid userId);
    Task<bool> DeleteMessageForEveryoneAsync(Guid messageId, Guid userId);
    Task<bool> DeleteMessageForMeAsync(Guid messageId, Guid userId);
}
