using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
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

        var totalUsers = await usersQuery.CountAsync();
        var activeUsers = await usersQuery.CountAsync(u => u.IsActive);
        var totalStudents = await usersQuery.CountAsync(u => u.Role == UserRole.Student);
        var totalTeachers = await usersQuery.CountAsync(u => u.Role == UserRole.Teacher);

        var totalClasses = await _context.SchoolClasses.AsNoTracking().CountAsync();
        var totalDepartments = await _context.Departments.AsNoTracking().CountAsync();
        var totalExtracurriculars = await _context.Extracurriculars.AsNoTracking().CountAsync();
        var totalActiveMembers = await _context.ExtracurricularMembers.AsNoTracking().CountAsync(m => m.Status == "Active");

        var totalAnnouncements = await announcementsQuery.CountAsync();
        var pinnedAnnouncements = await announcementsQuery.CountAsync(a => a.IsPinned);

        var totalSubjects = await _context.Subjects.AsNoTracking().CountAsync();
        var totalSchedules = await _context.Schedules.AsNoTracking().CountAsync(s => s.IsActive);
        var totalAcademicEvents = await _context.AcademicEvents.AsNoTracking().CountAsync(e => e.IsActive);

        var latestAnnouncements = await announcementsQuery
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

        return new DashboardSummaryResponse
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            TotalClasses = totalClasses,
            TotalDepartments = totalDepartments,
            TotalExtracurriculars = totalExtracurriculars,
            TotalActiveMembers = totalActiveMembers,
            TotalAnnouncements = totalAnnouncements,
            PinnedAnnouncements = pinnedAnnouncements,
            TotalSubjects = totalSubjects,
            TotalSchedules = totalSchedules,
            TotalAcademicEvents = totalAcademicEvents,
            LatestAnnouncements = latestAnnouncements
        };
    }
}
