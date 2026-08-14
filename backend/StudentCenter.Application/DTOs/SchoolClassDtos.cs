using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class SchoolClassResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Grade { get; set; } = string.Empty;
    public Guid DepartmentId { get; set; }
    public string DepartmentCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public Guid? HomeroomTeacherId { get; set; }
    public string? HomeroomTeacherName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}

public class CreateSchoolClassRequest
{
    [Required(ErrorMessage = "Class Name is required.")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Grade is required.")]
    [MaxLength(20)]
    public string Grade { get; set; } = string.Empty; // "X", "XI", "XII"

    [Required(ErrorMessage = "DepartmentId is required.")]
    public Guid DepartmentId { get; set; }

    public int Capacity { get; set; } = 36;

    public Guid? HomeroomTeacherId { get; set; }

    [Required(ErrorMessage = "AcademicYearId is required.")]
    public Guid AcademicYearId { get; set; }
}

public class UpdateSchoolClassRequest
{
    [Required(ErrorMessage = "Class Name is required.")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Grade is required.")]
    [MaxLength(20)]
    public string Grade { get; set; } = string.Empty;

    [Required(ErrorMessage = "DepartmentId is required.")]
    public Guid DepartmentId { get; set; }

    public int Capacity { get; set; } = 36;

    public Guid? HomeroomTeacherId { get; set; }

    [Required(ErrorMessage = "AcademicYearId is required.")]
    public Guid AcademicYearId { get; set; }
}
