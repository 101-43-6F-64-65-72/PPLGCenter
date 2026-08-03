namespace StudentCenter.Domain.Entities;

public class ExtracurricularMember
{
    public Guid Id { get; set; }
    public Guid ExtracurricularId { get; set; }
    public Extracurricular Extracurricular { get; set; } = null!;
    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;
    public DateTime JoinedAt { get; set; }
}
