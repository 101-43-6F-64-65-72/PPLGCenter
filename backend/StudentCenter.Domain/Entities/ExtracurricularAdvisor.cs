namespace StudentCenter.Domain.Entities;

public class ExtracurricularAdvisor
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;
    public Guid ExtracurricularId { get; set; }
    public Extracurricular Extracurricular { get; set; } = null!;
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
}
