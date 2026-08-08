using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AssessmentService : IAssessmentService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AssessmentService(AppDbContext context, INotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService ?? new NotificationService(context);
    }

    #region GradeCategory CRUD

    public async Task<List<GradeCategoryResponse>> GetAllCategoriesAsync()
    {
        var list = await _context.GradeCategories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .ToListAsync();

        return list.Select(MapToCategoryResponse).ToList();
    }

    public async Task<GradeCategoryResponse?> GetCategoryByIdAsync(Guid id)
    {
        var cat = await _context.GradeCategories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        return cat == null ? null : MapToCategoryResponse(cat);
    }

    public async Task<GradeCategoryResponse> CreateCategoryAsync(CreateGradeCategoryRequest request)
    {
        var nameTrim = request.Name.Trim();
        if (await _context.GradeCategories.AnyAsync(c => c.Name.ToLower() == nameTrim.ToLower()))
        {
            throw new ValidationException($"Grade category '{nameTrim}' already exists.");
        }

        var entity = new GradeCategory
        {
            Id = Guid.NewGuid(),
            Name = nameTrim,
            Description = request.Description?.Trim(),
            Weight = request.Weight,
            Type = request.Type,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.GradeCategories.Add(entity);
        await _context.SaveChangesAsync();

        return MapToCategoryResponse(entity);
    }

    public async Task<GradeCategoryResponse?> UpdateCategoryAsync(Guid id, UpdateGradeCategoryRequest request)
    {
        var entity = await _context.GradeCategories.FindAsync(id);
        if (entity == null) return null;

        var nameTrim = request.Name.Trim();
        if (await _context.GradeCategories.AnyAsync(c => c.Id != id && c.Name.ToLower() == nameTrim.ToLower()))
        {
            throw new ValidationException($"Grade category '{nameTrim}' already exists.");
        }

        entity.Name = nameTrim;
        entity.Description = request.Description?.Trim();
        entity.Weight = request.Weight;
        entity.Type = request.Type;
        entity.IsActive = request.IsActive;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToCategoryResponse(entity);
    }

    public async Task<bool> DeleteCategoryAsync(Guid id)
    {
        var entity = await _context.GradeCategories
            .Include(c => c.Assessments)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (entity == null) return false;

        if (entity.Assessments.Any())
        {
            throw new ValidationException("Cannot delete category with associated assessments.");
        }

        _context.GradeCategories.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    #endregion

    #region Assessment CRUD

    public async Task<List<AssessmentResponse>> GetAssessmentsAsync(Guid? classSubjectId = null, Guid? teacherId = null, Guid? categoryId = null)
    {
        var query = BuildAssessmentQuery();

        if (classSubjectId.HasValue)
            query = query.Where(a => a.ClassSubjectId == classSubjectId.Value);

        if (teacherId.HasValue)
            query = query.Where(a => a.TeacherId == teacherId.Value);

        if (categoryId.HasValue)
            query = query.Where(a => a.GradeCategoryId == categoryId.Value);

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return list.Select(MapToAssessmentResponse).ToList();
    }

    public async Task<AssessmentResponse?> GetAssessmentByIdAsync(Guid id)
    {
        var entity = await BuildAssessmentQuery().FirstOrDefaultAsync(a => a.Id == id);
        return entity == null ? null : MapToAssessmentResponse(entity);
    }

    public async Task<AssessmentResponse> CreateAssessmentAsync(Guid teacherId, CreateAssessmentRequest request)
    {
        var cs = await _context.ClassSubjects
            .AsNoTracking()
            .Include(c => c.TeacherSubject)
            .Include(c => c.Class)
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

        var cat = await _context.GradeCategories.FindAsync(request.GradeCategoryId);
        if (cat == null) throw new ValidationException("GradeCategory not found.");

        if (request.DueDate <= request.PublishAt)
        {
            throw new ValidationException("DueDate must be after PublishAt.");
        }

        var entity = new Assessment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = request.ClassSubjectId,
            GradeCategoryId = request.GradeCategoryId,
            TeacherId = teacherId,
            AssignmentId = request.AssignmentId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            AssessmentType = request.AssessmentType,
            MaxScore = request.MaxScore > 0 ? request.MaxScore : 100.0m,
            WeightOverride = request.WeightOverride,
            PublishAt = request.PublishAt,
            DueDate = request.DueDate,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Assessments.Add(entity);
        await _context.SaveChangesAsync();

        if (entity.IsPublished)
        {
            await TriggerAssessmentPublishedNotificationAsync(entity.Id, cs.ClassId, entity.Title, cs.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran");
        }

        return (await GetAssessmentByIdAsync(entity.Id))!;
    }

    public async Task<AssessmentResponse?> UpdateAssessmentAsync(Guid id, Guid teacherId, UpdateAssessmentRequest request)
    {
        var entity = await _context.Assessments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (entity == null) return null;

        if (entity.TeacherId != teacherId && entity.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized to update this assessment.");
            }
        }

        var wasPublished = entity.IsPublished;

        entity.GradeCategoryId = request.GradeCategoryId;
        entity.AssignmentId = request.AssignmentId;
        entity.Title = request.Title.Trim();
        entity.Description = request.Description?.Trim();
        entity.AssessmentType = request.AssessmentType;
        entity.MaxScore = request.MaxScore > 0 ? request.MaxScore : 100.0m;
        entity.WeightOverride = request.WeightOverride;
        entity.PublishAt = request.PublishAt;
        entity.DueDate = request.DueDate;
        entity.IsPublished = request.IsPublished;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (!wasPublished && entity.IsPublished)
        {
            await TriggerAssessmentPublishedNotificationAsync(entity.Id, entity.ClassSubject.ClassId, entity.Title, entity.ClassSubject.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran");
        }

        return await GetAssessmentByIdAsync(id);
    }

    public async Task<bool> DeleteAssessmentAsync(Guid id, Guid teacherId)
    {
        var entity = await _context.Assessments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (entity == null) return false;

        if (entity.TeacherId != teacherId && entity.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized to delete this assessment.");
            }
        }

        _context.Assessments.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AssessmentResponse?> PublishAssessmentAsync(Guid id, Guid teacherId)
    {
        var entity = await _context.Assessments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (entity == null) return null;

        if (!entity.IsPublished)
        {
            entity.IsPublished = true;
            entity.PublishAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await TriggerAssessmentPublishedNotificationAsync(entity.Id, entity.ClassSubject.ClassId, entity.Title, entity.ClassSubject.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran");
        }

        return await GetAssessmentByIdAsync(id);
    }

    #endregion

    private async Task TriggerAssessmentPublishedNotificationAsync(Guid assessmentId, Guid classId, string title, string subjectName)
    {
        var studentIds = await _context.Users
            .AsNoTracking()
            .Where(u => u.ClassId == classId && u.Role == UserRole.Student && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        if (studentIds.Any())
        {
            await _notificationService.NotifyUsersAsync(
                studentIds,
                $"Penilaian Baru: {title}",
                $"Penilaian baru '{title}' untuk {subjectName} telah dipublikasikan.",
                NotificationType.AssessmentPublished,
                NotificationPriority.Normal,
                assessmentId.ToString(),
                NotificationReferenceType.Assessment,
                $"/student/assessments/{assessmentId}",
                "file-signature",
                "#6366f1"
            );
        }
    }

    private IQueryable<Assessment> BuildAssessmentQuery()
    {
        return _context.Assessments
            .AsNoTracking()
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject)
            .Include(a => a.GradeCategory)
            .Include(a => a.Teacher)
            .Include(a => a.Assignment)
            .Include(a => a.StudentGrades);
    }

    private static GradeCategoryResponse MapToCategoryResponse(GradeCategory c)
    {
        return new GradeCategoryResponse
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Weight = c.Weight,
            Type = c.Type,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }

    private static AssessmentResponse MapToAssessmentResponse(Assessment a)
    {
        var studentCount = a.ClassSubject?.Class != null
            ? a.StudentGrades.Select(g => g.StudentId).Distinct().Count()
            : 0;

        var graded = a.StudentGrades.ToList();
        decimal avg = graded.Any() ? Math.Round(graded.Average(g => g.RawScore), 2) : 0.0m;

        return new AssessmentResponse
        {
            Id = a.Id,
            ClassSubjectId = a.ClassSubjectId,
            ClassName = a.ClassSubject?.Class?.Name ?? string.Empty,
            SubjectName = a.ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty,
            SubjectCode = a.ClassSubject?.TeacherSubject?.Subject?.Code ?? string.Empty,
            GradeCategoryId = a.GradeCategoryId,
            GradeCategoryName = a.GradeCategory?.Name ?? string.Empty,
            CategoryWeight = a.GradeCategory?.Weight ?? 0.0m,
            TeacherId = a.TeacherId,
            TeacherName = a.Teacher?.FullName ?? string.Empty,
            AssignmentId = a.AssignmentId,
            AssignmentTitle = a.Assignment?.Title,
            Title = a.Title,
            Description = a.Description,
            AssessmentType = a.AssessmentType,
            MaxScore = a.MaxScore,
            WeightOverride = a.WeightOverride,
            PublishAt = a.PublishAt,
            DueDate = a.DueDate,
            IsPublished = a.IsPublished,
            GradedCount = graded.Count,
            TotalStudentsCount = studentCount,
            AverageScore = avg,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }
}
