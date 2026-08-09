using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class RegisterChairmanRequest
{
    public Guid ElectionId { get; set; }
    public string Vision { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string Programs { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int CandidateNumber { get; set; } = 1;
}

/// <summary>
/// Unified request to register a Chairman + Vice pair atomically in one request.
/// The current logged-in user is automatically assigned as Chairman.
/// </summary>
public class RegisterPairRequest
{
    public Guid ElectionId { get; set; }
    public Guid ViceUserId { get; set; }
    public string Vision { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string Programs { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? VicePhotoUrl { get; set; }
}

public class ApplyViceRequest
{
    public string? ViceVision { get; set; }
    public string? ViceMission { get; set; }
    public string? VicePhotoUrl { get; set; }
}

public class ReviewCandidatePairRequest
{
    public bool IsApproved { get; set; }
    public string? RejectionReason { get; set; }
}

public class CastPairVoteRequest
{
    public Guid CandidatePairId { get; set; }
}

public class CandidatePairResponse
{
    public Guid Id { get; set; }
    public Guid ElectionId { get; set; }
    public int CandidateNumber { get; set; }

    public Guid ChairmanUserId { get; set; }
    public string ChairmanName { get; set; } = string.Empty;
    public string? ChairmanNis { get; set; }
    public string? ChairmanClass { get; set; }
    public string? PhotoUrl { get; set; }

    public Guid? ViceUserId { get; set; }
    public string? ViceName { get; set; }
    public string? ViceNis { get; set; }
    public string? ViceClass { get; set; }
    public string? VicePhotoUrl { get; set; }

    public string Vision { get; set; } = string.Empty;
    public string Mission { get; set; } = string.Empty;
    public string Programs { get; set; } = string.Empty;

    public string? ViceVision { get; set; }
    public string? ViceMission { get; set; }

    public CandidatePairStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public string? RejectionReason { get; set; }

    public int VoteCount { get; set; }
    public double VotePercentage { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class PemilosLiveResultResponse
{
    public Guid ElectionId { get; set; }
    public string ElectionTitle { get; set; } = string.Empty;
    public ElectionStatus Status { get; set; }
    public bool IsResultsVisible { get; set; }

    public int TotalEligibleVoters { get; set; }
    public int TotalVotesCast { get; set; }
    public double ParticipationRate { get; set; }

    public CandidatePairResponse? WinnerPair { get; set; }
    public List<CandidatePairResponse> Rankings { get; set; } = new();
}
