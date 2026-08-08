namespace StudentCenter.Application.Services;

public interface ICommunicationAuthorizationService
{
    Task<bool> CanAccessConversationAsync(Guid userId, Guid conversationId);
    Task<bool> CanCreateDirectConversationAsync(Guid senderId, Guid recipientId);
    Task<bool> CanPostDiscussionThreadAsync(Guid userId, Guid classSubjectId);
    Task<bool> CanReplyDiscussionThreadAsync(Guid userId, Guid threadId);
}
