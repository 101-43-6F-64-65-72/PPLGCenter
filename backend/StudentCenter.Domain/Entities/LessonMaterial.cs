namespace StudentCenter.Domain.Entities;

public class LessonMaterial
{
    public Guid Id { get; set; }

    public Guid ClassSubjectId { get; set; }
    public ClassSubject ClassSubject { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FileUrl { get; set; }
    public string? YoutubeUrl { get; set; }

    public int Order { get; set; } = 1;

    /// <summary>Draft | Published | Archived</summary>
    public string Visibility { get; set; } = "Published";

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
