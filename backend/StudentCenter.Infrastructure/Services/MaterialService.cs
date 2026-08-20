using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Interfaces;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class MaterialService : IMaterialService
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorageService;

    private readonly ILessonMaterialService _lessonMaterialService;

    public MaterialService(AppDbContext context, IFileStorageService fileStorageService, ILessonMaterialService? lessonMaterialService = null)
    {
        _context = context;
        _fileStorageService = fileStorageService;
        _lessonMaterialService = lessonMaterialService ?? new LessonMaterialService(context, fileStorageService: fileStorageService);
    }

    public async Task<PagedResult<MaterialResponse>> GetMaterialsAsync(
        int page,
        int pageSize,
        string? subject,
        string? grade,
        Guid? requestingUserId = null,
        string? userRole = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        // Unified authoritative query through LessonMaterialService
        var lessonMaterials = await _lessonMaterialService.GetAllAsync(null, null, false, requestingUserId, userRole);

        if (!string.IsNullOrWhiteSpace(subject))
        {
            lessonMaterials = lessonMaterials.Where(m =>
                string.Equals(m.SubjectName, subject, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(m.SubjectCode, subject, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(grade))
        {
            lessonMaterials = lessonMaterials.Where(m =>
                string.Equals(m.ClassName, grade, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        var totalCount = lessonMaterials.Count;
        var pagedItems = lessonMaterials
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(lm => new MaterialResponse
            {
                Id = lm.Id,
                Title = lm.Title,
                Description = lm.Description,
                FileUrl = lm.FileUrl ?? string.Empty,
                Subject = lm.SubjectName,
                Grade = lm.ClassName,
                UploadedAt = lm.CreatedAt,
                UpdatedAt = lm.UpdatedAt,
                UploadedByUserId = lm.TeacherId,
                UploadedByUserName = lm.TeacherName
            })
            .ToList();

        return new PagedResult<MaterialResponse>
        {
            Items = pagedItems,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<MaterialResponse?> GetMaterialByIdAsync(
        Guid id,
        Guid? requestingUserId = null,
        string? userRole = null)
    {
        var isStudent = string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase);
        var lm = await _lessonMaterialService.GetByIdAsync(id, isStudent, requestingUserId, userRole);
        if (lm == null) return null;

        return new MaterialResponse
        {
            Id = lm.Id,
            Title = lm.Title,
            Description = lm.Description,
            FileUrl = lm.FileUrl ?? string.Empty,
            Subject = lm.SubjectName,
            Grade = lm.ClassName,
            UploadedAt = lm.CreatedAt,
            UpdatedAt = lm.UpdatedAt,
            UploadedByUserId = lm.TeacherId,
            UploadedByUserName = lm.TeacherName
        };
    }

    public async Task<MaterialResponse> CreateMaterialAsync(CreateMaterialRequest request, Guid userId)
    {
        var material = new Material
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            FileUrl = request.FileUrl,
            Subject = request.Subject,
            Grade = request.Grade,
            UploadedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UploadedByUserId = userId
        };

        _context.Set<Material>().Add(material);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        var signedUrl = await _fileStorageService.CreateSignedUrlAsync(material.FileUrl);

        return new MaterialResponse
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            FileUrl = signedUrl,
            Subject = material.Subject,
            Grade = material.Grade,
            UploadedAt = material.UploadedAt,
            UpdatedAt = material.UpdatedAt,
            UploadedByUserId = material.UploadedByUserId,
            UploadedByUserName = user?.FullName ?? string.Empty
        };
    }

    public async Task<MaterialResponse?> UpdateMaterialAsync(Guid id, UpdateMaterialRequest request, Guid userId, string userRole)
    {
        var material = await _context.Set<Material>()
            .Include(m => m.UploadedByUser)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null)
            return null;

        if (userRole != "Admin" && material.UploadedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update your own materials.");

        material.Title = request.Title;
        material.Description = request.Description;
        material.FileUrl = request.FileUrl;
        material.Subject = request.Subject;
        material.Grade = request.Grade;
        material.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var signedUrl = await _fileStorageService.CreateSignedUrlAsync(material.FileUrl);

        return new MaterialResponse
        {
            Id = material.Id,
            Title = material.Title,
            Description = material.Description,
            FileUrl = signedUrl,
            Subject = material.Subject,
            Grade = material.Grade,
            UploadedAt = material.UploadedAt,
            UpdatedAt = material.UpdatedAt,
            UploadedByUserId = material.UploadedByUserId,
            UploadedByUserName = material.UploadedByUser.FullName
        };
    }

    public async Task<bool> DeleteMaterialAsync(Guid id, Guid userId, string userRole)
    {
        var material = await _context.Set<Material>()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null)
            return false;

        if (userRole != "Admin" && material.UploadedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own materials.");

        _context.Set<Material>().Remove(material);
        await _context.SaveChangesAsync();

        return true;
    }
}
