namespace StudentCenter.Domain.Entities;

public class StudentGrade
{
    public Guid Id { get; set; }
    public Guid AssessmentId { get; set; }
    public Assessment Assessment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public decimal RawScore { get; set; }
    public decimal FinalScore { get; set; }
    public string LetterGrade { get; set; } = string.Empty;
    public string Predicate { get; set; } = string.Empty;
    public string? Remarks { get; set; }

    public Guid GradedBy { get; set; }
    public User GradedByUser { get; set; } = null!;

    public DateTime GradedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool IsPublished { get; set; } = false;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
