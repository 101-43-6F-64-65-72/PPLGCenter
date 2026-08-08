using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class OsisRecruitmentService : IOsisRecruitmentService
{
    private readonly AppDbContext _context;

    public OsisRecruitmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OsisPositionResponse>> GetPositionsAsync(Guid? academicYearId = null)
    {
        var query = _context.OsisPositions
            .AsNoTracking()
            .Include(p => p.AcademicYear)
            .Include(p => p.Applications)
            .AsQueryable();

        if (academicYearId.HasValue)
        {
            query = query.Where(p => p.AcademicYearId == academicYearId.Value);
        }

        var list = await query.OrderBy(p => p.Department).ThenBy(p => p.Title).ToListAsync();

        return list.Select(p => new OsisPositionResponse
        {
            Id = p.Id,
            AcademicYearId = p.AcademicYearId,
            AcademicYearName = p.AcademicYear?.Name ?? "Tahun Ajaran",
            Title = p.Title,
            Department = p.Department,
            Description = p.Description,
            Capacity = p.Capacity,
            FilledCount = p.Applications?.Count(a => a.Status == RecruitmentApplicationStatus.Approved) ?? 0,
            IsOpenForRecruitment = p.IsOpenForRecruitment,
            CreatedAt = p.CreatedAt
        }).ToList();
    }

    public async Task<OsisPositionResponse> CreatePositionAsync(CreateOsisPositionRequest request)
    {
        var academicYear = await _context.AcademicYears.FindAsync(request.AcademicYearId);
        if (academicYear is null) throw new KeyNotFoundException("Tahun Ajaran tidak ditemukan.");

        var position = new OsisPosition
        {
            Id = Guid.NewGuid(),
            AcademicYearId = request.AcademicYearId,
            Title = request.Title.Trim(),
            Department = request.Department.Trim(),
            Description = request.Description.Trim(),
            Capacity = request.Capacity,
            IsOpenForRecruitment = request.IsOpenForRecruitment,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.OsisPositions.Add(position);
        await _context.SaveChangesAsync();

        return new OsisPositionResponse
        {
            Id = position.Id,
            AcademicYearId = position.AcademicYearId,
            AcademicYearName = academicYear.Name,
            Title = position.Title,
            Department = position.Department,
            Description = position.Description,
            Capacity = position.Capacity,
            FilledCount = 0,
            IsOpenForRecruitment = position.IsOpenForRecruitment,
            CreatedAt = position.CreatedAt
        };
    }

    public async Task<bool> DeletePositionAsync(Guid id)
    {
        var position = await _context.OsisPositions.FindAsync(id);
        if (position is null) return false;

        _context.OsisPositions.Remove(position);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<OsisApplicationResponse>> GetApplicationsAsync(Guid? positionId = null, Guid? studentId = null)
    {
        var query = _context.OsisApplications
            .AsNoTracking()
            .Include(a => a.OsisPosition)
            .Include(a => a.ApplicantStudent)
                .ThenInclude(u => u.Class)
            .AsQueryable();

        if (positionId.HasValue) query = query.Where(a => a.OsisPositionId == positionId.Value);
        if (studentId.HasValue) query = query.Where(a => a.ApplicantStudentId == studentId.Value);

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();

        return list.Select(MapToApplicationResponse).ToList();
    }

    public async Task<OsisApplicationResponse> SubmitApplicationAsync(SubmitOsisApplicationRequest request, Guid studentId)
    {
        var position = await _context.OsisPositions.FindAsync(request.OsisPositionId);
        if (position is null || !position.IsOpenForRecruitment)
        {
            throw new InvalidOperationException("Posisi OSIS ini tidak dalam status pendaftaran terbuka.");
        }

        var existing = await _context.OsisApplications
            .FirstOrDefaultAsync(a => a.OsisPositionId == request.OsisPositionId && a.ApplicantStudentId == studentId);

        if (existing is not null)
        {
            throw new InvalidOperationException("Anda sudah mengajukan lamaran untuk posisi OSIS ini.");
        }

        var app = new OsisApplication
        {
            Id = Guid.NewGuid(),
            OsisPositionId = request.OsisPositionId,
            ApplicantStudentId = studentId,
            Motivation = request.Motivation.Trim(),
            PortfolioUrl = request.PortfolioUrl,
            Status = RecruitmentApplicationStatus.Submitted,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.OsisApplications.Add(app);
        await _context.SaveChangesAsync();

        return await GetApplicationByIdInternalAsync(app.Id);
    }

    public async Task<bool> ReviewApplicationByTeacherAsync(Guid applicationId, ReviewOsisApplicationRequest request, Guid teacherUserId)
    {
        var app = await _context.OsisApplications.FindAsync(applicationId);
        if (app is null) return false;

        app.Status = request.Status == RecruitmentApplicationStatus.Rejected
            ? RecruitmentApplicationStatus.Rejected
            : RecruitmentApplicationStatus.TeacherReviewed;

        app.TeacherReviewNotes = request.ReviewNotes;
        app.ReviewedAt = DateTime.UtcNow;
        app.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReviewApplicationByChairmanAsync(Guid applicationId, ReviewOsisApplicationRequest request, Guid chairmanUserId)
    {
        var app = await _context.OsisApplications.FindAsync(applicationId);
        if (app is null) return false;

        app.Status = request.Status == RecruitmentApplicationStatus.Rejected
            ? RecruitmentApplicationStatus.Rejected
            : RecruitmentApplicationStatus.ChairmanRecommended;

        app.ChairmanNotes = request.ReviewNotes;
        app.ReviewedAt = DateTime.UtcNow;
        app.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReviewApplicationByAdminAsync(Guid applicationId, ReviewOsisApplicationRequest request, Guid adminUserId)
    {
        var app = await _context.OsisApplications
            .Include(a => a.OsisPosition)
            .FirstOrDefaultAsync(a => a.Id == applicationId);

        if (app is null) return false;

        if (request.Status == RecruitmentApplicationStatus.Approved)
        {
            var approvedCount = await _context.OsisApplications
                .CountAsync(a => a.OsisPositionId == app.OsisPositionId && a.Status == RecruitmentApplicationStatus.Approved);

            if (approvedCount >= app.OsisPosition.Capacity)
            {
                throw new InvalidOperationException($"Kapasitas kuota untuk posisi '{app.OsisPosition.Title}' sudah penuh ({approvedCount}/{app.OsisPosition.Capacity}).");
            }

            app.Status = RecruitmentApplicationStatus.Approved;

            // Archive to OsisCabinetHistory
            var cabinetEntry = new OsisCabinetHistory
            {
                Id = Guid.NewGuid(),
                AcademicYearId = app.OsisPosition.AcademicYearId,
                StudentId = app.ApplicantStudentId,
                PositionTitle = app.OsisPosition.Title,
                Department = app.OsisPosition.Department,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.OsisCabinetHistories.Add(cabinetEntry);
        }
        else
        {
            app.Status = RecruitmentApplicationStatus.Rejected;
        }

        app.AdminNotes = request.ReviewNotes;
        app.ReviewedAt = DateTime.UtcNow;
        app.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<OsisCabinetMemberResponse>> GetCabinetStructureAsync(Guid? academicYearId = null)
    {
        var query = _context.OsisCabinetHistories
            .AsNoTracking()
            .Include(h => h.AcademicYear)
            .Include(h => h.Student)
            .AsQueryable();

        if (academicYearId.HasValue)
        {
            query = query.Where(h => h.AcademicYearId == academicYearId.Value);
        }
        else
        {
            var activeYear = await _context.AcademicYears.FirstOrDefaultAsync(y => y.IsActive);
            if (activeYear is not null)
            {
                query = query.Where(h => h.AcademicYearId == activeYear.Id);
            }
        }

        var list = await query.OrderBy(h => h.Department).ThenBy(h => h.PositionTitle).ToListAsync();

        return list.Select(h => new OsisCabinetMemberResponse
        {
            Id = h.Id,
            AcademicYearId = h.AcademicYearId,
            AcademicYearName = h.AcademicYear?.Name ?? "Tahun Ajaran",
            StudentId = h.StudentId,
            StudentName = h.Student?.FullName ?? "Pengurus",
            PositionTitle = h.PositionTitle,
            Department = h.Department,
            PhotoUrl = h.PhotoUrl,
            IsActive = h.IsActive
        }).ToList();
    }

    public async Task<OsisCabinetMemberResponse> AddCabinetMemberAsync(Guid academicYearId, Guid studentId, string positionTitle, string department, string? photoUrl)
    {
        var entry = new OsisCabinetHistory
        {
            Id = Guid.NewGuid(),
            AcademicYearId = academicYearId,
            StudentId = studentId,
            PositionTitle = positionTitle.Trim(),
            Department = department.Trim(),
            PhotoUrl = photoUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.OsisCabinetHistories.Add(entry);
        await _context.SaveChangesAsync();

        var student = await _context.Users.FindAsync(studentId);
        var year = await _context.AcademicYears.FindAsync(academicYearId);

        return new OsisCabinetMemberResponse
        {
            Id = entry.Id,
            AcademicYearId = academicYearId,
            AcademicYearName = year?.Name ?? "Tahun Ajaran",
            StudentId = studentId,
            StudentName = student?.FullName ?? "Pengurus",
            PositionTitle = entry.PositionTitle,
            Department = entry.Department,
            PhotoUrl = entry.PhotoUrl,
            IsActive = entry.IsActive
        };
    }

    private async Task<OsisApplicationResponse> GetApplicationByIdInternalAsync(Guid id)
    {
        var app = await _context.OsisApplications
            .AsNoTracking()
            .Include(a => a.OsisPosition)
            .Include(a => a.ApplicantStudent)
                .ThenInclude(u => u.Class)
            .FirstOrDefaultAsync(a => a.Id == id);

        return MapToApplicationResponse(app!);
    }

    private static OsisApplicationResponse MapToApplicationResponse(OsisApplication a)
    {
        return new OsisApplicationResponse
        {
            Id = a.Id,
            OsisPositionId = a.OsisPositionId,
            PositionTitle = a.OsisPosition?.Title ?? "Posisi OSIS",
            Department = a.OsisPosition?.Department ?? "BPH",
            ApplicantStudentId = a.ApplicantStudentId,
            ApplicantName = a.ApplicantStudent?.FullName ?? "Siswa",
            ApplicantNis = a.ApplicantStudent?.NIS,
            ApplicantClass = a.ApplicantStudent?.Class?.Name,
            Motivation = a.Motivation,
            PortfolioUrl = a.PortfolioUrl,
            Status = a.Status,
            TeacherReviewNotes = a.TeacherReviewNotes,
            ChairmanNotes = a.ChairmanNotes,
            AdminNotes = a.AdminNotes,
            ReviewedAt = a.ReviewedAt,
            CreatedAt = a.CreatedAt
        };
    }
}
