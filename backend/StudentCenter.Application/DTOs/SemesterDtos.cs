using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class SemesterResponse
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty; // "Ganjil" | "Genap"
    public int Order { get; set; }
    public bool IsActive { get; set; }
}

public class CreateSemesterRequest
{
    [Required(ErrorMessage = "AcademicYearId is required.")]
    public Guid AcademicYearId { get; set; }

    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty; // "Ganjil" | "Genap"

    public int Order { get; set; } = 1;

    public bool IsActive { get; set; } = false;
}

public class UpdateSemesterRequest
{
    [Required(ErrorMessage = "AcademicYearId is required.")]
    public Guid AcademicYearId { get; set; }

    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public int Order { get; set; } = 1;

    public bool IsActive { get; set; }
}
