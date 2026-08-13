using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IGroupMessageService
{
    Task<PagedResult<GroupMessageResponse>> GetGroupMessagesAsync(Guid groupId, Guid currentUserId, int page, int pageSize);
    Task<GroupMessageResponse> SendMessageAsync(SendGroupMessageRequest request, Guid senderUserId);
}
