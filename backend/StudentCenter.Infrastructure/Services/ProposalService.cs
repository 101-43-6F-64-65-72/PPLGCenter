using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

using StudentCenter.Application.Interfaces;

namespace StudentCenter.Infrastructure.Services;

public class ProposalService : IProposalService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IFileStorageService _fileStorageService;

    public ProposalService(
        AppDbContext context,
        INotificationService notificationService,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _notificationService = notificationService;
        _fileStorageService = fileStorageService;
    }

    public async Task<PagedResult<ProposalResponse>> GetProposalsAsync(int page, int pageSize, Guid? userId = null, ProposalStatus? status = null, Guid? requestingUserId = null, string? requestingUserRole = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Proposals
            .AsNoTracking()
            .AsQueryable();

        // 1. Role-based Security Filtering
        if (requestingUserRole == "Teacher" && requestingUserId.HasValue)
        {
            var teacherId = requestingUserId.Value;
            var supervisedEkskulNames = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => e.SupervisorTeacherId == teacherId && e.IsActive)
                .Select(e => e.Name.ToLower())
                .ToListAsync();

            var advisorEkskulNames = await _context.ExtracurricularAdvisors
                .AsNoTracking()
                .Where(a => a.TeacherId == teacherId && a.Extracurricular.IsActive)
                .Select(a => a.Extracurricular.Name.ToLower())
                .ToListAsync();

            var allSupervisedNames = supervisedEkskulNames.Concat(advisorEkskulNames).Distinct().ToList();

            if (!allSupervisedNames.Any())
            {
                return new PagedResult<ProposalResponse>
                {
                    Items = new List<ProposalResponse>(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = 0
                };
            }

            var candidateProposals = await _context.Proposals
                .AsNoTracking()
                .Select(p => new { p.Id, Category = p.Category ?? string.Empty, Title = p.Title ?? string.Empty })
                .ToListAsync();

            var matchingIds = candidateProposals
                .Where(p => allSupervisedNames.Any(name =>
                    p.Category.ToLower().Contains(name) || p.Title.ToLower().Contains(name)))
                .Select(p => p.Id)
                .ToList();

            query = query.Where(p => matchingIds.Contains(p.Id));
        }
        else if (requestingUserRole == "Student" && requestingUserId.HasValue)
        {
            query = query.Where(p => p.SubmittedByUserId == requestingUserId.Value);
        }

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
                Category = p.Category,
                FileUrl = p.FileUrl,
                Status = p.Status,
                TeacherComment = p.TeacherComment,
                AdminComment = p.AdminComment,
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

        foreach (var item in items)
        {
            if (!string.IsNullOrWhiteSpace(item.FileUrl))
            {
                item.FileUrl = await _fileStorageService.CreateSignedUrlAsync(item.FileUrl);
            }
        }

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
        var item = await _context.Proposals
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProposalResponse
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Category = p.Category,
                FileUrl = p.FileUrl,
                Status = p.Status,
                TeacherComment = p.TeacherComment,
                AdminComment = p.AdminComment,
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

        if (item != null && !string.IsNullOrWhiteSpace(item.FileUrl))
        {
            item.FileUrl = await _fileStorageService.CreateSignedUrlAsync(item.FileUrl);
        }

        return item;
    }

    public async Task<ProposalResponse> CreateProposalAsync(CreateProposalRequest request, Guid userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            throw new KeyNotFoundException("User not found.");

        if (user.Role == UserRole.Admin || user.Role == UserRole.Teacher)
            throw new InvalidOperationException("Admin dan Guru tidak dapat mengajukan proposal dari modul Proposal.");

        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category?.Trim(),
            FileUrl = request.FileUrl,
            Status = ProposalStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Proposals.Add(proposal);
        await _context.SaveChangesAsync();

        // Notify admins and teachers about new proposal safely
        try
        {
            var adminAndTeacherIds = await _context.Users
                .AsNoTracking()
                .Where(u => u.IsActive && (u.Role == UserRole.Admin || u.Role == UserRole.Teacher))
                .Select(u => u.Id)
                .ToListAsync();

            foreach (var recipientId in adminAndTeacherIds)
            {
                await _notificationService.NotifyUserAsync(
                    recipientId,
                    "Proposal Baru Diajukan",
                    $"{user.FullName} mengajukan proposal baru '{proposal.Title}'.",
                    NotificationType.ProposalSubmitted,
                    NotificationPriority.Normal,
                    proposal.Id.ToString(),
                    NotificationReferenceType.Proposal
                );
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Proposal Notification Error] {ex.Message}");
        }

        var signedUrl = await _fileStorageService.CreateSignedUrlAsync(proposal.FileUrl);

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            Category = proposal.Category,
            FileUrl = signedUrl,
            Status = proposal.Status,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = user.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt
        };
    }

    public async Task<ProposalResponse?> UpdateProposalAsync(Guid id, UpdateProposalRequest request, Guid userId)
    {
        var proposal = await _context.Proposals
            .Include(p => p.SubmittedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return null;

        if (proposal.SubmittedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update your own proposals.");

        if (proposal.Status != ProposalStatus.Pending && proposal.Status != ProposalStatus.RevisionRequired)
            throw new InvalidOperationException("Only pending proposals can be edited.");

        proposal.Title = request.Title.Trim();
        proposal.Description = request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.Category)) proposal.Category = request.Category.Trim();
        if (!string.IsNullOrWhiteSpace(request.FileUrl)) proposal.FileUrl = request.FileUrl;
        
        if (proposal.Status == ProposalStatus.RevisionRequired)
        {
            proposal.Status = ProposalStatus.Pending;
        }

        proposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updatedSignedUrl = await _fileStorageService.CreateSignedUrlAsync(proposal.FileUrl);

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            Category = proposal.Category,
            FileUrl = updatedSignedUrl,
            Status = proposal.Status,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = proposal.SubmittedByUser.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt
        };
    }

    public async Task<bool> DeleteProposalAsync(Guid id, Guid userId)
    {
        var proposal = await _context.Proposals
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return false;

        if (proposal.SubmittedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own proposals.");

        if (proposal.Status != ProposalStatus.Pending && proposal.Status != ProposalStatus.RevisionRequired)
            throw new InvalidOperationException("Only pending proposals can be deleted.");

        _context.Proposals.Remove(proposal);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ProposalResponse?> ReviewProposalAsync(Guid id, ReviewProposalRequest request, Guid reviewerId)
    {
        var proposal = await _context.Proposals
            .Include(p => p.SubmittedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return null;

        var reviewer = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == reviewerId);

        if (reviewer is null)
            throw new KeyNotFoundException("Reviewer not found.");

        if (reviewer.Role != UserRole.Admin && reviewer.Role != UserRole.Teacher)
            throw new InvalidOperationException("Only Admin and Teacher can review proposals.");

        if (reviewer.Role == UserRole.Teacher)
        {
            var propCat = (proposal.Category ?? string.Empty).ToLower();
            var propTitle = (proposal.Title ?? string.Empty).ToLower();

            var supervisedEkskulNames = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => (e.SupervisorTeacherId == reviewerId || _context.ExtracurricularAdvisors.Any(a => a.TeacherId == reviewerId && a.ExtracurricularId == e.Id)) && e.IsActive)
                .Select(e => e.Name.ToLower())
                .ToListAsync();

            bool isSupervisorForThisProposal = supervisedEkskulNames.Any(name =>
                (!string.IsNullOrEmpty(propCat) && (propCat == name || propCat.Contains(name))) ||
                (!string.IsNullOrEmpty(propTitle) && propTitle.Contains(name))
            );

            if (!isSupervisorForThisProposal)
                throw new UnauthorizedAccessException("Anda hanya dapat me-review proposal untuk ekstrakurikuler/organisasi yang Anda bina.");
        }


        proposal.Status = request.Status;
        if (reviewer.Role == UserRole.Teacher)
        {
            proposal.TeacherComment = request.RejectionReason;
        }
        else
        {
            proposal.AdminComment = request.RejectionReason;
        }

        proposal.ReviewedByUserId = reviewerId;
        proposal.ReviewedAt = DateTime.UtcNow;
        proposal.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (request.Status == ProposalStatus.Approved)
        {
            await _notificationService.NotifyUserAsync(
                proposal.SubmittedByUserId,
                "Proposal Approved",
                $"Your proposal \"{proposal.Title}\" has been approved.",
                NotificationType.Proposal,
                proposal.Id.ToString(),
                "Proposal"
            );
        }
        else if (request.Status == ProposalStatus.Rejected)
        {
            await _notificationService.NotifyUserAsync(
                proposal.SubmittedByUserId,
                "Proposal Rejected",
                $"Your proposal \"{proposal.Title}\" has been rejected. Reason: {request.RejectionReason}",
                NotificationType.Proposal,
                proposal.Id.ToString(),
                "Proposal"
            );
        }
        else if (request.Status == ProposalStatus.RevisionRequired)
        {
            await _notificationService.NotifyUserAsync(
                proposal.SubmittedByUserId,
                "Proposal Revision Requested",
                $"Your proposal \"{proposal.Title}\" requires revision.",
                NotificationType.ProposalRevisionRequested,
                proposal.Id.ToString(),
                "Proposal"
            );
        }

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            Category = proposal.Category,
            FileUrl = proposal.FileUrl,
            Status = proposal.Status,
            TeacherComment = proposal.TeacherComment,
            AdminComment = proposal.AdminComment,
            RejectionReason = proposal.RejectionReason,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = proposal.SubmittedByUser.FullName,
            ReviewedByUserId = proposal.ReviewedByUserId,
            ReviewedByUserName = reviewer.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt,
            ReviewedAt = proposal.ReviewedAt
        };
    }
}
