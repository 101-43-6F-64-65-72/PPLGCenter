using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class AssignTeacherRequest
{
    [Required]
    public Guid TeacherId { get; set; }

    /// <summary>
    /// Optional SchoolClass ID to assign this teacher as Homeroom Teacher.
    /// Pass Guid.Empty or null to remove homeroom assignment.
    /// </summary>
    public Guid? HomeroomClassId { get; set; }

    /// <summary>
    /// List of Extracurricular IDs to assign this teacher as Advisor.
    /// </summary>
    public List<Guid> AdvisorExtracurricularIds { get; set; } = new();
}
