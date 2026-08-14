namespace StudentCenter.Domain.Entities;

public class Assignment
{
    public Guid Id { get; set; }

    public Guid ClassSubjectId { get; set; }
    public ClassSubject ClassSubject { get; set; } = null!;

    public Guid? ScheduleId { get; set; }
    public Schedule? Schedule { get; set; }

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Attachment { get; set; }

    public DateTime PublishAt { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }

    public double MaxScore { get; set; } = 100.0;
    public bool AllowLateSubmission { get; set; } = false;
    public double LatePenaltyPercent { get; set; } = 0.0;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public int Version { get; set; } = 1;
    public Guid CreatedBy { get; set; }
    public Guid UpdatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Backward Compatibility Properties
    public Guid CreatedByUserId { get => TeacherId; set => TeacherId = value; }
    public User CreatedByUser { get => Teacher; set => Teacher = value; }
    public string Subject { get => ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty; set { } }
    public string Grade { get => ClassSubject?.Class?.Grade ?? string.Empty; set { } }

    // Navigation
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
