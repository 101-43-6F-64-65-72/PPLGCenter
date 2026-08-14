using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IExtracurricularService
{
    Task<PagedResult<ExtracurricularResponse>> GetExtracurricularsAsync(int page, int pageSize, string? category = null, bool? isActive = null);
    Task<ExtracurricularResponse?> GetExtracurricularByIdAsync(Guid id);
    Task<ExtracurricularResponse> CreateExtracurricularAsync(CreateExtracurricularRequest request, Guid managerId);
    Task<ExtracurricularResponse?> UpdateExtracurricularAsync(Guid id, UpdateExtracurricularRequest request, Guid managerId);
    Task<bool> DeleteExtracurricularAsync(Guid id, Guid managerId);
    Task<ExtracurricularMemberResponse> JoinExtracurricularAsync(Guid extracurricularId, Guid studentId);
    Task<bool> LeaveExtracurricularAsync(Guid extracurricularId, Guid studentId);
    Task<PagedResult<ExtracurricularMemberResponse>> GetExtracurricularMembersAsync(Guid extracurricularId, int page, int pageSize);
    Task<bool> UpdateMemberStatusAsync(Guid extracurricularId, Guid memberId, string status, Guid reviewerId);

    Task<PagedResult<ExtracurricularResponse>> GetMyExtracurricularsAsync(Guid studentId, int page, int pageSize);

    /// <summary>
    /// Returns all extracurriculars supervised by the given teacher (via SupervisorTeacherId or ExtracurricularAdvisors),
    /// each enriched with live MemberCount, PendingProposalsCount, and CompletedReviewCount.
    /// Always queries PostgreSQL directly — never relies on stale cache.
    /// </summary>
    Task<List<SupervisedExtracurricularSummary>> GetSupervisedByTeacherAsync(Guid teacherId);
}
