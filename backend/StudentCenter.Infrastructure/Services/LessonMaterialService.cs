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

    public async Task<List<LessonMaterialResponse>> GetAllAsync(
        Guid? classSubjectId = null,
        string? visibility = null,
        bool includeDeleted = false,
        Guid? requestingUserId = null,
        string? userRole = null)
    {
        var query = BuildMaterialQuery();

        if (!includeDeleted)
            query = query.Where(m => !m.IsDeleted);

        if (classSubjectId.HasValue)
            query = query.Where(m => m.ClassSubjectId == classSubjectId.Value);

        var actualVisibility = userRole == "Student" ? "Published" : visibility;

        if (!includeDeleted)
            query = query.Where(m => !m.IsDeleted);

        if (classSubjectId.HasValue)
            query = query.Where(m => m.ClassSubjectId == classSubjectId.Value);

        if (!string.IsNullOrWhiteSpace(actualVisibility))
            query = query.Where(m => m.Visibility.ToLower() == actualVisibility.Trim().ToLower());

        if (requestingUserId.HasValue)
        {
            if (userRole == "Student")
            {
                var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId.Value);
                if (student?.ClassId != null)
                {
                    query = query.Where(m => m.ClassSubject.ClassId == student.ClassId);
                }
                else
                {
                    return new List<LessonMaterialResponse>();
                }
            }
            else if (userRole == "Teacher")
            {
                query = query.Where(m => m.ClassSubject.TeacherSubject.TeacherId == requestingUserId.Value);
            }
        }

        var list = await query.OrderBy(m => m.Order).ThenByDescending(m => m.CreatedAt).ToListAsync();
        var responses = await Task.WhenAll(list.Select(m => MapToResponseAsync(m)));
        return responses.ToList();
    }

    public async Task<LessonMaterialResponse?> GetByIdAsync(
        Guid id,
        bool isStudent = false,
        Guid? requestingUserId = null,
        string? userRole = null)
    {
        var material = await BuildMaterialQuery().FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (material == null) return null;

        if (isStudent || userRole == "Student")
        {
            if (!material.Visibility.Equals("Published", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Students can only view published lesson materials.");
            }

            if (requestingUserId.HasValue)
            {
                var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId.Value);
                if (student?.ClassId != material.ClassSubject.ClassId)
                {
                    throw new UnauthorizedAccessException("Student is not authorized to view materials for this class.");
                }
            }
        }
        else if (userRole == "Teacher" && requestingUserId.HasValue)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId.Value);
            if (user?.Role != UserRole.Admin && material.ClassSubject.TeacherSubject.TeacherId != requestingUserId.Value)
            {
                throw new UnauthorizedAccessException("Teacher is not authorized to view materials outside their assigned scope.");
            }
        }

        return await MapToResponseAsync(material);
    }

    public async Task<LessonMaterialResponse> CreateAsync(Guid teacherId, CreateLessonMaterialRequest request)
    {
        ValidateMediaUrls(request.FileUrl, request.YoutubeUrl);

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
                throw new UnauthorizedAccessException("Teacher is not authorized for this ClassSubject.");
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
        ValidateMediaUrls(request.FileUrl, request.YoutubeUrl);

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
                throw new UnauthorizedAccessException("Teacher is not authorized for this ClassSubject.");
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
                throw new UnauthorizedAccessException("Teacher is not authorized for this ClassSubject.");
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
        var responses = await Task.WhenAll(list.Select(m => MapToResponseAsync(m)));
        return responses.ToList();
    }

    public async Task<List<LessonMaterialResponse>> GetTeacherMaterialsAsync(Guid teacherId)
    {
        var query = BuildMaterialQuery()
            .Where(m => !m.IsDeleted && m.ClassSubject.TeacherSubject.TeacherId == teacherId);

        var list = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
        var responses = await Task.WhenAll(list.Select(m => MapToResponseAsync(m)));
        return responses.ToList();
    }

    private static void ValidateMediaUrls(string? fileUrl, string? youtubeUrl)
    {
        if (!string.IsNullOrWhiteSpace(fileUrl))
        {
            var trimmed = fileUrl.Trim();
            if (trimmed.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("vbscript:", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Invalid or prohibited file URL protocol.");
            }

            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
            {
                if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
                {
                    throw new ValidationException("File URL must use http or https scheme.");
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(youtubeUrl))
        {
            var trimmed = youtubeUrl.Trim();
            if (trimmed.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("data:", StringComparison.OrdinalIgnoreCase) ||
                trimmed.StartsWith("vbscript:", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Invalid or prohibited YouTube URL protocol.");
            }

            if (Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
            {
                if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
                {
                    throw new ValidationException("YouTube URL must use http or https scheme.");
                }
            }
        }
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
