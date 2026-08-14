using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class Assessment
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public ClassSubject ClassSubject { get; set; } = null!;

    public Guid GradeCategoryId { get; set; }
    public GradeCategory GradeCategory { get; set; } = null!;

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public Guid? AssignmentId { get; set; }
    public Assignment? Assignment { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AssessmentType AssessmentType { get; set; } = AssessmentType.Assignment;

    public decimal MaxScore { get; set; } = 100.0m;
    public decimal? WeightOverride { get; set; }

    public DateTime PublishAt { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsPublished { get; set; } = false;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<StudentGrade> StudentGrades { get; set; } = new List<StudentGrade>();
}
