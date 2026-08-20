using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IProposalService
{
    Task<PagedResult<ProposalResponse>> GetProposalsAsync(int page, int pageSize, Guid? userId = null, Domain.Enums.ProposalStatus? status = null, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<ProposalResponse?> GetProposalByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<ProposalResponse> CreateProposalAsync(CreateProposalRequest request, Guid userId);
    Task<ProposalResponse?> UpdateProposalAsync(Guid id, UpdateProposalRequest request, Guid userId, string? userRole = null);
    Task<bool> DeleteProposalAsync(Guid id, Guid userId, string? userRole = null);
    Task<ProposalResponse?> ReviewProposalAsync(Guid id, ReviewProposalRequest request, Guid reviewerId);
}
