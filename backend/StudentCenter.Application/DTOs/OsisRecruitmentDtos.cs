using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CreateOsisPositionRequest
{
    public Guid AcademicYearId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Capacity { get; set; } = 1;
    public bool IsOpenForRecruitment { get; set; } = true;
}

public class SubmitOsisApplicationRequest
{
    public Guid OsisPositionId { get; set; }
    public string Motivation { get; set; } = string.Empty;
    public string? PortfolioUrl { get; set; }
}

public class ReviewOsisApplicationRequest
{
    public RecruitmentApplicationStatus Status { get; set; }
    public string? ReviewNotes { get; set; }
}

public class OsisPositionResponse
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public int Capacity { get; set; }
    public int FilledCount { get; set; }
    public bool IsOpenForRecruitment { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class OsisApplicationResponse
{
    public Guid Id { get; set; }
    public Guid OsisPositionId { get; set; }
    public string PositionTitle { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    public Guid ApplicantStudentId { get; set; }
    public string ApplicantName { get; set; } = string.Empty;
    public string? ApplicantNis { get; set; }
    public string? ApplicantClass { get; set; }

    public string Motivation { get; set; } = string.Empty;
    public string? PortfolioUrl { get; set; }

    public RecruitmentApplicationStatus Status { get; set; }
    public string StatusText => Status.ToString();

    public string? TeacherReviewNotes { get; set; }
    public string? ChairmanNotes { get; set; }
    public string? AdminNotes { get; set; }

    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OsisCabinetMemberResponse
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;

    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string PositionTitle { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool IsActive { get; set; }
}
