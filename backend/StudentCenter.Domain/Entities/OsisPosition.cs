namespace StudentCenter.Domain.Entities;

public class OsisPosition
{
    public Guid Id { get; set; }

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public string Title { get; set; } = string.Empty;       // e.g. Ketua, Sekretaris, Bendahara, Humas, Teknologi
    public string Department { get; set; } = string.Empty;  // e.g. BPH, Sekbid 1, Sekbid 2
    public string Description { get; set; } = string.Empty;

    public int Capacity { get; set; } = 1;
    public bool IsOpenForRecruitment { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OsisApplication> Applications { get; set; } = new List<OsisApplication>();
}
