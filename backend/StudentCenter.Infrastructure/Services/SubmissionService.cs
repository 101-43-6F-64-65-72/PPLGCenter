using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Interfaces;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IFileStorageService _fileStorageService;

    public SubmissionService(
        AppDbContext context,
        INotificationService? notificationService = null,
        IFileStorageService? fileStorageService = null)
    {
        _context = context;
        _notificationService = notificationService ?? new NotificationService(context);
        _fileStorageService = fileStorageService ?? new SupabaseStorageService(new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
    }

    public async Task<List<SubmissionResponse>> GetSubmissionsByAssignmentAsync(
        Guid assignmentId,
        Guid? requestingUserId = null,
        string? requestingUserRole = null)
    {
        var assignment = await _context.Assignments
            .AsNoTracking()
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(a => a.Id == assignmentId && !a.IsDeleted);

        if (assignment == null)
        {
            return new List<SubmissionResponse>();
        }

        if (requestingUserId.HasValue && requestingUserRole != "Admin")
        {
            if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                var isAuthorized = assignment.TeacherId == requestingUserId.Value ||
                    (assignment.ClassSubject?.TeacherSubject != null && assignment.ClassSubject.TeacherSubject.TeacherId == requestingUserId.Value);

                if (!isAuthorized)
                {
                    throw new UnauthorizedAccessException("Guru tidak memiliki akses ke pengumpulan tugas kelas ini.");
                }
            }
            else if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Siswa tidak memiliki akses ke seluruh daftar pengumpulan.");
            }
        }

        var list = await BuildSubmissionQuery()
            .Where(s => s.AssignmentId == assignmentId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        var result = new List<SubmissionResponse>();
        foreach (var sub in list)
        {
            result.Add(await MapToResponseAsync(sub));
        }
        return result;
    }

    public async Task<SubmissionResponse?> GetSubmissionByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null)
    {
        var sub = await BuildSubmissionQuery().FirstOrDefaultAsync(s => s.Id == id);
        if (sub == null) return null;

        if (requestingUserId.HasValue && requestingUserRole != "Admin")
        {
            var userId = requestingUserId.Value;
            if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase) && sub.StudentId != userId)
            {
                throw new UnauthorizedAccessException("Anda tidak memiliki akses ke pengumpulan tugas ini.");
            }

            if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                var isAssignedTeacher = sub.Assignment != null && (
                    sub.Assignment.TeacherId == userId ||
                    (sub.Assignment.ClassSubject != null && sub.Assignment.ClassSubject.TeacherSubject != null && sub.Assignment.ClassSubject.TeacherSubject.TeacherId == userId)
                );
                if (!isAssignedTeacher)
                {
                    throw new UnauthorizedAccessException("Guru tidak memiliki akses ke pengumpulan tugas kelas ini.");
                }
            }
        }

        return await MapToResponseAsync(sub);
    }

    public async Task<SubmissionResponse?> GetStudentSubmissionForAssignmentAsync(Guid assignmentId, Guid studentId)
    {
        var sub = await BuildSubmissionQuery()
            .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);

        if (sub == null) return null;
        return await MapToResponseAsync(sub);
    }

    public async Task<SubmissionResponse> SubmitAssignmentAsync(Guid studentId, CreateSubmissionRequest request)
    {
        var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);
        if (student == null || student.Role != UserRole.Student)
        {
            throw new UnauthorizedAccessException("Invalid student account.");
        }

        var assignment = await _context.Assignments
            .AsNoTracking()
            .Include(a => a.ClassSubject)
            .FirstOrDefaultAsync(a => a.Id == request.AssignmentId && !a.IsDeleted);

        if (assignment == null) throw new ValidationException("Assignment not found.");

        if (student.ClassId == null || student.ClassId != assignment.ClassSubject?.ClassId)
        {
            throw new UnauthorizedAccessException("Siswa tidak dapat mengumpulkan tugas untuk kelas lain.");
        }

        var now = DateTime.UtcNow;

        if (assignment.PublishAt > now)
        {
            throw new ValidationException("This assignment has not been published yet.");
        }

        var isLate = now > assignment.DueDate;

        if (isLate && !assignment.AllowLateSubmission)
        {
            throw new ValidationException("Deadline has passed and late submission is not allowed.");
        }

        var existingSubmission = await _context.Submissions
            .Include(s => s.Revisions)
            .FirstOrDefaultAsync(s => s.AssignmentId == request.AssignmentId && s.StudentId == studentId);

        Submission submission;

        if (existingSubmission != null)
        {
            // Re-submission: append revision history without overwriting previous versions
            existingSubmission.LatestVersion += 1;
            existingSubmission.SubmittedAt = now;
            existingSubmission.UpdatedAt = now;

            var newRevision = new SubmissionRevision
            {
                Id = Guid.NewGuid(),
                SubmissionId = existingSubmission.Id,
                Version = existingSubmission.LatestVersion,
                SubmissionType = string.IsNullOrWhiteSpace(request.SubmissionType) ? "FILE" : request.SubmissionType.Trim().ToUpper(),
                TextAnswer = request.TextAnswer?.Trim(),
                FileUrl = request.FileUrl?.Trim(),
                LinkUrl = request.LinkUrl?.Trim(),
                Comment = request.Comment?.Trim(),
                CreatedAt = now
            };

            _context.SubmissionRevisions.Add(newRevision);
            submission = existingSubmission;
        }
        else
        {
            // First time submission
            submission = new Submission
            {
                Id = Guid.NewGuid(),
                AssignmentId = request.AssignmentId,
                StudentId = studentId,
                LatestVersion = 1,
                SubmittedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            var firstRevision = new SubmissionRevision
            {
                Id = Guid.NewGuid(),
                SubmissionId = submission.Id,
                Version = 1,
                SubmissionType = string.IsNullOrWhiteSpace(request.SubmissionType) ? "FILE" : request.SubmissionType.Trim().ToUpper(),
                TextAnswer = request.TextAnswer?.Trim(),
                FileUrl = request.FileUrl?.Trim(),
                LinkUrl = request.LinkUrl?.Trim(),
                Comment = request.Comment?.Trim(),
                CreatedAt = now
            };

            _context.Submissions.Add(submission);
            _context.SubmissionRevisions.Add(firstRevision);
        }

        await _context.SaveChangesAsync();
        return (await GetSubmissionByIdAsync(submission.Id))!;
    }

    public async Task<SubmissionResponse?> GradeSubmissionAsync(Guid submissionId, Guid teacherId, GradeSubmissionRequest request)
    {
        var submission = await _context.Submissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.ClassSubject)
                    .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null) return null;

        var assignment = submission.Assignment;
        if (assignment.TeacherId != teacherId && assignment.ClassSubject?.TeacherSubject?.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new UnauthorizedAccessException("Teacher is not authorized to grade this submission.");
            }
        }

        if (request.Score < 0 || request.Score > assignment.MaxScore)
        {
            throw new ValidationException($"Score must be between 0 and {assignment.MaxScore}.");
        }

        submission.Score = request.Score;
        submission.Feedback = request.Feedback?.Trim();
        submission.GradedAt = DateTime.UtcNow;
        submission.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var assignmentTitle = assignment?.Title ?? "Tugas";
        await _notificationService.NotifyUserAsync(
            submission.StudentId,
            $"Tugas Dinilai: {assignmentTitle}",
            $"Tugas '{assignmentTitle}' Anda telah dinilai. Nilai: {request.Score}/{assignment?.MaxScore}.",
            NotificationType.AssignmentGraded,
            NotificationPriority.High,
            submission.Id.ToString(),
            NotificationReferenceType.Assignment,
            $"/student/assignments/{submission.AssignmentId}",
            "award",
            "#8b5cf6"
        );

        return await GetSubmissionByIdAsync(submissionId);
    }

    private IQueryable<Submission> BuildSubmissionQuery()
    {
        return _context.Submissions
            .AsNoTracking()
            .Include(s => s.Student)
            .Include(s => s.Assignment)
            .Include(s => s.Revisions);
    }

    private async Task<SubmissionResponse> MapToResponseAsync(Submission s)
    {
        var revisions = new List<SubmissionRevisionResponse>();
        foreach (var r in s.Revisions.OrderByDescending(r => r.Version))
        {
            var signedUrl = !string.IsNullOrWhiteSpace(r.FileUrl)
                ? await _fileStorageService.CreateSignedUrlAsync(r.FileUrl)
                : r.FileUrl;

            revisions.Add(new SubmissionRevisionResponse
            {
                Id = r.Id,
                Version = r.Version,
                SubmissionType = r.SubmissionType,
                TextAnswer = r.TextAnswer,
                FileUrl = signedUrl,
                LinkUrl = r.LinkUrl,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            });
        }

        var isLate = s.Assignment != null && s.SubmittedAt > s.Assignment.DueDate;

        return new SubmissionResponse
        {
            Id = s.Id,
            AssignmentId = s.AssignmentId,
            AssignmentTitle = s.Assignment?.Title ?? string.Empty,
            StudentId = s.StudentId,
            StudentName = s.Student?.FullName ?? string.Empty,
            StudentNis = s.Student?.NIS ?? string.Empty,
            LatestVersion = s.LatestVersion,
            SubmittedAt = s.SubmittedAt,
            IsLate = isLate,
            Score = s.Score,
            Feedback = s.Feedback,
            GradedAt = s.GradedAt,
            Revisions = revisions
        };
    }
}
