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

    public MaterialService(AppDbContext context, IFileStorageService fileStorageService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
    }

    public async Task<PagedResult<MaterialResponse>> GetMaterialsAsync(int page, int pageSize, string? subject, string? grade)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Material>()
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(subject))
        {
            query = query.Where(m => m.Subject == subject);
        }

        if (!string.IsNullOrWhiteSpace(grade))
        {
            query = query.Where(m => m.Grade == grade);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MaterialResponse
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                FileUrl = m.FileUrl,
                Subject = m.Subject,
                Grade = m.Grade,
                UploadedAt = m.UploadedAt,
                UpdatedAt = m.UpdatedAt,
                UploadedByUserId = m.UploadedByUserId,
                UploadedByUserName = m.UploadedByUser.FullName
            })
            .ToListAsync();

        foreach (var item in items)
        {
            if (!string.IsNullOrWhiteSpace(item.FileUrl))
            {
                item.FileUrl = await _fileStorageService.CreateSignedUrlAsync(item.FileUrl);
            }
        }

        return new PagedResult<MaterialResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<MaterialResponse?> GetMaterialByIdAsync(Guid id)
    {
        var item = await _context.Set<Material>()
            .AsNoTracking()
            .Where(m => m.Id == id)
            .Select(m => new MaterialResponse
            {
                Id = m.Id,
                Title = m.Title,
                Description = m.Description,
                FileUrl = m.FileUrl,
                Subject = m.Subject,
                Grade = m.Grade,
                UploadedAt = m.UploadedAt,
                UpdatedAt = m.UpdatedAt,
                UploadedByUserId = m.UploadedByUserId,
                UploadedByUserName = m.UploadedByUser.FullName
            })
            .FirstOrDefaultAsync();

        if (item != null && !string.IsNullOrWhiteSpace(item.FileUrl))
        {
            item.FileUrl = await _fileStorageService.CreateSignedUrlAsync(item.FileUrl);
        }

        return item;
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
