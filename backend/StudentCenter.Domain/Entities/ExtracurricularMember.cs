using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class ExtracurricularMember
{
    public Guid Id { get; set; }
    public Guid ExtracurricularId { get; set; }
    public Extracurricular Extracurricular { get; set; } = null!;
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
    public ExtracurricularMemberPosition Position { get; set; } = ExtracurricularMemberPosition.Member;
    public DateTime JoinDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Active";
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
