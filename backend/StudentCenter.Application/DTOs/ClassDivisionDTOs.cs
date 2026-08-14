namespace StudentCenter.Application.DTOs;

public class ClassDivisionNodeResponse
{
    public Guid Id { get; set; }
    public Guid SchoolClassId { get; set; }
    public Guid? ParentDivisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? LeaderStudentId { get; set; }
    public string? LeaderStudentName { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ClassDivisionNodeResponse> SubDivisions { get; set; } = new();
}

public class CreateClassDivisionRequest
{
    public Guid SchoolClassId { get; set; }
    public Guid? ParentDivisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? LeaderStudentId { get; set; }
}

public class UpdateClassDivisionRequest
{
    public Guid? ParentDivisionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? LeaderStudentId { get; set; }
}
