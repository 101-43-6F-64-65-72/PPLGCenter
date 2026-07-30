using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardSummaryResponse> GetSummaryAsync()
    {
        var usersQuery = _context.Set<User>().AsNoTracking();
        var announcementsQuery = _context.Set<Announcement>().AsNoTracking();

        var totalUsersTask = usersQuery.CountAsync();
        var activeUsersTask = usersQuery.CountAsync(u => u.IsActive);
        var totalAnnouncementsTask = announcementsQuery.CountAsync();
        var pinnedAnnouncementsTask = announcementsQuery.CountAsync(a => a.IsPinned);

        var latestAnnouncementsTask = announcementsQuery
            .Include(a => a.CreatedByUser)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .Select(a => new AnnouncementResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Category = a.Category,
                CoverImageUrl = a.CoverImageUrl,
                IsPinned = a.IsPinned,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser.FullName
            })
            .ToListAsync();

        await Task.WhenAll(totalUsersTask, activeUsersTask, totalAnnouncementsTask, pinnedAnnouncementsTask, latestAnnouncementsTask);

        return new DashboardSummaryResponse
        {
            TotalUsers = totalUsersTask.Result,
            ActiveUsers = activeUsersTask.Result,
            TotalAnnouncements = totalAnnouncementsTask.Result,
            PinnedAnnouncements = pinnedAnnouncementsTask.Result,
            LatestAnnouncements = latestAnnouncementsTask.Result
        };
    }
}
