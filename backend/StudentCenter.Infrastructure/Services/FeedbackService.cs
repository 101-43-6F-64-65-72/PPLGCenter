using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _context;

    public FeedbackService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<FeedbackResponse> CreateFeedbackAsync(CreateFeedbackRequest request, Guid? userId, string? userName, string? userRole, string? userIdentifier)
    {
        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = request.IsAnonymous ? null : userId,
            UserName = request.IsAnonymous ? "Anonim" : (userName ?? "Warga Sekolah"),
            UserIdentifier = request.IsAnonymous ? null : userIdentifier,
            UserRole = request.IsAnonymous ? (userRole ?? "Student") : (userRole ?? "Student"),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Fitur" : request.Category.Trim(),
            Rating = Math.Clamp(request.Rating, 1, 5),
            Content = request.Content.Trim(),
            IsAnonymous = request.IsAnonymous,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        return MapToResponse(feedback);
    }

    public async Task<PagedFeedbackResult> GetFeedbacksAsync(string? category, int? rating, string? status, string? search, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Feedbacks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && category != "All" && category != "Semua")
        {
            query = query.Where(f => f.Category.ToLower() == category.ToLower());
        }

        if (rating.HasValue && rating.Value > 0)
        {
            query = query.Where(f => f.Rating == rating.Value);
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "All" && status != "Semua")
        {
            query = query.Where(f => f.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower().Trim();
            query = query.Where(f => f.Content.ToLower().Contains(s) ||
                                     (f.UserName != null && f.UserName.ToLower().Contains(s)) ||
                                     (f.UserIdentifier != null && f.UserIdentifier.ToLower().Contains(s)) ||
                                     (f.Category != null && f.Category.ToLower().Contains(s)));
        }

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedFeedbackResult
        {
            Items = items.Select(MapToResponse).ToList(),
            TotalItems = totalItems,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }

    public async Task<FeedbackSummaryResponse> GetFeedbackSummaryAsync()
    {
        var feedbacks = await _context.Feedbacks.AsNoTracking().ToListAsync();

        var totalCount = feedbacks.Count;
        var averageRating = totalCount > 0 ? Math.Round(feedbacks.Average(f => f.Rating), 1) : 5.0;
        var pendingCount = feedbacks.Count(f => f.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase));
        var reviewedCount = feedbacks.Count(f => f.Status.Equals("Reviewed", StringComparison.OrdinalIgnoreCase));
        var resolvedCount = feedbacks.Count(f => f.Status.Equals("Resolved", StringComparison.OrdinalIgnoreCase));

        var categoryBreakdown = feedbacks
            .GroupBy(f => f.Category ?? "Lainnya")
            .ToDictionary(g => g.Key, g => g.Count());

        var ratingBreakdown = feedbacks
            .GroupBy(f => f.Rating)
            .ToDictionary(g => g.Key, g => g.Count());

        return new FeedbackSummaryResponse
        {
            TotalCount = totalCount,
            AverageRating = averageRating,
            PendingCount = pendingCount,
            ReviewedCount = reviewedCount,
            ResolvedCount = resolvedCount,
            CategoryBreakdown = categoryBreakdown,
            RatingBreakdown = ratingBreakdown
        };
    }

    public async Task<FeedbackResponse?> UpdateFeedbackStatusAsync(Guid id, UpdateFeedbackStatusRequest request)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return null;

        feedback.Status = request.Status.Trim();
        if (request.AdminNotes != null)
        {
            feedback.AdminNotes = request.AdminNotes.Trim();
        }
        feedback.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToResponse(feedback);
    }

    public async Task<bool> DeleteFeedbackAsync(Guid id)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null) return false;

        _context.Feedbacks.Remove(feedback);
        await _context.SaveChangesAsync();
        return true;
    }

    private static FeedbackResponse MapToResponse(Feedback f)
    {
        return new FeedbackResponse
        {
            Id = f.Id,
            UserId = f.UserId,
            UserName = f.IsAnonymous ? "Anonim" : (f.UserName ?? "Warga Sekolah"),
            UserIdentifier = f.IsAnonymous ? null : f.UserIdentifier,
            UserRole = f.UserRole ?? "Student",
            Category = f.Category,
            Rating = f.Rating,
            Content = f.Content,
            IsAnonymous = f.IsAnonymous,
            Status = f.Status,
            AdminNotes = f.AdminNotes,
            CreatedAt = f.CreatedAt,
            UpdatedAt = f.UpdatedAt
        };
    }
}
