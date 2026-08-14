using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CursorPagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public string? NextCursor { get; set; }
    public bool HasMore { get; set; }
}

public class CreateDiscussionThreadRequest
{
    public Guid ClassSubjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public class UpdateDiscussionThreadRequest
{
    public string? Title { get; set; }
    public string? Body { get; set; }
    public bool? IsPinned { get; set; }
    public bool? IsLocked { get; set; }
}

public class DiscussionThreadResponse
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorPhotoUrl { get; set; }
    public string AuthorRole { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public bool IsLocked { get; set; }
    public int ReplyCount { get; set; }
    public DateTime? LastReplyAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateDiscussionReplyRequest
{
    public Guid ThreadId { get; set; }
    public Guid? ParentReplyId { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentFileSize { get; set; }
    public string? StorageProvider { get; set; }
}

public class DiscussionReplyResponse
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public Guid? ParentReplyId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorPhotoUrl { get; set; }
    public string AuthorRole { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public string? AttachmentContentType { get; set; }
    public long? AttachmentFileSize { get; set; }
    public string? StorageProvider { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<DiscussionReplyResponse> ChildReplies { get; set; } = new();
}

public class CreateConversationRequest
{
    public Guid RecipientUserId { get; set; }
    public string? InitialMessage { get; set; }
}

public class ConversationResponse
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public ConversationType Type { get; set; }
    public DateTime LastActivityAt { get; set; }
    public int UnreadCount { get; set; }
    public List<ConversationMemberDto> Members { get; set; } = new();
    public MessageResponse? LastMessage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ConversationMemberDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; set; }
}

public class SendMessageRequest
{
    public Guid ConversationId { get; set; }
    public string? Text { get; set; }
    public MessageType MessageType { get; set; } = MessageType.Text;
    public List<CreateMessageAttachmentRequest>? Attachments { get; set; }
}

public class CreateMessageAttachmentRequest
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StorageProvider { get; set; } = "Local";
    public string Url { get; set; } = string.Empty;
}

public class MessageResponse
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderPhotoUrl { get; set; }
    public MessageType MessageType { get; set; }
    public string? Text { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? EditedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<MessageAttachmentDto> Attachments { get; set; } = new();
}

public class MessageAttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StorageProvider { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class CreateAnnouncementCommentRequest
{
    public string Content { get; set; } = string.Empty;
    public Guid? ParentCommentId { get; set; }
}

public class AnnouncementCommentResponse
{
    public Guid Id { get; set; }
    public Guid AnnouncementId { get; set; }
    public Guid UserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorPhotoUrl { get; set; }
    public string AuthorRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid? ParentCommentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<AnnouncementCommentResponse> ChildComments { get; set; } = new();
}
