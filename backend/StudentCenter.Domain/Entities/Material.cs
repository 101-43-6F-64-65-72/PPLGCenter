namespace StudentCenter.Domain.Entities;

public class Material
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
}
