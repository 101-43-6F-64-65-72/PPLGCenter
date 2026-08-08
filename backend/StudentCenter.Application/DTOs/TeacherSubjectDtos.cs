using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class TeacherSubjectResponse
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string TeacherNip { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTeacherSubjectRequest
{
    [Required(ErrorMessage = "TeacherId is required.")]
    public Guid TeacherId { get; set; }

    [Required(ErrorMessage = "SubjectId is required.")]
    public Guid SubjectId { get; set; }
}
