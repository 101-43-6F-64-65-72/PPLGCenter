namespace StudentCenter.Domain.Entities;

public class ClassDivision
{
    public Guid Id { get; set; }
    public Guid SchoolClassId { get; set; }
    public SchoolClass SchoolClass { get; set; } = null!;

    public Guid? ParentDivisionId { get; set; } // Self-referencing FK for Adjacency List Tree Structure
    public ClassDivision? ParentDivision { get; set; }
    public ICollection<ClassDivision> SubDivisions { get; set; } = new List<ClassDivision>();

    public string Name { get; set; } = string.Empty; // e.g. "Seksi Kebersihan"
    public string? Description { get; set; }

    public Guid? LeaderStudentId { get; set; }
    public User? LeaderStudent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
