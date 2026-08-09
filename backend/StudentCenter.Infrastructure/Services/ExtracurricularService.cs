using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ExtracurricularService : IExtracurricularService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public ExtracurricularService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<PagedResult<ExtracurricularResponse>> GetExtracurricularsAsync(int page, int pageSize, string? category = null, bool? isActive = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Extracurriculars
            .AsNoTracking()
            .Include(e => e.ManagedByUser)
            .Include(e => e.SupervisorTeacher)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(e => e.Category.ToLower().Contains(category.ToLower()));
        }

        if (isActive.HasValue)
        {
            query = query.Where(e => e.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExtracurricularResponse
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                MaxMembers = e.MaxMembers,
                CurrentMembers = e.Members.Count(m => m.Status == "Active"),
                ScheduleDay = e.ScheduleDay,
                ScheduleTime = e.ScheduleTime,
                Location = e.Location,
                SupervisorTeacherId = e.SupervisorTeacherId,
                Supervisor = e.SupervisorTeacher == null ? null : new SupervisorTeacherResponse
                {
                    Id = e.SupervisorTeacher.Id,
                    Name = e.SupervisorTeacher.FullName,
                    NIP = e.SupervisorTeacher.NIP,
                    Email = e.SupervisorTeacher.Email,
                    PhotoUrl = e.SupervisorTeacher.PhotoUrl,
                    PhoneNumber = e.SupervisorTeacher.PhoneNumber
                },
                AdvisorName = e.SupervisorTeacher != null ? e.SupervisorTeacher.FullName : e.AdvisorName,
                AdvisorWhatsapp = e.SupervisorTeacher != null ? (e.SupervisorTeacher.PhoneNumber ?? e.AdvisorWhatsapp) : e.AdvisorWhatsapp,
                IsActive = e.IsActive,
                ManagedByUserId = e.ManagedByUserId,
                ManagedByUserName = e.ManagedByUser != null ? e.ManagedByUser.FullName : string.Empty,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<ExtracurricularResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResult<ExtracurricularResponse>> GetMyExtracurricularsAsync(Guid studentId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var myMemberEkskulIds = await _context.ExtracurricularMembers
            .AsNoTracking()
            .Where(m => m.StudentId == studentId && m.Status == "Active")
            .Select(m => m.ExtracurricularId)
            .ToListAsync();

        var query = _context.Extracurriculars
            .AsNoTracking()
            .Where(e => myMemberEkskulIds.Contains(e.Id));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ExtracurricularResponse
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                MaxMembers = e.MaxMembers,
                CurrentMembers = e.Members.Count(m => m.Status == "Active"),
                ScheduleDay = e.ScheduleDay,
                ScheduleTime = e.ScheduleTime,
                Location = e.Location,
                SupervisorTeacherId = e.SupervisorTeacherId,
                Supervisor = e.SupervisorTeacher == null ? null : new SupervisorTeacherResponse
                {
                    Id = e.SupervisorTeacher.Id,
                    Name = e.SupervisorTeacher.FullName,
                    NIP = e.SupervisorTeacher.NIP,
                    Email = e.SupervisorTeacher.Email,
                    PhotoUrl = e.SupervisorTeacher.PhotoUrl,
                    PhoneNumber = e.SupervisorTeacher.PhoneNumber
                },
                AdvisorName = e.SupervisorTeacher != null ? e.SupervisorTeacher.FullName : e.AdvisorName,
                AdvisorWhatsapp = e.SupervisorTeacher != null ? (e.SupervisorTeacher.PhoneNumber ?? e.AdvisorWhatsapp) : e.AdvisorWhatsapp,
                IsActive = e.IsActive,
                ManagedByUserId = e.ManagedByUserId,
                ManagedByUserName = e.ManagedByUser != null ? e.ManagedByUser.FullName : string.Empty,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<ExtracurricularResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ExtracurricularResponse?> GetExtracurricularByIdAsync(Guid id)
    {
        var e = await _context.Extracurriculars
            .AsNoTracking()
            .Include(e => e.ManagedByUser)
            .Include(e => e.SupervisorTeacher)
            .Include(e => e.Members)
            .FirstOrDefaultAsync(e => e.Id == id);

        return e == null ? null : MapToResponse(e);
    }

    public async Task<ExtracurricularResponse> CreateExtracurricularAsync(CreateExtracurricularRequest request, Guid managerId)
    {
        var manager = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == managerId);

        if (manager is null)
            throw new KeyNotFoundException("Manager tidak ditemukan.");

        if (manager.Role != UserRole.Admin && manager.Role != UserRole.Teacher)
            throw new InvalidOperationException("Hanya Admin atau Guru yang dapat membuat ekstrakurikuler.");

        User? supervisorTeacher = null;
        if (request.SupervisorTeacherId.HasValue)
        {
            supervisorTeacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.SupervisorTeacherId.Value && u.Role == UserRole.Teacher);
            if (supervisorTeacher == null)
            {
                throw new KeyNotFoundException("Guru Pembina yang dipilih tidak ditemukan atau bukan ber-role Guru.");
            }
        }

        var extracurricular = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            Category = request.Category.Trim(),
            MaxMembers = request.MaxMembers,
            ScheduleDay = request.ScheduleDay?.Trim(),
            ScheduleTime = request.ScheduleTime?.Trim(),
            Location = request.Location?.Trim(),
            SupervisorTeacherId = request.SupervisorTeacherId,
            SupervisorTeacher = supervisorTeacher,
            AdvisorName = supervisorTeacher != null ? supervisorTeacher.FullName : request.AdvisorName?.Trim(),
            AdvisorWhatsapp = supervisorTeacher != null ? (supervisorTeacher.PhoneNumber ?? request.AdvisorWhatsapp?.Trim()) : request.AdvisorWhatsapp?.Trim(),
            IsActive = true,
            RegistrationOpen = true,
            ManagedByUserId = managerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Extracurriculars.Add(extracurricular);

        // Sync ExtracurricularAdvisors table
        if (request.SupervisorTeacherId.HasValue)
        {
            _context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
            {
                Id = Guid.NewGuid(),
                TeacherId = request.SupervisorTeacherId.Value,
                ExtracurricularId = extracurricular.Id,
                AssignedDate = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        extracurricular.ManagedByUser = manager;
        return MapToResponse(extracurricular);
    }

    public async Task<ExtracurricularResponse?> UpdateExtracurricularAsync(Guid id, UpdateExtracurricularRequest request, Guid managerId)
    {
        var extracurricular = await _context.Extracurriculars
            .Include(e => e.ManagedByUser)
            .Include(e => e.SupervisorTeacher)
            .Include(e => e.Members)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (extracurricular is null)
            return null;

        bool isAuthorized = extracurricular.ManagedByUserId == managerId || extracurricular.SupervisorTeacherId == managerId;
        if (!isAuthorized)
        {
            isAuthorized = await _context.ExtracurricularAdvisors
                .AsNoTracking()
                .AnyAsync(a => a.ExtracurricularId == id && a.TeacherId == managerId);
        }

        if (!isAuthorized)
        {
            var manager = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (manager?.Role != UserRole.Admin)
                throw new UnauthorizedAccessException("Anda hanya dapat mengedit ekstrakurikuler yang Anda bina atau kelola.");
        }

        User? supervisorTeacher = null;
        if (request.SupervisorTeacherId.HasValue)
        {
            supervisorTeacher = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.SupervisorTeacherId.Value && u.Role == UserRole.Teacher);
            if (supervisorTeacher == null)
            {
                throw new KeyNotFoundException("Guru Pembina yang dipilih tidak ditemukan atau bukan ber-role Guru.");
            }
        }

        extracurricular.Name = request.Name.Trim();
        extracurricular.Description = request.Description.Trim();
        extracurricular.ImageUrl = request.ImageUrl?.Trim();
        extracurricular.Category = request.Category.Trim();
        extracurricular.MaxMembers = request.MaxMembers;
        extracurricular.ScheduleDay = request.ScheduleDay?.Trim();
        extracurricular.ScheduleTime = request.ScheduleTime?.Trim();
        extracurricular.Location = request.Location?.Trim();
        extracurricular.SupervisorTeacherId = request.SupervisorTeacherId;
        extracurricular.SupervisorTeacher = supervisorTeacher;
        extracurricular.AdvisorName = supervisorTeacher != null ? supervisorTeacher.FullName : request.AdvisorName?.Trim();
        extracurricular.AdvisorWhatsapp = supervisorTeacher != null ? (supervisorTeacher.PhoneNumber ?? request.AdvisorWhatsapp?.Trim()) : request.AdvisorWhatsapp?.Trim();
        extracurricular.IsActive = request.IsActive;
        extracurricular.UpdatedAt = DateTime.UtcNow;

        // Sync ExtracurricularAdvisors relation
        var existingAdvisors = await _context.ExtracurricularAdvisors
            .Where(a => a.ExtracurricularId == id)
            .ToListAsync();
        _context.ExtracurricularAdvisors.RemoveRange(existingAdvisors);

        if (request.SupervisorTeacherId.HasValue)
        {
            _context.ExtracurricularAdvisors.Add(new ExtracurricularAdvisor
            {
                Id = Guid.NewGuid(),
                TeacherId = request.SupervisorTeacherId.Value,
                ExtracurricularId = id,
                AssignedDate = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return MapToResponse(extracurricular);
    }

    public async Task<bool> DeleteExtracurricularAsync(Guid id, Guid managerId)
    {
        var extracurricular = await _context.Extracurriculars
            .FirstOrDefaultAsync(e => e.Id == id);

        if (extracurricular is null)
            return false;

        if (extracurricular.ManagedByUserId != managerId)
        {
            var manager = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == managerId);

            if (manager?.Role != UserRole.Admin)
                throw new UnauthorizedAccessException("Anda hanya dapat menghapus ekstrakurikuler yang Anda kelola.");
        }

        _context.Extracurriculars.Remove(extracurricular);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<ExtracurricularMemberResponse> JoinExtracurricularAsync(Guid extracurricularId, Guid studentId)
    {
        var extracurricular = await _context.Extracurriculars
            .FirstOrDefaultAsync(e => e.Id == extracurricularId);

        if (extracurricular is null)
            throw new KeyNotFoundException("Ekstrakurikuler tidak ditemukan.");

        if (!extracurricular.IsActive)
            throw new InvalidOperationException("Ekstrakurikuler ini tidak aktif.");

        if (!extracurricular.RegistrationOpen)
            throw new InvalidOperationException("Pendaftaran ekstrakurikuler ini sedang ditutup.");

        var student = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student is null)
            throw new KeyNotFoundException("Siswa tidak ditemukan.");

        if (student.Role != UserRole.Student)
            throw new InvalidOperationException("Hanya siswa yang dapat mendaftar ekstrakurikuler.");

        var existingMembership = await _context.ExtracurricularMembers
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.StudentId == studentId);

        if (existingMembership is not null && existingMembership.Status != "Removed")
            throw new InvalidOperationException("Siswa sudah terdaftar pada ekstrakurikuler ini.");

        var memberCount = await _context.ExtracurricularMembers
            .AsNoTracking()
            .CountAsync(m => m.ExtracurricularId == extracurricularId && m.Status != "Removed");

        if (memberCount >= extracurricular.MaxMembers)
            throw new InvalidOperationException("Ekstrakurikuler ini sudah mencapai batas maksimum kuota anggota.");

        ExtracurricularMember member;
        if (existingMembership != null)
        {
            member = existingMembership;
            member.Status = "Active";
            member.JoinedAt = DateTime.UtcNow;
            _context.ExtracurricularMembers.Update(member);
        }
        else
        {
            member = new ExtracurricularMember
            {
                Id = Guid.NewGuid(),
                ExtracurricularId = extracurricularId,
                StudentId = studentId,
                Status = "Active",
                JoinedAt = DateTime.UtcNow
            };
            _context.ExtracurricularMembers.Add(member);
        }

        await _context.SaveChangesAsync();

        await _notificationService.NotifyUserAsync(
            extracurricular.ManagedByUserId,
            "Anggota Ekskul Baru",
            $"{student.FullName} bergabung dengan ekstrakurikuler {extracurricular.Name}.",
            NotificationType.ExtracurricularRegistrationApproved,
            NotificationPriority.Normal,
            extracurricular.Id.ToString(),
            NotificationReferenceType.Extracurricular
        );

        return new ExtracurricularMemberResponse
        {
            Id = member.Id,
            ExtracurricularId = member.ExtracurricularId,
            StudentId = member.StudentId,
            StudentName = student.FullName,
            StudentEmail = student.Email,
            NIS = student.NIS,
            NISN = student.NISN,
            ClassName = student.Class?.Name,
            PhotoUrl = student.PhotoUrl,
            PhoneNumber = student.PhoneNumber,
            JoinedAt = member.JoinedAt
        };
    }

    public async Task<bool> LeaveExtracurricularAsync(Guid extracurricularId, Guid studentId)
    {
        var membership = await _context.ExtracurricularMembers
            .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.StudentId == studentId);

        if (membership is null)
            return false;

        membership.Status = "Removed";
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PagedResult<ExtracurricularMemberResponse>> GetExtracurricularMembersAsync(Guid extracurricularId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var extracurricular = await _context.Extracurriculars
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == extracurricularId);

        if (extracurricular is null)
            throw new KeyNotFoundException("Ekstrakurikuler tidak ditemukan.");

        var query = _context.ExtracurricularMembers
            .AsNoTracking()
            .Include(m => m.Student)
                .ThenInclude(s => s.Class)
            .Where(m => m.ExtracurricularId == extracurricularId && m.Status != "Removed");

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.JoinedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new ExtracurricularMemberResponse
            {
                Id = m.Id,
                ExtracurricularId = m.ExtracurricularId,
                StudentId = m.StudentId,
                StudentName = m.Student.FullName,
                StudentEmail = m.Student.Email,
                NIS = m.Student.NIS,
                NISN = m.Student.NISN,
                ClassName = m.Student.Class != null ? m.Student.Class.Name : null,
                PhotoUrl = m.Student.PhotoUrl,
                PhoneNumber = m.Student.PhoneNumber,
                JoinedAt = m.JoinedAt
            })
            .ToListAsync();

        return new PagedResult<ExtracurricularMemberResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<bool> UpdateMemberStatusAsync(Guid extracurricularId, Guid memberId, string status, Guid reviewerId)
    {
        var member = await _context.ExtracurricularMembers
            .Include(m => m.Extracurricular)
            .Include(m => m.Student)
            .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.Id == memberId);

        if (member is null) return false;

        var reviewer = await _context.Users.FindAsync(reviewerId);
        if (reviewer == null || (reviewer.Role != UserRole.Admin && reviewer.Role != UserRole.Teacher))
            throw new UnauthorizedAccessException("Hanya Admin atau Guru pengampu yang dapat mengelola keanggotaan.");

        member.Status = status;
        await _context.SaveChangesAsync();

        if (status == "Active")
        {
            await _notificationService.NotifyUserAsync(
                member.StudentId,
                "Pendaftaran Ekskul Diterima",
                $"Pendaftaran Anda untuk {member.Extracurricular.Name} telah disetujui.",
                NotificationType.ExtracurricularRegistrationApproved,
                NotificationPriority.High,
                extracurricularId.ToString(),
                NotificationReferenceType.Extracurricular
            );
        }
        else if (status == "Removed")
        {
            await _notificationService.NotifyUserAsync(
                member.StudentId,
                "Status Keanggotaan Ekskul",
                $"Status Anda pada {member.Extracurricular.Name} telah diperbarui menjadi Dikeluarkan.",
                NotificationType.ExtracurricularRegistrationRejected,
                NotificationPriority.Normal,
                extracurricularId.ToString(),
                NotificationReferenceType.Extracurricular
            );
        }

        return true;
    }

    private static ExtracurricularResponse MapToResponse(Extracurricular e)
    {
        var currentMemberCount = e.Members != null ? e.Members.Count(m => m.Status != "Removed") : 0;
        var supervisorTeacher = e.SupervisorTeacher;

        return new ExtracurricularResponse
        {
            Id = e.Id,
            Name = e.Name,
            Description = e.Description,
            ImageUrl = e.ImageUrl,
            Category = e.Category,
            MaxMembers = e.MaxMembers,
            CurrentMembers = currentMemberCount,
            ScheduleDay = e.ScheduleDay,
            ScheduleTime = e.ScheduleTime,
            Location = e.Location,
            SupervisorTeacherId = e.SupervisorTeacherId,
            Supervisor = supervisorTeacher == null ? null : new SupervisorTeacherResponse
            {
                Id = supervisorTeacher.Id,
                Name = supervisorTeacher.FullName,
                NIP = supervisorTeacher.NIP,
                Email = supervisorTeacher.Email,
                PhotoUrl = supervisorTeacher.PhotoUrl,
                PhoneNumber = supervisorTeacher.PhoneNumber
            },
            AdvisorName = supervisorTeacher != null ? supervisorTeacher.FullName : e.AdvisorName,
            AdvisorWhatsapp = supervisorTeacher != null ? (supervisorTeacher.PhoneNumber ?? e.AdvisorWhatsapp) : e.AdvisorWhatsapp,
            IsActive = e.IsActive,
            ManagedByUserId = e.ManagedByUserId,
            ManagedByUserName = e.ManagedByUser?.FullName ?? string.Empty,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        };
    }

    public async Task<List<SupervisedExtracurricularSummary>> GetSupervisedByTeacherAsync(Guid teacherId)
    {
        // 1. Fetch all ekskul IDs supervised by this teacher (SupervisorTeacherId OR ExtracurricularAdvisors)
        var supervisorIds = await _context.Extracurriculars
            .AsNoTracking()
            .Where(e => e.SupervisorTeacherId == teacherId && e.IsActive)
            .Select(e => e.Id)
            .ToListAsync();

        var advisorIds = await _context.ExtracurricularAdvisors
            .AsNoTracking()
            .Where(a => a.TeacherId == teacherId && a.Extracurricular.IsActive)
            .Select(a => a.ExtracurricularId)
            .ToListAsync();

        var allIds = supervisorIds.Concat(advisorIds).Distinct().ToList();

        if (!allIds.Any())
            return new List<SupervisedExtracurricularSummary>();

        // 2. Fetch ekskul base data
        var ekskuls = await _context.Extracurriculars
            .AsNoTracking()
            .Where(e => allIds.Contains(e.Id))
            .ToListAsync();

        // 3. Batch-fetch member counts (Status != "Removed") grouped by ExtracurricularId
        var memberCounts = await _context.ExtracurricularMembers
            .AsNoTracking()
            .Where(m => allIds.Contains(m.ExtracurricularId) && m.Status != "Removed")
            .GroupBy(m => m.ExtracurricularId)
            .Select(g => new { ExtracurricularId = g.Key, Count = g.Count() })
            .ToListAsync();

        var memberCountDict = memberCounts.ToDictionary(x => x.ExtracurricularId, x => x.Count);

        // 4. Batch-fetch pending proposal counts matched by ekskul name (Category string match)
        //    This is the current mechanism; a proper FK (Proposal.ExtracurricularId) would be more reliable.
        var ekskulNames = ekskuls.Select(e => e.Name.ToLower()).ToList();
        var allPendingProposals = await _context.Proposals
            .AsNoTracking()
            .Where(p => p.Status == StudentCenter.Domain.Enums.ProposalStatus.Pending && p.Category != null)
            .Select(p => new { p.Id, Category = p.Category!.ToLower() })
            .ToListAsync();

        // 5. Batch-fetch completed reviews (proposals reviewed by this teacher)
        var allReviewedProposals = await _context.Proposals
            .AsNoTracking()
            .Where(p => p.ReviewedByUserId == teacherId && p.Category != null)
            .Select(p => new { p.Id, Category = p.Category!.ToLower() })
            .ToListAsync();

        // 6. Map to summary DTO
        return ekskuls.Select(e =>
        {
            var nameLower = e.Name.ToLower();
            var pendingCount = allPendingProposals.Count(p =>
                p.Category == nameLower || p.Category.Contains(nameLower));
            var reviewedCount = allReviewedProposals.Count(p =>
                p.Category == nameLower || p.Category.Contains(nameLower));

            return new SupervisedExtracurricularSummary
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                ImageUrl = e.ImageUrl,
                Category = e.Category,
                IsActive = e.IsActive,
                ScheduleDay = e.ScheduleDay,
                ScheduleTime = e.ScheduleTime,
                Location = e.Location,
                MemberCount = memberCountDict.TryGetValue(e.Id, out var mc) ? mc : 0,
                PendingProposalsCount = pendingCount,
                CompletedReviewCount = reviewedCount
            };
        }).OrderBy(e => e.Name).ToList();
    }
}

