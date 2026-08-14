using System.ComponentModel.DataAnnotations;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class CreateElectionRequest
{
    [Required(ErrorMessage = "Judul pemilihan wajib diisi")]
    [StringLength(200, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }
}

public class UpdateElectionRequest
{
    [Required]
    [StringLength(200, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }
}

public class CreateCandidateRequest
{
    [Required]
    public Guid StudentId { get; set; }

    [Required]
    public string Vision { get; set; } = string.Empty;

    [Required]
    public string Mission { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }

    [Required]
    public int CandidateNumber { get; set; }
}

public class VoteRequest
{
    [Required]
    public Guid CandidateId { get; set; }
}

public class ElectionCandidateResponse
{
    public Guid Id { get; set; }
    public Guid ElectionId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? StudentNis { get; set; }
    public string? ClassName { get; set; }
    public string Vision { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int CandidateNumber { get; set; }
    public int VoteCount { get; set; }
    public double VotePercentage { get; set; }
}

public class StartPemilosRequest
{
    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public string? CabinetStructureJson { get; set; }
}

public class ElectionResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ElectionStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public bool HasVoted { get; set; }
    public Guid? VotedCandidateId { get; set; }
    public string? CabinetStructureJson { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ElectionCandidateResponse> Candidates { get; set; } = new();
}

public class ElectionResultResponse
{
    public Guid ElectionId { get; set; }
    public string ElectionTitle { get; set; } = string.Empty;
    public int TotalVotes { get; set; }
    public double ParticipationRate { get; set; }
    public ElectionCandidateResponse? WinnerCandidate { get; set; }
    public List<ElectionCandidateResponse> CandidateRankings { get; set; } = new();
}

public class ParticipationResponse
{
    public Guid ElectionId { get; set; }
    public int TotalEligibleVoters { get; set; }
    public int TotalVoted { get; set; }
    public double ParticipationRate { get; set; }
}
