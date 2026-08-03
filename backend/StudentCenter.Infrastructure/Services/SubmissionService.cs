using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public SubmissionService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<SubmissionResponse> SubmitAsync(Guid assignmentId, SubmitAssignmentRequest request, Guid studentId)
    {
        var assignment = await _context.Set<Assignment>()
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == assignmentId);

        if (assignment is null)
            throw new KeyNotFoundException("Assignment not found.");

        if (DateTime.UtcNow > assignment.DueDate)
            throw new InvalidOperationException("Assignment submission is past the due date.");

        var existing = await _context.Set<Submission>()
            .AsNoTracking()
            .AnyAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);

        if (existing)
            throw new InvalidOperationException("You have already submitted this assignment.");

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            FileUrl = request.FileUrl,
            Notes = request.Notes,
            SubmittedAt = DateTime.UtcNow,
            AssignmentId = assignmentId,
            StudentId = studentId
        };

        _context.Set<Submission>().Add(submission);
        await _context.SaveChangesAsync();

        var student = await _context.Set<User>().FindAsync(studentId);

        return new SubmissionResponse
        {
            Id = submission.Id,
            FileUrl = submission.FileUrl,
            Notes = submission.Notes,
            Score = submission.Score,
            Feedback = submission.Feedback,
            SubmittedAt = submission.SubmittedAt,
            GradedAt = submission.GradedAt,
            AssignmentId = submission.AssignmentId,
            AssignmentTitle = assignment.Title,
            StudentId = submission.StudentId,
            StudentName = student?.FullName ?? string.Empty
        };
    }

    public async Task<PagedResult<SubmissionResponse>> GetSubmissionsByAssignmentAsync(Guid assignmentId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Submission>()
            .AsNoTracking()
            .Where(s => s.AssignmentId == assignmentId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SubmissionResponse
            {
                Id = s.Id,
                FileUrl = s.FileUrl,
                Notes = s.Notes,
                Score = s.Score,
                Feedback = s.Feedback,
                SubmittedAt = s.SubmittedAt,
                GradedAt = s.GradedAt,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                StudentId = s.StudentId,
                StudentName = s.Student.FullName
            })
            .ToListAsync();

        return new PagedResult<SubmissionResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<SubmissionResponse?> GetSubmissionByIdAsync(Guid id)
    {
        return await _context.Set<Submission>()
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new SubmissionResponse
            {
                Id = s.Id,
                FileUrl = s.FileUrl,
                Notes = s.Notes,
                Score = s.Score,
                Feedback = s.Feedback,
                SubmittedAt = s.SubmittedAt,
                GradedAt = s.GradedAt,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                StudentId = s.StudentId,
                StudentName = s.Student.FullName
            })
            .FirstOrDefaultAsync();
    }

    public async Task<SubmissionResponse?> GradeSubmissionAsync(Guid id, GradeSubmissionRequest request, Guid userId, string userRole)
    {
        var submission = await _context.Set<Submission>()
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission is null)
            return null;

        if (userRole != "Admin" && submission.Assignment.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You are not authorized to grade this submission.");

        submission.Score = request.Score;
        submission.Feedback = request.Feedback;
        submission.GradedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _notificationService.NotifyUserAsync(
            submission.StudentId,
            $"Assignment Graded: {submission.Assignment.Title}",
            $"Your submission has been graded. Score: {submission.Score}/{submission.Assignment.MaxScore}. Feedback: {submission.Feedback}",
            NotificationType.Grade,
            submission.Id.ToString(),
            "Submission"
        );

        return new SubmissionResponse
        {
            Id = submission.Id,
            FileUrl = submission.FileUrl,
            Notes = submission.Notes,
            Score = submission.Score,
            Feedback = submission.Feedback,
            SubmittedAt = submission.SubmittedAt,
            GradedAt = submission.GradedAt,
            AssignmentId = submission.AssignmentId,
            AssignmentTitle = submission.Assignment.Title,
            StudentId = submission.StudentId,
            StudentName = submission.Student.FullName
        };
    }
}
