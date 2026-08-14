using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IMessageService
{
    Task<ConversationResponse> GetOrCreateDirectConversationAsync(Guid senderId, Guid recipientId, string? initialMessage = null);
    Task<CursorPagedResult<ConversationResponse>> GetUserConversationsAsync(Guid userId, string? cursor, int limit = 20);
    Task<ConversationResponse> GetConversationByIdAsync(Guid userId, Guid conversationId);
    Task<MessageResponse> SendMessageAsync(Guid senderId, SendMessageRequest request);
    Task<CursorPagedResult<MessageResponse>> GetConversationMessagesAsync(Guid userId, Guid conversationId, string? cursor, int limit = 30);
    Task<bool> DeleteMessageAsync(Guid userId, Guid messageId);
    Task<bool> MarkConversationAsReadAsync(Guid userId, Guid conversationId);
    Task<int> GetTotalUnreadMessagesCountAsync(Guid userId);
}
