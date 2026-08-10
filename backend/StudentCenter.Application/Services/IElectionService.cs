using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IElectionService
{
    Task<PagedResult<ElectionResponse>> GetElectionsAsync(int page, int pageSize, Guid? currentUserId = null);
    Task<ElectionResponse?> GetElectionByIdAsync(Guid id, Guid? currentUserId = null);
    Task<ElectionResponse> CreateElectionAsync(CreateElectionRequest request, Guid userId);
    Task<ElectionResponse?> UpdateElectionAsync(Guid id, UpdateElectionRequest request, Guid userId, string userRole);
    Task<bool> DeleteElectionAsync(Guid id, Guid userId, string userRole);

    Task<ElectionCandidateResponse> AddCandidateAsync(Guid electionId, CreateCandidateRequest request, Guid userId, string userRole);
    Task<bool> RemoveCandidateAsync(Guid electionId, Guid candidateId, Guid userId, string userRole);

    Task<bool> OpenElectionAsync(Guid electionId, Guid userId, string userRole);
    Task<bool> CloseElectionAsync(Guid electionId, Guid userId, string userRole);
    Task<bool> PublishResultAsync(Guid electionId, Guid userId, string userRole);

    Task<bool> VoteAsync(Guid electionId, VoteRequest request, Guid voterUserId);
    Task<ElectionResultResponse?> GetResultAsync(Guid electionId);
    Task<bool> StartPemilosAsync(Guid electionId, StartPemilosRequest request, Guid userId, string userRole);
    Task<bool> StopPemilosAsync(Guid electionId, Guid userId, string userRole);
}
