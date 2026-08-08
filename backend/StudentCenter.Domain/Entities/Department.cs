namespace StudentCenter.Domain.Entities;

public class Department
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;   // "RPL", "TKJ", …
    public string Name { get; set; } = string.Empty;   // full name
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<SchoolClass> Classes { get; set; } = new List<SchoolClass>();
}
