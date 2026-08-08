using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class ClassSubjectResponse
{
    public Guid Id { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string DepartmentCode { get; set; } = string.Empty;
    public Guid TeacherSubjectId { get; set; }
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateClassSubjectRequest
{
    [Required(ErrorMessage = "ClassId is required.")]
    public Guid ClassId { get; set; }

    [Required(ErrorMessage = "TeacherSubjectId is required.")]
    public Guid TeacherSubjectId { get; set; }
}
