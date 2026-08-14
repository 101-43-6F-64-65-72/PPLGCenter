using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AssignmentService(AppDbContext context, INotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService ?? new NotificationService(context);
    }

    public async Task<List<AssignmentResponse>> GetAllAsync(Guid? classSubjectId = null, Guid? teacherId = null, bool includeDeleted = false)
    {
        var query = BuildAssignmentQuery();

        if (!includeDeleted)
            query = query.Where(a => !a.IsDeleted);

        if (classSubjectId.HasValue)
            query = query.Where(a => a.ClassSubjectId == classSubjectId.Value);

        if (teacherId.HasValue)
            query = query.Where(a => a.TeacherId == teacherId.Value);

        var list = await query.OrderByDescending(a => a.DueDate).ToListAsync();
        return list.Select(MapToResponse).ToList();
    }

    public async Task<AssignmentResponse?> GetByIdAsync(Guid id)
    {
        var assignment = await BuildAssignmentQuery().FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (assignment == null) return null;
        return MapToResponse(assignment);
    }

    public async Task<AssignmentResponse> CreateAsync(Guid teacherId, CreateAssignmentRequest request)
    {
        if (request.MaxScore <= 0)
        {
            throw new ValidationException("MaxScore must be greater than 0.");
        }

        if (request.DueDate <= request.PublishAt)
        {
            throw new ValidationException("DueDate must be after PublishAt.");
        }

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

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = request.ClassSubjectId,
            ScheduleId = request.ScheduleId,
            TeacherId = teacherId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Attachment = request.Attachment?.Trim(),
            PublishAt = request.PublishAt,
            DueDate = request.DueDate,
            MaxScore = request.MaxScore,
            AllowLateSubmission = request.AllowLateSubmission,
            LatePenaltyPercent = request.LatePenaltyPercent,
            IsDeleted = false,
            Version = 1,
            CreatedBy = teacherId,
            UpdatedBy = teacherId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

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
                $"Tugas Baru: {assignment.Title}",
                $"Tugas baru untuk {subjectName} telah dibuat. Tenggat: {assignment.DueDate:dd MMM yyyy HH:mm}.",
                NotificationType.Assignment,
                NotificationPriority.High,
                assignment.Id.ToString(),
                NotificationReferenceType.Assignment,
                $"/student/assignments/{assignment.Id}",
                "file-pen",
                "#f59e0b"
            );
        }

        return (await GetByIdAsync(assignment.Id))!;
    }

    public async Task<AssignmentResponse?> UpdateAsync(Guid id, Guid teacherId, UpdateAssignmentRequest request)
    {
        var assignment = await _context.Assignments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (assignment == null) return null;

        if (assignment.TeacherId != teacherId && assignment.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized to edit this assignment.");
            }
        }

        if (request.MaxScore <= 0)
        {
            throw new ValidationException("MaxScore must be greater than 0.");
        }

        if (request.DueDate <= request.PublishAt)
        {
            throw new ValidationException("DueDate must be after PublishAt.");
        }

        assignment.Title = request.Title.Trim();
        assignment.Description = request.Description?.Trim();
        assignment.Attachment = request.Attachment?.Trim();
        assignment.PublishAt = request.PublishAt;
        assignment.DueDate = request.DueDate;
        assignment.MaxScore = request.MaxScore;
        assignment.AllowLateSubmission = request.AllowLateSubmission;
        assignment.LatePenaltyPercent = request.LatePenaltyPercent;
        assignment.Version += 1;
        assignment.UpdatedBy = teacherId;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> SoftDeleteAsync(Guid id, Guid teacherId)
    {
        var assignment = await _context.Assignments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (assignment == null) return false;

        if (assignment.TeacherId != teacherId && assignment.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized to delete this assignment.");
            }
        }

        assignment.IsDeleted = true;
        assignment.DeletedAt = DateTime.UtcNow;
        assignment.UpdatedBy = teacherId;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<AssignmentResponse>> GetStudentAssignmentsAsync(Guid studentId)
    {
        var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);
        if (student?.ClassId == null) return new();

        var now = DateTime.UtcNow;

        var query = BuildAssignmentQuery()
            .Where(a => !a.IsDeleted && a.PublishAt <= now && a.ClassSubject.ClassId == student.ClassId);

        var list = await query.OrderBy(a => a.DueDate).ToListAsync();
        return list.Select(MapToResponse).ToList();
    }

    public async Task<List<AssignmentResponse>> GetTeacherAssignmentsAsync(Guid teacherId)
    {
        var query = BuildAssignmentQuery()
            .Where(a => !a.IsDeleted && (a.TeacherId == teacherId || a.ClassSubject.TeacherSubject.TeacherId == teacherId));

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return list.Select(MapToResponse).ToList();
    }

    private IQueryable<Assignment> BuildAssignmentQuery()
    {
        return _context.Assignments
            .AsNoTracking()
            .Include(a => a.Teacher)
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject)
            .Include(a => a.Submissions);
    }

    private static AssignmentResponse MapToResponse(Assignment a)
    {
        return new AssignmentResponse
        {
            Id = a.Id,
            ClassSubjectId = a.ClassSubjectId,
            ClassId = a.ClassSubject?.ClassId ?? Guid.Empty,
            ClassName = a.ClassSubject?.Class?.Name ?? string.Empty,
            SubjectId = a.ClassSubject?.TeacherSubject?.SubjectId ?? Guid.Empty,
            SubjectCode = a.ClassSubject?.TeacherSubject?.Subject?.Code ?? string.Empty,
            SubjectName = a.ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty,
            ScheduleId = a.ScheduleId,
            TeacherId = a.TeacherId,
            TeacherName = a.Teacher?.FullName ?? string.Empty,
            Title = a.Title,
            Description = a.Description,
            Attachment = a.Attachment,
            PublishAt = a.PublishAt,
            DueDate = a.DueDate,
            MaxScore = a.MaxScore,
            AllowLateSubmission = a.AllowLateSubmission,
            LatePenaltyPercent = a.LatePenaltyPercent,
            SubmissionCount = a.Submissions.Count,
            GradedCount = a.Submissions.Count(s => s.Score.HasValue),
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }
}
