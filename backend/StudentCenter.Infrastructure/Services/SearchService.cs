using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly AppDbContext _context;

    public SearchService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SearchResponse> SearchAsync(string keyword, int page, int pageSize, Guid? userId = null, string? userRole = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var response = new SearchResponse();
        var normalizedKeyword = keyword.ToLower();

        await Task.WhenAll(
            SearchAnnouncementsAsync(response, normalizedKeyword, page, pageSize),
            SearchMaterialsAsync(response, normalizedKeyword, page, pageSize),
            SearchAssignmentsAsync(response, normalizedKeyword, page, pageSize),
            SearchCalendarEventsAsync(response, normalizedKeyword, page, pageSize),
            SearchFacilitiesAsync(response, normalizedKeyword, page, pageSize),
            SearchExtracurricularsAsync(response, normalizedKeyword, page, pageSize),
            SearchProposalsAsync(response, normalizedKeyword, page, pageSize, userId, userRole)
        );

        return response;
    }

    private async Task SearchAnnouncementsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Announcement>()
            .AsNoTracking()
            .Where(a => a.Title.ToLower().Contains(keyword) || a.Content.ToLower().Contains(keyword))
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new SearchResult
            {
                Type = "Announcement",
                Id = a.Id,
                Title = a.Title,
                Description = a.Content.Length > 100 ? a.Content.Substring(0, 100) + "..." : a.Content,
                Metadata = a.Category,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        response.Announcements = results;
    }

    private async Task SearchMaterialsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Material>()
            .AsNoTracking()
            .Where(m => m.Title.ToLower().Contains(keyword) || m.Description.ToLower().Contains(keyword))
            .OrderByDescending(m => m.UploadedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new SearchResult
            {
                Type = "Material",
                Id = m.Id,
                Title = m.Title,
                Description = m.Description ?? string.Empty,
                Metadata = $"{m.Subject} - {m.Grade}",
                CreatedAt = m.UploadedAt
            })
            .ToListAsync();

        response.Materials = results;
    }

    private async Task SearchAssignmentsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Assignment>()
            .AsNoTracking()
            .Where(a => a.Title.ToLower().Contains(keyword) || a.Description.ToLower().Contains(keyword))
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new SearchResult
            {
                Type = "Assignment",
                Id = a.Id,
                Title = a.Title,
                Description = a.Description ?? string.Empty,
                Metadata = $"{a.Subject} - {a.Grade} - Due: {a.DueDate:yyyy-MM-dd}",
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        response.Assignments = results;
    }

    private async Task SearchCalendarEventsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.Title.ToLower().Contains(keyword) || c.Description.ToLower().Contains(keyword))
            .OrderByDescending(c => c.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new SearchResult
            {
                Type = "CalendarEvent",
                Id = c.Id,
                Title = c.Title,
                Description = c.Description ?? string.Empty,
                Metadata = $"{c.Category} - {c.StartDate:yyyy-MM-dd}",
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        response.CalendarEvents = results;
    }

    private async Task SearchFacilitiesAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Facility>()
            .AsNoTracking()
            .Where(f => f.IsActive && (f.Name.ToLower().Contains(keyword) || f.Description.ToLower().Contains(keyword)))
            .OrderBy(f => f.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new SearchResult
            {
                Type = "Facility",
                Id = f.Id,
                Title = f.Name,
                Description = f.Description ?? string.Empty,
                Metadata = $"Capacity: {f.Capacity}",
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();

        response.Facilities = results;
    }

    private async Task SearchExtracurricularsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Extracurricular>()
            .AsNoTracking()
            .Where(e => e.IsActive && (e.Name.ToLower().Contains(keyword) || e.Description.ToLower().Contains(keyword)))
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new SearchResult
            {
                Type = "Extracurricular",
                Id = e.Id,
                Title = e.Name,
                Description = e.Description,
                Metadata = $"{e.Category} - Members: {e.Members.Count}/{e.MaxMembers}",
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        response.Extracurriculars = results;
    }

    private async Task SearchProposalsAsync(SearchResponse response, string keyword, int page, int pageSize, Guid? userId = null, string? userRole = null)
    {
        var query = _context.Set<Proposal>()
            .AsNoTracking()
            .Where(p => p.Title.ToLower().Contains(keyword) || p.Description.ToLower().Contains(keyword));

        if (userId.HasValue && userRole != "Admin" && userRole != "Teacher")
        {
            query = query.Where(p => p.SubmittedByUserId == userId.Value);
        }

        var results = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new SearchResult
            {
                Type = "Proposal",
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                Metadata = p.Status.ToString(),
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        response.Proposals = results;
    }
}
