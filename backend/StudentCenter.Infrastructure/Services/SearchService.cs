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
            SearchBooksAsync(response, normalizedKeyword, page, pageSize),
            SearchCommunityGroupsAsync(response, normalizedKeyword, page, pageSize),
            SearchClassDivisionsAsync(response, normalizedKeyword, page, pageSize),
            SearchExtracurricularsAsync(response, normalizedKeyword, page, pageSize),
            SearchProposalsAsync(response, normalizedKeyword, page, pageSize, userId, userRole),
            SearchDiscussionsAsync(response, normalizedKeyword, page, pageSize),
            SearchMessagesAsync(response, normalizedKeyword, page, pageSize, userId),
            SearchElectionsAsync(response, normalizedKeyword, page, pageSize),
            SearchCandidatesAsync(response, normalizedKeyword, page, pageSize)
        );

        return response;
    }

    private async Task SearchBooksAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Book>()
            .AsNoTracking()
            .Where(b => b.IsActive && (b.Title.ToLower().Contains(keyword) || b.Author.ToLower().Contains(keyword) || (b.Category != null && b.Category.ToLower().Contains(keyword))))
            .OrderBy(b => b.Title)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new SearchResult
            {
                Type = "Book",
                Id = b.Id,
                Title = b.Title,
                Description = $"Author: {b.Author}",
                Metadata = $"Category: {b.Category} - Available: {b.AvailableCopies}/{b.TotalCopies}",
                CreatedAt = b.CreatedAt
            })
            .ToListAsync();

        response.Books = results;
    }

    private async Task SearchCommunityGroupsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<CommunityGroup>()
            .AsNoTracking()
            .Where(g => g.Name.ToLower().Contains(keyword) || (g.Description != null && g.Description.ToLower().Contains(keyword)))
            .OrderByDescending(g => g.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new SearchResult
            {
                Type = "CommunityGroup",
                Id = g.Id,
                Title = g.Name,
                Description = g.Description ?? string.Empty,
                Metadata = "Community Group",
                CreatedAt = g.CreatedAt
            })
            .ToListAsync();

        response.CommunityGroups = results;
    }

    private async Task SearchClassDivisionsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<ClassDivision>()
            .AsNoTracking()
            .Where(cd => cd.Name.ToLower().Contains(keyword) || (cd.Description != null && cd.Description.ToLower().Contains(keyword)))
            .OrderBy(cd => cd.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(cd => new SearchResult
            {
                Type = "ClassDivision",
                Id = cd.Id,
                Title = cd.Name,
                Description = cd.Description ?? string.Empty,
                Metadata = "Class Division",
                CreatedAt = cd.CreatedAt
            })
            .ToListAsync();

        response.ClassDivisions = results;
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
            .Where(m => m.Title.ToLower().Contains(keyword) || (m.Description != null && m.Description.ToLower().Contains(keyword)))
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
        var assignmentsList = await _context.Set<Assignment>()
            .AsNoTracking()
            .Where(a => a.Title.ToLower().Contains(keyword) || (a.Description != null && a.Description.ToLower().Contains(keyword)))
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        response.Assignments = assignmentsList.Select(a => new SearchResult
        {
            Type = "Assignment",
            Id = a.Id,
            Title = a.Title,
            Description = a.Description ?? string.Empty,
            Metadata = $"{a.Subject} - {a.Grade} - Due: {a.DueDate:yyyy-MM-dd}",
            CreatedAt = a.CreatedAt
        }).ToList();
    }

    private async Task SearchCalendarEventsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<CalendarEvent>()
            .AsNoTracking()
            .Where(c => c.DeletedAt == null && (c.Title.ToLower().Contains(keyword) || (c.Description != null && c.Description.ToLower().Contains(keyword))))
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
            .Where(f => f.IsActive && (
                f.Name.ToLower().Contains(keyword) ||
                (f.Description != null && f.Description.ToLower().Contains(keyword)) ||
                (f.Category != null && f.Category.ToLower().Contains(keyword)) ||
                f.Location.ToLower().Contains(keyword)))
            .OrderBy(f => f.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new SearchResult
            {
                Type = "Facility",
                Id = f.Id,
                Title = f.Name,
                Description = f.Description ?? string.Empty,
                Metadata = $"Category: {f.Category ?? "Umum"} - Capacity: {f.Capacity}",
                CreatedAt = f.CreatedAt
            })
            .ToListAsync();

        response.Facilities = results;
    }

    private async Task SearchExtracurricularsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Extracurricular>()
            .AsNoTracking()
            .Where(e => e.IsActive && (
                e.Name.ToLower().Contains(keyword) ||
                e.Description.ToLower().Contains(keyword) ||
                e.Category.ToLower().Contains(keyword) ||
                (e.ScheduleDay != null && e.ScheduleDay.ToLower().Contains(keyword)) ||
                (e.Location != null && e.Location.ToLower().Contains(keyword)) ||
                (e.AdvisorName != null && e.AdvisorName.ToLower().Contains(keyword))))
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

    private async Task SearchDiscussionsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<DiscussionThread>()
            .AsNoTracking()
            .Where(t => t.DeletedAt == null && (t.Title.ToLower().Contains(keyword) || t.Body.ToLower().Contains(keyword)))
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new SearchResult
            {
                Type = "DiscussionThread",
                Id = t.Id,
                Title = t.Title,
                Description = t.Body.Length > 100 ? t.Body.Substring(0, 100) + "..." : t.Body,
                Metadata = $"Replies: {t.ReplyCount}",
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        response.Discussions = results;
    }

    private async Task SearchMessagesAsync(SearchResponse response, string keyword, int page, int pageSize, Guid? userId)
    {
        if (!userId.HasValue)
        {
            response.Messages = new List<SearchResult>();
            return;
        }

        var results = await _context.Set<Message>()
            .AsNoTracking()
            .Where(m => m.DeletedAt == null && m.Text != null && m.Text.ToLower().Contains(keyword))
            .Where(m => _context.Set<ConversationMember>().Any(cm => cm.ConversationId == m.ConversationId && cm.UserId == userId.Value))
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new SearchResult
            {
                Type = "Message",
                Id = m.Id,
                Title = $"Pesan di Chat",
                Description = m.Text!.Length > 100 ? m.Text.Substring(0, 100) + "..." : m.Text,
                Metadata = $"ConversationId: {m.ConversationId}",
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        response.Messages = results;
    }

    private async Task SearchElectionsAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<Election>()
            .AsNoTracking()
            .Where(e => e.DeletedAt == null && (e.Title.ToLower().Contains(keyword) || e.Description.ToLower().Contains(keyword)))
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new SearchResult
            {
                Type = "Election",
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                Metadata = $"Status: {e.Status}",
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        response.Elections = results;
    }

    private async Task SearchCandidatesAsync(SearchResponse response, string keyword, int page, int pageSize)
    {
        var results = await _context.Set<ElectionCandidate>()
            .AsNoTracking()
            .Include(c => c.Student)
            .Where(c => c.Vision.ToLower().Contains(keyword) || c.Mission.ToLower().Contains(keyword) || c.Student.FullName.ToLower().Contains(keyword))
            .OrderBy(c => c.CandidateNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new SearchResult
            {
                Type = "Candidate",
                Id = c.Id,
                Title = $"No. {c.CandidateNumber} - {c.Student.FullName}",
                Description = $"Visi: {c.Vision}",
                Metadata = $"Mission: {c.Mission}",
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        response.Candidates = results;
    }
}
