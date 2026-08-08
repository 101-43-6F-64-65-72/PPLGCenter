using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class AcademicEventResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid? TargetClassId { get; set; }
    public string? TargetClassName { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAcademicEventRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Type is required.")]
    public string Type { get; set; } = "School"; // Holiday | Exam | Meeting | Competition | School

    [Required(ErrorMessage = "TargetType is required.")]
    public string TargetType { get; set; } = "All"; // All | Teacher | Student | Class

    public Guid? TargetClassId { get; set; }

    [Required(ErrorMessage = "StartDate is required.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required.")]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateAcademicEventRequest
{
    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Type is required.")]
    public string Type { get; set; } = "School";

    [Required(ErrorMessage = "TargetType is required.")]
    public string TargetType { get; set; } = "All";

    public Guid? TargetClassId { get; set; }

    [Required(ErrorMessage = "StartDate is required.")]
    public DateTime StartDate { get; set; }

    [Required(ErrorMessage = "EndDate is required.")]
    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; } = true;
}
