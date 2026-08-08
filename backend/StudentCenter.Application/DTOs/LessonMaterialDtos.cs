using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class LessonMaterialResponse
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FileUrl { get; set; }
    public string? YoutubeUrl { get; set; }
    public int Order { get; set; }
    public string Visibility { get; set; } = "Published"; // Draft | Published | Archived
    public int Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLessonMaterialRequest
{
    [Required(ErrorMessage = "ClassSubjectId is required.")]
    public Guid ClassSubjectId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public string? FileUrl { get; set; }
    public string? YoutubeUrl { get; set; }
    public int Order { get; set; } = 1;

    public string Visibility { get; set; } = "Published";
}

public class UpdateLessonMaterialRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public string? FileUrl { get; set; }
    public string? YoutubeUrl { get; set; }
    public int Order { get; set; } = 1;

    public string Visibility { get; set; } = "Published";
}
