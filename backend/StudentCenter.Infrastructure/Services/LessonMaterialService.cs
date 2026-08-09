using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Interfaces;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class LessonMaterialService : ILessonMaterialService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IFileStorageService _fileStorageService;

    public LessonMaterialService(
        AppDbContext context,
        INotificationService? notificationService = null,
        IFileStorageService? fileStorageService = null)
    {
        _context = context;
        _notificationService = notificationService ?? new NotificationService(context);
        _fileStorageService = fileStorageService ?? new SupabaseStorageService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
    }

    public async Task<List<LessonMaterialResponse>> GetAllAsync(Guid? classSubjectId = null, string? visibility = null, bool includeDeleted = false)
    {
        var query = BuildMaterialQuery();

        if (!includeDeleted)
            query = query.Where(m => !m.IsDeleted);

        if (classSubjectId.HasValue)
            query = query.Where(m => m.ClassSubjectId == classSubjectId.Value);

        if (!string.IsNullOrWhiteSpace(visibility))
            query = query.Where(m => m.Visibility.ToLower() == visibility.Trim().ToLower());

        var list = await query.OrderBy(m => m.Order).ThenByDescending(m => m.CreatedAt).ToListAsync();
        var result = new List<LessonMaterialResponse>();
        foreach (var m in list)
        {
            result.Add(await MapToResponseAsync(m));
        }
        return result;
    }

    public async Task<LessonMaterialResponse?> GetByIdAsync(Guid id, bool isStudent = false)
    {
        var material = await BuildMaterialQuery().FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (material == null) return null;

        if (isStudent && !material.Visibility.Equals("Published", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Students can only view published lesson materials.");
        }

        return await MapToResponseAsync(material);
    }

    public async Task<LessonMaterialResponse> CreateAsync(Guid teacherId, CreateLessonMaterialRequest request)
    {
        var cs = await _context.ClassSubjects
            .AsNoTracking()
            .Include(c => c.TeacherSubject)
            .FirstOrDefaultAsync(c => c.Id == request.ClassSubjectId);

        if (cs == null) throw new ValidationException("ClassSubject not found.");

        if (cs.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized for this ClassSubject.");
            }
        }

        var material = new LessonMaterial
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = request.ClassSubjectId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            FileUrl = request.FileUrl?.Trim(),
            YoutubeUrl = request.YoutubeUrl?.Trim(),
            Order = request.Order > 0 ? request.Order : 1,
            Visibility = string.IsNullOrWhiteSpace(request.Visibility) ? "Published" : request.Visibility.Trim(),
            IsDeleted = false,
            Version = 1,
            CreatedBy = teacherId,
            UpdatedBy = teacherId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LessonMaterials.Add(material);
        await _context.SaveChangesAsync();

        if (material.Visibility.Equals("Published", StringComparison.OrdinalIgnoreCase))
        {
            var studentsInClass = await _context.Users
                .AsNoTracking()
                .Where(u => u.ClassId == cs.ClassId && u.Role == UserRole.Student && u.IsActive)
                .Select(u => u.Id)
                .ToListAsync();

            if (studentsInClass.Any())
            {
                var subjectName = cs.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran";
                await _notificationService.NotifyUsersAsync(
                    studentsInClass,
                    $"Materi Baru: {material.Title}",
                    $"Materi pembelajaran baru untuk {subjectName} telah dipublikasikan.",
                    NotificationType.MaterialPublished,
                    NotificationPriority.Normal,
                    material.Id.ToString(),
                    NotificationReferenceType.LessonMaterial,
                    $"/student/materials/{material.Id}",
                    "book-open",
                    "#10b981"
                );
            }
        }

        return (await GetByIdAsync(material.Id))!;
    }

    public async Task<LessonMaterialResponse?> UpdateAsync(Guid id, Guid teacherId, UpdateLessonMaterialRequest request)
    {
        var material = await _context.LessonMaterials
            .Include(m => m.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

        if (material == null) return null;

        if (material.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized for this ClassSubject.");
            }
        }

        var wasPublished = material.Visibility.Equals("Published", StringComparison.OrdinalIgnoreCase);

        material.Title = request.Title.Trim();
        material.Description = request.Description?.Trim();
        material.FileUrl = request.FileUrl?.Trim();
        material.YoutubeUrl = request.YoutubeUrl?.Trim();
        material.Order = request.Order > 0 ? request.Order : 1;
        material.Visibility = string.IsNullOrWhiteSpace(request.Visibility) ? material.Visibility : request.Visibility.Trim();
        material.Version += 1;
        material.UpdatedBy = teacherId;
        material.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var isNowPublished = material.Visibility.Equals("Published", StringComparison.OrdinalIgnoreCase);

        if (!wasPublished && isNowPublished)
        {
            var studentsInClass = await _context.Users
                .AsNoTracking()
                .Where(u => u.ClassId == material.ClassSubject.ClassId && u.Role == UserRole.Student && u.IsActive)
                .Select(u => u.Id)
                .ToListAsync();

            if (studentsInClass.Any())
            {
                var subjectName = material.ClassSubject?.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran";
                await _notificationService.NotifyUsersAsync(
                    studentsInClass,
                    $"Materi Dipublikasikan: {material.Title}",
                    $"Materi pembelajaran untuk {subjectName} telah dipublikasikan.",
                    NotificationType.MaterialPublished,
                    NotificationPriority.Normal,
                    material.Id.ToString(),
                    NotificationReferenceType.LessonMaterial,
                    $"/student/materials/{material.Id}",
                    "book-open",
                    "#10b981"
                );
            }
        }

        return await GetByIdAsync(id);
    }

    public async Task<bool> SoftDeleteAsync(Guid id, Guid teacherId)
    {
        var material = await _context.LessonMaterials
            .Include(m => m.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

        if (material == null) return false;

        if (material.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized for this ClassSubject.");
            }
        }

        material.IsDeleted = true;
        material.DeletedAt = DateTime.UtcNow;
        material.UpdatedBy = teacherId;
        material.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<LessonMaterialResponse>> GetStudentMaterialsAsync(Guid studentId)
    {
        var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);
        if (student?.ClassId == null) return new();

        var query = BuildMaterialQuery()
            .Where(m => !m.IsDeleted && m.Visibility.ToLower() == "published" && m.ClassSubject.ClassId == student.ClassId);

        var list = await query.OrderBy(m => m.Order).ThenByDescending(m => m.CreatedAt).ToListAsync();
        var result = new List<LessonMaterialResponse>();
        foreach (var m in list)
        {
            result.Add(await MapToResponseAsync(m));
        }
        return result;
    }

    public async Task<List<LessonMaterialResponse>> GetTeacherMaterialsAsync(Guid teacherId)
    {
        var query = BuildMaterialQuery()
            .Where(m => !m.IsDeleted && m.ClassSubject.TeacherSubject.TeacherId == teacherId);

        var list = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
        var result = new List<LessonMaterialResponse>();
        foreach (var m in list)
        {
            result.Add(await MapToResponseAsync(m));
        }
        return result;
    }

    private IQueryable<LessonMaterial> BuildMaterialQuery()
    {
        return _context.LessonMaterials
            .AsNoTracking()
            .Include(m => m.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .Include(m => m.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject)
            .Include(m => m.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Teacher);
    }

    private async Task<LessonMaterialResponse> MapToResponseAsync(LessonMaterial m)
    {
        var signedUrl = !string.IsNullOrWhiteSpace(m.FileUrl)
            ? await _fileStorageService.CreateSignedUrlAsync(m.FileUrl)
            : m.FileUrl;

        return new LessonMaterialResponse
        {
            Id = m.Id,
            ClassSubjectId = m.ClassSubjectId,
            ClassId = m.ClassSubject?.ClassId ?? Guid.Empty,
            ClassName = m.ClassSubject?.Class?.Name ?? string.Empty,
            SubjectId = m.ClassSubject?.TeacherSubject?.SubjectId ?? Guid.Empty,
            SubjectCode = m.ClassSubject?.TeacherSubject?.Subject?.Code ?? string.Empty,
            SubjectName = m.ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty,
            TeacherId = m.ClassSubject?.TeacherSubject?.TeacherId ?? Guid.Empty,
            TeacherName = m.ClassSubject?.TeacherSubject?.Teacher?.FullName ?? string.Empty,
            Title = m.Title,
            Description = m.Description,
            FileUrl = signedUrl,
            YoutubeUrl = m.YoutubeUrl,
            Order = m.Order,
            Visibility = m.Visibility,
            Version = m.Version,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt
        };
    }
}
