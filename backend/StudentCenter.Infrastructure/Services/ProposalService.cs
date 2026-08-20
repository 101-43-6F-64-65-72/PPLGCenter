using System.ComponentModel.DataAnnotations;
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
            var supervisedEkskulIds = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => (e.SupervisorTeacherId == teacherId || _context.ExtracurricularAdvisors.Any(a => a.TeacherId == teacherId && a.ExtracurricularId == e.Id)) && e.IsActive)
                .Select(e => e.Id)
                .ToListAsync();

            var supervisedEkskulNames = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => (e.SupervisorTeacherId == teacherId || _context.ExtracurricularAdvisors.Any(a => a.TeacherId == teacherId && a.ExtracurricularId == e.Id)) && e.IsActive)
                .Select(e => e.Name.ToLower())
                .ToListAsync();

            if (!supervisedEkskulIds.Any() && !supervisedEkskulNames.Any())
            {
                return new PagedResult<ProposalResponse>
                {
                    Items = new List<ProposalResponse>(),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = 0
                };
            }

            query = query.Where(p => (p.ExtracurricularId.HasValue && supervisedEkskulIds.Contains(p.ExtracurricularId.Value)) ||
                supervisedEkskulNames.Any(name =>
                (p.Category != null && p.Category.ToLower().Contains(name)) ||
                (p.Title != null && p.Title.ToLower().Contains(name))));
        }
        else if (requestingUserRole == "Student" && requestingUserId.HasValue)
        {
            // For students, strictly force query to proposals submitted by current student
            query = query.Where(p => p.SubmittedByUserId == requestingUserId.Value);
            userId = requestingUserId.Value;
        }

        if (userId.HasValue && requestingUserRole != "Student")
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
                ExtracurricularId = p.ExtracurricularId,
                ExtracurricularName = p.Extracurricular != null ? p.Extracurricular.Name : p.Category,
                FileUrl = p.FileUrl,
                Status = p.Status,
                TeacherComment = p.TeacherComment,
                AdminComment = p.AdminComment,
                RejectionReason = p.RejectionReason,
                SubmittedByUserId = p.SubmittedByUserId,
                SubmittedByUserName = p.SubmittedByUser != null ? p.SubmittedByUser.FullName : string.Empty,
                ReviewedByUserId = p.ReviewedByUserId,
                ReviewedByUserName = p.ReviewedByUser != null ? p.ReviewedByUser.FullName : null,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                ReviewedAt = p.ReviewedAt
            })
            .ToListAsync();

        var tasks = items
            .Where(item => !string.IsNullOrWhiteSpace(item.FileUrl))
            .Select(async item =>
            {
                item.FileUrl = await _fileStorageService.CreateSignedUrlAsync(item.FileUrl);
            });
        await Task.WhenAll(tasks);

        return new PagedResult<ProposalResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ProposalResponse?> GetProposalByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null)
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
                ExtracurricularId = p.ExtracurricularId,
                ExtracurricularName = p.Extracurricular != null ? p.Extracurricular.Name : p.Category,
                FileUrl = p.FileUrl,
                Status = p.Status,
                TeacherComment = p.TeacherComment,
                AdminComment = p.AdminComment,
                RejectionReason = p.RejectionReason,
                SubmittedByUserId = p.SubmittedByUserId,
                SubmittedByUserName = p.SubmittedByUser != null ? p.SubmittedByUser.FullName : string.Empty,
                ReviewedByUserId = p.ReviewedByUserId,
                ReviewedByUserName = p.ReviewedByUser != null ? p.ReviewedByUser.FullName : null,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                ReviewedAt = p.ReviewedAt
            })
            .FirstOrDefaultAsync();

        if (item == null)
            return null;

        // IDOR Enforcement: Students can only view their own proposal
        if (requestingUserRole == "Student" && requestingUserId.HasValue && item.SubmittedByUserId != requestingUserId.Value)
        {
            throw new UnauthorizedAccessException("You cannot access another student's proposal.");
        }

        // IDOR Enforcement: Teachers can only view proposals for extracurriculars they supervise
        if (requestingUserRole == "Teacher" && requestingUserId.HasValue)
        {
            var teacherId = requestingUserId.Value;
            var supervisedEkskulIds = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => (e.SupervisorTeacherId == teacherId || _context.ExtracurricularAdvisors.Any(a => a.TeacherId == teacherId && a.ExtracurricularId == e.Id)) && e.IsActive)
                .Select(e => e.Id)
                .ToListAsync();

            var supervisedEkskulNames = await _context.Extracurriculars
                .AsNoTracking()
                .Where(e => (e.SupervisorTeacherId == teacherId || _context.ExtracurricularAdvisors.Any(a => a.TeacherId == teacherId && a.ExtracurricularId == e.Id)) && e.IsActive)
                .Select(e => e.Name.ToLower())
                .ToListAsync();

            var propCat = (item.Category ?? string.Empty).ToLower();
            var propTitle = (item.Title ?? string.Empty).ToLower();

            bool isSupervisor = (item.ExtracurricularId.HasValue && supervisedEkskulIds.Contains(item.ExtracurricularId.Value)) ||
                supervisedEkskulNames.Any(name =>
                (!string.IsNullOrEmpty(propCat) && (propCat == name || propCat.Contains(name))) ||
                (!string.IsNullOrEmpty(propTitle) && propTitle.Contains(name))
            );

            if (!isSupervisor)
            {
                throw new UnauthorizedAccessException("Anda hanya dapat melihat proposal untuk ekstrakurikuler/organisasi yang Anda bina.");
            }
        }

        if (!string.IsNullOrWhiteSpace(item.FileUrl))
        {
            item.FileUrl = await _fileStorageService.CreateSignedUrlAsync(item.FileUrl);
        }

        return item;
    }

    public async Task<ProposalResponse> CreateProposalAsync(CreateProposalRequest request, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required and cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            throw new ValidationException("Description is required and cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.FileUrl))
        {
            throw new ValidationException("FileUrl (Proposal document) is required.");
        }

        if (request.ExtracurricularId.HasValue)
        {
            var ekskulExists = await _context.Extracurriculars
                .AsNoTracking()
                .AnyAsync(e => e.Id == request.ExtracurricularId.Value && e.IsActive);
            if (!ekskulExists)
            {
                throw new ValidationException("Extracurricular specified in proposal was not found or is inactive.");
            }
        }

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
            ExtracurricularId = request.ExtracurricularId,
            FileUrl = request.FileUrl ?? string.Empty,
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

            if (adminAndTeacherIds.Any())
            {
                await _notificationService.NotifyUsersAsync(
                    adminAndTeacherIds,
                    "Proposal Baru Diajukan",
                    $"{user.FullName} mengajukan proposal baru '{proposal.Title}'.",
                    NotificationType.ProposalSubmitted,
                    NotificationPriority.Normal,
                    proposal.Id.ToString(),
                    NotificationReferenceType.Proposal,
                    actionUrl: $"/proposal?id={proposal.Id}"
                );
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Proposal Notification Error] {ex.Message}");
        }

        string signedUrl = proposal.FileUrl;
        try
        {
            if (!string.IsNullOrWhiteSpace(proposal.FileUrl))
            {
                signedUrl = await _fileStorageService.CreateSignedUrlAsync(proposal.FileUrl);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Proposal SignedUrl Error] {ex.Message}");
        }

        return new ProposalResponse
        {
            Id = proposal.Id,
            Title = proposal.Title,
            Description = proposal.Description,
            Category = proposal.Category,
            ExtracurricularId = proposal.ExtracurricularId,
            ExtracurricularName = proposal.Category,
            FileUrl = signedUrl,
            Status = proposal.Status,
            SubmittedByUserId = proposal.SubmittedByUserId,
            SubmittedByUserName = user.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt
        };
    }

    public async Task<ProposalResponse?> UpdateProposalAsync(Guid id, UpdateProposalRequest request, Guid userId, string? userRole = null)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required and cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            throw new ValidationException("Description is required and cannot be empty.");
        }

        var proposal = await _context.Proposals
            .Include(p => p.SubmittedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return null;

        bool isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
        if (!isAdmin)
        {
            var requestingUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (requestingUser != null && requestingUser.Role == UserRole.Admin)
            {
                isAdmin = true;
            }
        }

        if (proposal.SubmittedByUserId != userId && !isAdmin)
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
            SubmittedByUserName = proposal.SubmittedByUser != null ? proposal.SubmittedByUser.FullName : string.Empty,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt
        };
    }

    public async Task<bool> DeleteProposalAsync(Guid id, Guid userId, string? userRole = null)
    {
        var proposal = await _context.Proposals
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal is null)
            return false;

        bool isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
        if (!isAdmin)
        {
            var requestingUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (requestingUser != null && requestingUser.Role == UserRole.Admin)
            {
                isAdmin = true;
            }
        }

        if (proposal.SubmittedByUserId != userId && !isAdmin)
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
            throw new UnauthorizedAccessException("Only Admin and Teacher can review proposals.");

        if ((request.Status == ProposalStatus.Rejected || request.Status == ProposalStatus.RevisionRequired)
            && string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            throw new ValidationException("A reason is required when rejecting or requesting revisions for a proposal.");
        }

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
                "Proposal Disetujui",
                $"Proposal Anda \"{proposal.Title}\" telah disetujui.",
                NotificationType.ProposalApproved,
                NotificationPriority.Normal,
                proposal.Id.ToString(),
                NotificationReferenceType.Proposal,
                actionUrl: $"/proposal?id={proposal.Id}"
            );
        }
        else if (request.Status == ProposalStatus.Rejected)
        {
            await _notificationService.NotifyUserAsync(
                proposal.SubmittedByUserId,
                "Proposal Ditolak",
                $"Proposal Anda \"{proposal.Title}\" telah ditolak. Alasan: {request.RejectionReason}",
                NotificationType.ProposalRejected,
                NotificationPriority.Normal,
                proposal.Id.ToString(),
                NotificationReferenceType.Proposal,
                actionUrl: $"/proposal?id={proposal.Id}"
            );
        }
        else if (request.Status == ProposalStatus.RevisionRequired)
        {
            await _notificationService.NotifyUserAsync(
                proposal.SubmittedByUserId,
                "Proposal Memerlukan Revisi",
                $"Proposal Anda \"{proposal.Title}\" memerlukan revisi.",
                NotificationType.ProposalRevisionRequested,
                NotificationPriority.Normal,
                proposal.Id.ToString(),
                NotificationReferenceType.Proposal,
                actionUrl: $"/proposal?id={proposal.Id}"
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
            SubmittedByUserName = proposal.SubmittedByUser != null ? proposal.SubmittedByUser.FullName : string.Empty,
            ReviewedByUserId = proposal.ReviewedByUserId,
            ReviewedByUserName = reviewer.FullName,
            CreatedAt = proposal.CreatedAt,
            UpdatedAt = proposal.UpdatedAt,
            ReviewedAt = proposal.ReviewedAt
        };
    }
}
