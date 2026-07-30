using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ProposalService : IProposalService
{
    private readonly AppDbContext _context;

    public ProposalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProposalResponse>> GetProposalsAsync(int page, int pageSize, Guid? userId = null, ProposalStatus? status = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Proposal>()
            .AsNoTracking()
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(p => p.SubmittedByUserId == userId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProposalResponse
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                FileUrl = p.FileUrl,
                Status = p.Status,
                RejectionReason = p.RejectionReason,
                SubmittedByUserId = p.SubmittedByUserId,
                SubmittedByUserName = p.SubmittedByUser.FullName,
                ReviewedByUserId = p.ReviewedByUserId,
                ReviewedByUserName = p.ReviewedByUser != null ? p.ReviewedByUser.FullName : null,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                ReviewedAt = p.ReviewedAt
            })
            .ToListAsync();

        return new PagedResult<ProposalResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ProposalResponse?> GetProposalByIdAsync(Guid id)
    {
        return await _context.Set<Proposal>()
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProposalResponse
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                FileUrl = p.FileUrl,
                Status = p.Status,
                RejectionReason = p.RejectionReason,
                SubmittedByUserId = p.SubmittedByUserId,
                SubmittedByUserName = p.SubmittedByUser.FullName,
                ReviewedByUserId = p.ReviewedByUserId,
                ReviewedByUserName = p.ReviewedByUser != null ? p.ReviewedByUser.FullName : null,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                ReviewedAt = p.ReviewedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ProposalResponse> CreateProposalAsync(CreateProposalRequest request, Guid userId)
    {
        var user = await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            throw new KeyNotFoundException("User not found.");

        if (user.Role != UserRole.OSIS)
            throw new InvalidOperationException("Only OSIS members can create proposals.");

        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            FileUrl = request.FileUrl,
            Status = ProposalStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<Proposal>().Add(proposal);
        await _context.SaveChangesAsync();

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            FileUrl = proposal.FileUrl,
            Status = proposal.Status,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = user.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt
        };
    }

    public async Task<ProposalResponse?> UpdateProposalAsync(Guid id, UpdateProposalRequest request, Guid userId)
    {
        var proposal = await _context.Set<Proposal>()
            .Include(p => p.SubmittedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return null;

        if (proposal.SubmittedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update your own proposals.");

        if (proposal.Status != ProposalStatus.Pending)
            throw new InvalidOperationException("Only pending proposals can be edited.");

        proposal.Title = request.Title;
        proposal.Description = request.Description;
        proposal.FileUrl = request.FileUrl;
        proposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            FileUrl = proposal.FileUrl,
            Status = proposal.Status,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = proposal.SubmittedByUser.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt
        };
    }

    public async Task<bool> DeleteProposalAsync(Guid id, Guid userId)
    {
        var proposal = await _context.Set<Proposal>()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return false;

        if (proposal.SubmittedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own proposals.");

        if (proposal.Status != ProposalStatus.Pending)
            throw new InvalidOperationException("Only pending proposals can be deleted.");

        _context.Set<Proposal>().Remove(proposal);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ProposalResponse?> ReviewProposalAsync(Guid id, ReviewProposalRequest request, Guid reviewerId)
    {
        var proposal = await _context.Set<Proposal>()
            .Include(p => p.SubmittedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return null;

        var reviewer = await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == reviewerId);

        if (reviewer is null)
            throw new KeyNotFoundException("Reviewer not found.");

        if (reviewer.Role != UserRole.Admin && reviewer.Role != UserRole.Teacher)
            throw new InvalidOperationException("Only Admin and Teacher can review proposals.");

        if (proposal.Status != ProposalStatus.Pending)
            throw new InvalidOperationException("Only pending proposals can be reviewed.");

        if (proposal.ReviewedByUserId.HasValue)
            throw new InvalidOperationException("This proposal has already been reviewed.");

        proposal.Status = request.Status;
        proposal.RejectionReason = request.Status == ProposalStatus.Rejected ? request.RejectionReason : null;
        proposal.ReviewedByUserId = reviewerId;
        proposal.ReviewedAt = DateTime.UtcNow;
        proposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var reviewerUser = reviewer;

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            FileUrl = proposal.FileUrl,
            Status = proposal.Status,
            RejectionReason = proposal.RejectionReason,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = proposal.SubmittedByUser.FullName,
            ReviewedByUserId = proposal.ReviewedByUserId,
            ReviewedByUserName = reviewerUser?.FullName ?? string.Empty,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt,
            ReviewedAt = proposal.ReviewedAt
        };
    }
}
