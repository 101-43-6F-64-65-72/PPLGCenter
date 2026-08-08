using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class DepartmentResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TotalClasses { get; set; }
    public int TotalStudents { get; set; }
}

public class CreateDepartmentRequest
{
    [Required(ErrorMessage = "Department Code is required.")]
    [MaxLength(20, ErrorMessage = "Code cannot exceed 20 characters.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Department Name is required.")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters.")]
    public string Name { get; set; } = string.Empty;
}

public class UpdateDepartmentRequest
{
    [Required(ErrorMessage = "Department Code is required.")]
    [MaxLength(20, ErrorMessage = "Code cannot exceed 20 characters.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Department Name is required.")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters.")]
    public string Name { get; set; } = string.Empty;
}
