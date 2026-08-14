using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

// --- GradeCategory DTOs ---
public class CreateGradeCategoryRequest
{
    [Required(ErrorMessage = "Category name is required.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100.")]
    public decimal Weight { get; set; }

    public GradeCategoryType Type { get; set; } = GradeCategoryType.Assignment;
}

public class UpdateGradeCategoryRequest
{
    [Required(ErrorMessage = "Category name is required.")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100.")]
    public decimal Weight { get; set; }

    public GradeCategoryType Type { get; set; }
    public bool IsActive { get; set; } = true;
}

public class GradeCategoryResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Weight { get; set; }
    public GradeCategoryType Type { get; set; }
    public string TypeName => Type.ToString();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// --- Assessment DTOs ---
public class CreateAssessmentRequest
{
    [Required(ErrorMessage = "ClassSubjectId is required.")]
    public Guid ClassSubjectId { get; set; }

    [Required(ErrorMessage = "GradeCategoryId is required.")]
    public Guid GradeCategoryId { get; set; }

    public Guid? AssignmentId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public AssessmentType AssessmentType { get; set; } = AssessmentType.Assignment;

    [Range(1, 1000, ErrorMessage = "MaxScore must be greater than 0.")]
    public decimal MaxScore { get; set; } = 100.0m;

    public decimal? WeightOverride { get; set; }

    public DateTime PublishAt { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(7);
    public bool IsPublished { get; set; } = false;
}

public class UpdateAssessmentRequest
{
    [Required(ErrorMessage = "GradeCategoryId is required.")]
    public Guid GradeCategoryId { get; set; }

    public Guid? AssignmentId { get; set; }

    [Required(ErrorMessage = "Title is required.")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public AssessmentType AssessmentType { get; set; }

    [Range(1, 1000, ErrorMessage = "MaxScore must be greater than 0.")]
    public decimal MaxScore { get; set; } = 100.0m;

    public decimal? WeightOverride { get; set; }

    public DateTime PublishAt { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsPublished { get; set; }
}

public class AssessmentResponse
{
    public Guid Id { get; set; }
    public Guid ClassSubjectId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;

    public Guid GradeCategoryId { get; set; }
    public string GradeCategoryName { get; set; } = string.Empty;
    public decimal CategoryWeight { get; set; }

    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;

    public Guid? AssignmentId { get; set; }
    public string? AssignmentTitle { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public AssessmentType AssessmentType { get; set; }
    public string AssessmentTypeName => AssessmentType.ToString();

    public decimal MaxScore { get; set; }
    public decimal? WeightOverride { get; set; }

    public DateTime PublishAt { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsPublished { get; set; }

    public int GradedCount { get; set; }
    public int TotalStudentsCount { get; set; }
    public decimal AverageScore { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// --- StudentGrade DTOs ---
public class GradeItemRequest
{
    [Required]
    public Guid StudentId { get; set; }

    [Range(0, 1000, ErrorMessage = "RawScore must be positive.")]
    public decimal RawScore { get; set; }
    public string? Remarks { get; set; }
}

public class BulkGradeRequest
{
    [Required]
    public Guid AssessmentId { get; set; }
    public List<GradeItemRequest> Items { get; set; } = new();
    public bool PublishImmediately { get; set; } = false;
}

public class StudentGradeResponse
{
    public Guid Id { get; set; }
    public Guid AssessmentId { get; set; }
    public string AssessmentTitle { get; set; } = string.Empty;
    public decimal MaxScore { get; set; }

    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNis { get; set; } = string.Empty;

    public decimal RawScore { get; set; }
    public decimal FinalScore { get; set; }
    public string LetterGrade { get; set; } = string.Empty;
    public string Predicate { get; set; } = string.Empty;
    public string? Remarks { get; set; }

    public Guid GradedBy { get; set; }
    public string GradedByName { get; set; } = string.Empty;
    public DateTime GradedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool IsPublished { get; set; }
}

// --- GradeScale DTOs ---
public class CreateGradeScaleRequest
{
    public decimal Minimum { get; set; }
    public decimal Maximum { get; set; }
    [Required, MaxLength(10)]
    public string Letter { get; set; } = string.Empty;
    [Required, MaxLength(100)]
    public string Predicate { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateGradeScaleRequest : CreateGradeScaleRequest
{
    public bool IsActive { get; set; } = true;
}

public class GradeScaleResponse
{
    public Guid Id { get; set; }
    public decimal Minimum { get; set; }
    public decimal Maximum { get; set; }
    public string Letter { get; set; } = string.Empty;
    public string Predicate { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

// --- Teacher Gradebook View DTOs ---
public class GradebookStudentRow
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNis { get; set; } = string.Empty;
    public Dictionary<Guid, StudentGradeResponse> AssessmentGrades { get; set; } = new();
    public decimal FinalSubjectScore { get; set; }
    public string FinalLetterGrade { get; set; } = string.Empty;
    public string FinalPredicate { get; set; } = string.Empty;
    public int ClassRank { get; set; }
    public bool IsPassed { get; set; }
}

public class TeacherGradebookViewResponse
{
    public Guid ClassSubjectId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public List<AssessmentResponse> Assessments { get; set; } = new();
    public List<GradebookStudentRow> StudentRows { get; set; } = new();
    public decimal ClassAverage { get; set; }
    public decimal ClassHighest { get; set; }
    public decimal ClassLowest { get; set; }
    public int TotalStudents { get; set; }
}

// --- Student Transcript DTOs ---
public class SubjectGradeSummary
{
    public Guid ClassSubjectId { get; set; }
    public string SubjectCode { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public decimal FinalScore { get; set; }
    public string LetterGrade { get; set; } = string.Empty;
    public string Predicate { get; set; } = string.Empty;
    public int RankInClass { get; set; }
    public bool IsPassed { get; set; }
    public List<StudentGradeResponse> Grades { get; set; } = new();
}

public class StudentTranscriptResponse
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNis { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public decimal OverallGpa { get; set; }
    public decimal OverallAverageScore { get; set; }
    public string OverallLetterGrade { get; set; } = string.Empty;
    public string OverallPredicate { get; set; } = string.Empty;
    public int TotalSubjects { get; set; }
    public int TotalPassedSubjects { get; set; }
    public List<SubjectGradeSummary> SubjectSummaries { get; set; } = new();
}

// --- Report Card Summary DTO (Module 10) ---
public class ReportCardSummaryResponse
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentNis { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SemesterName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public decimal SemesterAverage { get; set; }
    public string OverallLetterGrade { get; set; } = string.Empty;
    public string OverallPredicate { get; set; } = string.Empty;
    public double AttendancePercentage { get; set; }
    public int TotalPresentDays { get; set; }
    public int TotalAbsentDays { get; set; }
    public List<SubjectGradeSummary> SubjectGrades { get; set; } = new();
    public string TeacherRemarks { get; set; } = string.Empty;
}
