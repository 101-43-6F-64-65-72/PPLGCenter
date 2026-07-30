using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IProposalService
{
    Task<PagedResult<ProposalResponse>> GetProposalsAsync(int page, int pageSize, Guid? userId = null, Domain.Enums.ProposalStatus? status = null);
    Task<ProposalResponse?> GetProposalByIdAsync(Guid id);
    Task<ProposalResponse> CreateProposalAsync(CreateProposalRequest request, Guid userId);
    Task<ProposalResponse?> UpdateProposalAsync(Guid id, UpdateProposalRequest request, Guid userId);
    Task<bool> DeleteProposalAsync(Guid id, Guid userId);
    Task<ProposalResponse?> ReviewProposalAsync(Guid id, ReviewProposalRequest request, Guid reviewerId);
}
