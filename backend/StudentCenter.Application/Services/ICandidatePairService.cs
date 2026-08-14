using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ICandidatePairService
{
    Task<List<CandidatePairResponse>> GetCandidatePairsAsync(Guid electionId, Guid? currentUserId = null);
    Task<CandidatePairResponse?> GetCandidatePairByIdAsync(Guid candidatePairId, Guid? currentUserId = null);

    Task<CandidatePairResponse> RegisterChairmanAsync(RegisterChairmanRequest request, Guid chairmanUserId);
    Task<CandidatePairResponse> RegisterPairAsync(RegisterPairRequest request, Guid chairmanUserId);
    Task<CandidatePairResponse> ApplyViceAsync(Guid candidatePairId, ApplyViceRequest request, Guid viceUserId);
    Task<bool> ChairmanReviewViceAsync(Guid candidatePairId, bool isAccepted, Guid chairmanUserId);
    Task<bool> TeacherReviewPairAsync(Guid candidatePairId, ReviewCandidatePairRequest request, Guid teacherUserId);
    Task<bool> AdminReviewPairAsync(Guid candidatePairId, ReviewCandidatePairRequest request, Guid adminUserId);

    Task<bool> CastVoteAsync(Guid electionId, Guid candidatePairId, Guid voterUserId);
    Task<PemilosLiveResultResponse?> GetLiveResultsAsync(Guid electionId, Guid? currentUserId = null);
    Task<ElectionEligibilityResponse> CheckEligibilityAsync(Guid electionId, Guid studentId);
    Task<List<UserResponse>> GetEligibleViceCandidatesAsync(string? search = null, Guid? electionId = null, Guid? currentUserId = null);
}
