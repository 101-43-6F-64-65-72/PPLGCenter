using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _context;

    public AssignmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AssignmentResponse>> GetAssignmentsAsync(int page, int pageSize, string? subject, string? grade)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Assignment>()
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(subject))
        {
            query = query.Where(a => a.Subject == subject);
        }

        if (!string.IsNullOrWhiteSpace(grade))
        {
            query = query.Where(a => a.Grade == grade);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AssignmentResponse
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                Subject = a.Subject,
                Grade = a.Grade,
                DueDate = a.DueDate,
                MaxScore = a.MaxScore,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser.FullName,
                SubmissionCount = a.Submissions.Count
            })
            .ToListAsync();

        return new PagedResult<AssignmentResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AssignmentResponse?> GetAssignmentByIdAsync(Guid id)
    {
        return await _context.Set<Assignment>()
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new AssignmentResponse
            {
                Id = a.Id,
                Title = a.Title,
                Description = a.Description,
                Subject = a.Subject,
                Grade = a.Grade,
                DueDate = a.DueDate,
                MaxScore = a.MaxScore,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser.FullName,
                SubmissionCount = a.Submissions.Count
            })
            .FirstOrDefaultAsync();
    }

    public async Task<AssignmentResponse> CreateAssignmentAsync(CreateAssignmentRequest request, Guid userId)
    {
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Subject = request.Subject,
            Grade = request.Grade,
            DueDate = request.DueDate,
            MaxScore = request.MaxScore,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.Set<Assignment>().Add(assignment);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        return new AssignmentResponse
        {
            Id = assignment.Id,
            Title = assignment.Title,
            Description = assignment.Description,
            Subject = assignment.Subject,
            Grade = assignment.Grade,
            DueDate = assignment.DueDate,
            MaxScore = assignment.MaxScore,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt,
            CreatedByUserId = assignment.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? string.Empty,
            SubmissionCount = 0
        };
    }

    public async Task<AssignmentResponse?> UpdateAssignmentAsync(Guid id, UpdateAssignmentRequest request, Guid userId, string userRole)
    {
        var assignment = await _context.Set<Assignment>()
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment is null)
            return null;

        if (userRole != "Admin" && assignment.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update your own assignments.");

        assignment.Title = request.Title;
        assignment.Description = request.Description;
        assignment.Subject = request.Subject;
        assignment.Grade = request.Grade;
        assignment.DueDate = request.DueDate;
        assignment.MaxScore = request.MaxScore;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var submissionCount = await _context.Set<Submission>()
            .CountAsync(s => s.AssignmentId == id);

        return new AssignmentResponse
        {
            Id = assignment.Id,
            Title = assignment.Title,
            Description = assignment.Description,
            Subject = assignment.Subject,
            Grade = assignment.Grade,
            DueDate = assignment.DueDate,
            MaxScore = assignment.MaxScore,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt,
            CreatedByUserId = assignment.CreatedByUserId,
            CreatedByUserName = assignment.CreatedByUser.FullName,
            SubmissionCount = submissionCount
        };
    }

    public async Task<bool> DeleteAssignmentAsync(Guid id, Guid userId, string userRole)
    {
        var assignment = await _context.Set<Assignment>()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment is null)
            return false;

        if (userRole != "Admin" && assignment.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own assignments.");

        _context.Set<Assignment>().Remove(assignment);
        await _context.SaveChangesAsync();

        return true;
    }
}
