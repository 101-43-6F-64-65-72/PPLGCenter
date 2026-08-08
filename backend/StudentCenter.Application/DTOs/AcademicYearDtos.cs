using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class AcademicYearResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateAcademicYearRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // e.g. "2025/2026"

    [Required(ErrorMessage = "Start Date is required.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "End Date is required.")]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = false;
}

public class UpdateAcademicYearRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Start Date is required.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "End Date is required.")]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }
}
