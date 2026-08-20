using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Application.Helpers;
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
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ValidationException("Nama ekstrakurikuler wajib diisi.");
        if (string.IsNullOrWhiteSpace(request.Category))
            throw new ValidationException("Kategori ekstrakurikuler wajib diisi.");
        if (request.MaxMembers <= 0)
            throw new ValidationException("Maksimum anggota harus lebih besar dari 0.");

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
            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.SupervisorTeacherId.Value);
            if (targetUser == null)
            {
                throw new KeyNotFoundException("Guru Pembina yang dipilih tidak ditemukan.");
            }
            if (targetUser.Role != UserRole.Teacher)
            {
                throw new ValidationException("Guru Pembina yang dipilih harus ber-role Guru.");
            }
            supervisorTeacher = targetUser;
        }

        var extracurricular = new Extracurricular
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
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
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ValidationException("Nama ekstrakurikuler wajib diisi.");
        if (string.IsNullOrWhiteSpace(request.Category))
            throw new ValidationException("Kategori ekstrakurikuler wajib diisi.");
        if (request.MaxMembers <= 0)
            throw new ValidationException("Maksimum anggota harus lebih besar dari 0.");

        var extracurricular = await _context.Extracurriculars
            .Include(e => e.ManagedByUser)
            .Include(e => e.SupervisorTeacher)
            .Include(e => e.Members)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (extracurricular is null)
            return null;

        var manager = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == managerId);

        if (manager is not null && manager.Role == UserRole.Student)
        {
            throw new UnauthorizedAccessException("Siswa tidak memiliki akses untuk mengubah data ekstrakurikuler.");
        }

        bool isAdmin = manager?.Role == UserRole.Admin;
        if (!isAdmin)
        {
            bool isAuthorized = extracurricular.ManagedByUserId == managerId || extracurricular.SupervisorTeacherId == managerId;
            if (!isAuthorized)
            {
                isAuthorized = await _context.ExtracurricularAdvisors
                    .AsNoTracking()
                    .AnyAsync(a => a.ExtracurricularId == id && a.TeacherId == managerId);
            }

            if (!isAuthorized)
            {
                throw new UnauthorizedAccessException("Anda hanya dapat mengedit ekstrakurikuler yang Anda bina atau kelola.");
            }
        }

        User? supervisorTeacher = null;
        if (request.SupervisorTeacherId.HasValue)
        {
            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.SupervisorTeacherId.Value);
            if (targetUser == null)
            {
                throw new KeyNotFoundException("Guru Pembina yang dipilih tidak ditemukan.");
            }
            if (targetUser.Role != UserRole.Teacher)
            {
                throw new ValidationException("Guru Pembina yang dipilih harus ber-role Guru.");
            }
            supervisorTeacher = targetUser;
        }

        extracurricular.Name = request.Name.Trim();
        extracurricular.Description = request.Description?.Trim() ?? string.Empty;
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
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;
        if (_context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
        {
            transaction = await _context.Database.BeginTransactionAsync();
        }

        try
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
                .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.StudentId == studentId);

            if (existingMembership is not null && existingMembership.Status != "Removed")
                throw new InvalidOperationException("Siswa sudah terdaftar pada ekstrakurikuler ini.");

            var memberCount = await _context.ExtracurricularMembers
                .CountAsync(m => m.ExtracurricularId == extracurricularId && m.Status != "Removed");

            if (memberCount >= extracurricular.MaxMembers)
                throw new InvalidOperationException("Ekstrakurikuler ini sudah mencapai batas maksimum kuota anggota.");

            ExtracurricularMember member;
            if (existingMembership != null)
            {
                member = existingMembership;
                member.Status = "Pending";
                member.Position = ExtracurricularMemberPosition.Member; // Reset position on rejoin
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
                    Status = "Pending",
                    Position = ExtracurricularMemberPosition.Member,
                    JoinedAt = DateTime.UtcNow
                };
                _context.ExtracurricularMembers.Add(member);
            }

            await _context.SaveChangesAsync();
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            await _notificationService.NotifyUserAsync(
                extracurricular.ManagedByUserId,
                "Pengajuan Pendaftaran Ekskul",
                $"{student.FullName} mengajukan pendaftaran ke {extracurricular.Name}. Membutuhkan persetujuan Guru Pembina.",
                NotificationType.ExtracurricularRegistrationApproved,
                NotificationPriority.Normal,
                extracurricular.Id.ToString(),
                NotificationReferenceType.Extracurricular,
                actionUrl: $"/ekstrakurikuler/{extracurricular.Id}"
            );

            if (extracurricular.SupervisorTeacherId.HasValue && extracurricular.SupervisorTeacherId.Value != extracurricular.ManagedByUserId)
            {
                await _notificationService.NotifyUserAsync(
                    extracurricular.SupervisorTeacherId.Value,
                    "Pengajuan Pendaftaran Ekskul",
                    $"{student.FullName} mengajukan pendaftaran ke {extracurricular.Name}. Membutuhkan persetujuan Anda.",
                    NotificationType.ExtracurricularRegistrationApproved,
                    NotificationPriority.Normal,
                    extracurricular.Id.ToString(),
                    NotificationReferenceType.Extracurricular,
                    actionUrl: $"/ekstrakurikuler/{extracurricular.Id}"
                );
            }

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
                Status = member.Status,
                Position = member.Position.ToString(),
                JoinedAt = member.JoinedAt
            };
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync();
            }
            throw;
        }
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
                Status = m.Status,
                Position = m.Position.ToString(),
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
        var validStatuses = new[] { "Pending", "Active", "Removed" };
        var matchedStatus = validStatuses.FirstOrDefault(s => string.Equals(s, status?.Trim(), StringComparison.OrdinalIgnoreCase));

        if (matchedStatus is null)
        {
            throw new ValidationException("Status keanggotaan tidak valid. Gunakan 'Pending', 'Active', atau 'Removed'.");
        }

        var member = await _context.ExtracurricularMembers
            .Include(m => m.Extracurricular)
            .Include(m => m.Student)
            .FirstOrDefaultAsync(m => m.ExtracurricularId == extracurricularId && m.Id == memberId);

        if (member is null) return false;

        var reviewer = await _context.Users.FindAsync(reviewerId);
        if (reviewer == null || reviewer.Role == UserRole.Student)
        {
            throw new UnauthorizedAccessException("Siswa tidak memiliki akses untuk mengelola keanggotaan.");
        }

        if (reviewer.Role != UserRole.Admin)
        {
            bool isAuthorized = member.Extracurricular.SupervisorTeacherId == reviewerId ||
                               member.Extracurricular.ManagedByUserId == reviewerId;

            if (!isAuthorized)
            {
                isAuthorized = await _context.ExtracurricularAdvisors
                    .AsNoTracking()
                    .AnyAsync(a => a.ExtracurricularId == extracurricularId && a.TeacherId == reviewerId);
            }

            if (!isAuthorized)
            {
                throw new UnauthorizedAccessException("Anda tidak memiliki wewenang untuk mengelola anggota ekstrakurikuler ini.");
            }
        }

        member.Status = matchedStatus;
        await _context.SaveChangesAsync();

        if (matchedStatus == "Active")
        {
            await _notificationService.NotifyUserAsync(
                member.StudentId,
                "Pendaftaran Ekskul Diterima",
                $"Selamat! Pendaftaran Anda untuk {member.Extracurricular.Name} telah disetujui.",
                NotificationType.ExtracurricularRegistrationApproved,
                NotificationPriority.High,
                extracurricularId.ToString(),
                NotificationReferenceType.Extracurricular,
                actionUrl: $"/ekstrakurikuler/{extracurricularId}"
            );
        }
        else if (matchedStatus == "Removed")
        {
            await _notificationService.NotifyUserAsync(
                member.StudentId,
                "Status Keanggotaan Ekskul",
                $"Status Anda pada {member.Extracurricular.Name} telah diperbarui menjadi Dikeluarkan.",
                NotificationType.ExtracurricularRegistrationRejected,
                NotificationPriority.Normal,
                extracurricularId.ToString(),
                NotificationReferenceType.Extracurricular,
                actionUrl: $"/ekstrakurikuler/{extracurricularId}"
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
            ImageUrl = FileUrlHelper.ResolveUrl(e.ImageUrl),
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
                PhotoUrl = FileUrlHelper.ResolveUrl(supervisorTeacher.PhotoUrl),
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

        // 4. Batch-fetch pending proposal counts matched by ekskul name (Exact Category string match)
        var allPendingProposals = await _context.Proposals
            .AsNoTracking()
            .Where(p => p.Status == StudentCenter.Domain.Enums.ProposalStatus.Pending && p.Category != null)
            .Select(p => new { p.Id, Category = p.Category!.Trim().ToLower() })
            .ToListAsync();

        // 5. Batch-fetch completed reviews (proposals reviewed by this teacher)
        var allReviewedProposals = await _context.Proposals
            .AsNoTracking()
            .Where(p => p.ReviewedByUserId == teacherId && p.Category != null)
            .Select(p => new { p.Id, Category = p.Category!.Trim().ToLower() })
            .ToListAsync();

        // 6. Map to summary DTO
        return ekskuls.Select(e =>
        {
            var nameTrimmed = e.Name.Trim().ToLower();
            var pendingCount = allPendingProposals.Count(p => p.Category == nameTrimmed);
            var reviewedCount = allReviewedProposals.Count(p => p.Category == nameTrimmed);

            return new SupervisedExtracurricularSummary
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                ImageUrl = FileUrlHelper.ResolveUrl(e.ImageUrl),
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

