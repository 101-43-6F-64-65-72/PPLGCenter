namespace StudentCenter.Application.DTOs;

public class CommentResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid AnnouncementId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserPhotoUrl { get; set; }
    public Guid? ParentCommentId { get; set; }
}
