using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class StudentProfileService : IStudentProfileService
{
    private readonly AppDbContext _context;

    public StudentProfileService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<StudentProfileResponse?> GetProfileByUserIdAsync(Guid userId, Guid? requesterUserId, bool isRequesterAdminOrTeacher)
    {
        var user = await _context.Users
            .Include(u => u.Class)
            .Include(u => u.StudentProfile)
                .ThenInclude(sp => sp!.Projects)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null) return null;

        var profile = user.StudentProfile;

        // Privacy enforcement
        bool isOwnProfile = requesterUserId.HasValue && requesterUserId.Value == userId;
        bool isPrivate = profile != null && profile.Visibility == ProfileVisibility.PRIVATE;

        if (isPrivate && !isOwnProfile && !isRequesterAdminOrTeacher)
        {
            // Server-side privacy protection: redact private fields for unauthorized requesters
            return new StudentProfileResponse
            {
                Id = profile?.Id ?? Guid.Empty,
                UserId = user.Id,
                StudentName = user.FullName ?? user.Username,
                NIS = user.NIS ?? string.Empty,
                ClassName = user.Class?.Name,
                Visibility = ProfileVisibility.PRIVATE,
                Bio = "[Private Profile]",
                SkillsJson = null,
                TechStackJson = null,
                SocialLinksJson = null,
                Projects = new List<StudentProjectResponse>(),
                UpdatedAt = profile?.UpdatedAt ?? DateTime.UtcNow
            };
        }

        return new StudentProfileResponse
        {
            Id = profile?.Id ?? Guid.Empty,
            UserId = user.Id,
            StudentName = user.FullName ?? user.Username,
            NIS = user.NIS ?? string.Empty,
            ClassName = user.Class?.Name,
            Bio = profile?.Bio,
            SkillsJson = profile?.SkillsJson,
            TechStackJson = profile?.TechStackJson,
            SocialLinksJson = profile?.SocialLinksJson,
            Visibility = profile?.Visibility ?? ProfileVisibility.PUBLIC,
            UpdatedAt = profile?.UpdatedAt ?? DateTime.UtcNow,
            Projects = profile?.Projects.Select(p => new StudentProjectResponse
            {
                Id = p.Id,
                StudentProfileId = p.StudentProfileId,
                Title = p.Title,
                Description = p.Description,
                TechStackJson = p.TechStackJson,
                GithubUrl = p.GithubUrl,
                DemoUrl = p.DemoUrl,
                ImageUrl = p.ImageUrl,
                CreatedAt = p.CreatedAt
            }).ToList() ?? new List<StudentProjectResponse>()
        };
    }

    public async Task<StudentProfileResponse> UpsertProfileAsync(Guid userId, UpdateStudentProfileRequest request)
    {
        var user = await _context.Users
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            throw new KeyNotFoundException("User not found.");

        if (user.StudentProfile is null)
        {
            user.StudentProfile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Bio = request.Bio,
                SkillsJson = request.SkillsJson,
                TechStackJson = request.TechStackJson,
                SocialLinksJson = request.SocialLinksJson,
                Visibility = request.Visibility,
                UpdatedAt = DateTime.UtcNow
            };
            _context.StudentProfiles.Add(user.StudentProfile);
        }
        else
        {
            user.StudentProfile.Bio = request.Bio;
            user.StudentProfile.SkillsJson = request.SkillsJson;
            user.StudentProfile.TechStackJson = request.TechStackJson;
            user.StudentProfile.SocialLinksJson = request.SocialLinksJson;
            user.StudentProfile.Visibility = request.Visibility;
            user.StudentProfile.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return (await GetProfileByUserIdAsync(userId, userId, true))!;
    }

    public async Task<StudentProjectResponse> AddProjectAsync(Guid userId, StudentProjectRequest request)
    {
        var profile = await _context.StudentProfiles
            .FirstOrDefaultAsync(sp => sp.UserId == userId);

        if (profile is null)
        {
            // Auto-create profile if missing
            profile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Visibility = ProfileVisibility.PUBLIC,
                UpdatedAt = DateTime.UtcNow
            };
            _context.StudentProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        var project = new StudentProject
        {
            Id = Guid.NewGuid(),
            StudentProfileId = profile.Id,
            Title = request.Title,
            Description = request.Description,
            TechStackJson = request.TechStackJson,
            GithubUrl = request.GithubUrl,
            DemoUrl = request.DemoUrl,
            ImageUrl = request.ImageUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentProjects.Add(project);
        await _context.SaveChangesAsync();

        return new StudentProjectResponse
        {
            Id = project.Id,
            StudentProfileId = project.StudentProfileId,
            Title = project.Title,
            Description = project.Description,
            TechStackJson = project.TechStackJson,
            GithubUrl = project.GithubUrl,
            DemoUrl = project.DemoUrl,
            ImageUrl = project.ImageUrl,
            CreatedAt = project.CreatedAt
        };
    }

    public async Task<StudentProjectResponse?> UpdateProjectAsync(Guid userId, Guid projectId, StudentProjectRequest request)
    {
        var project = await _context.StudentProjects
            .Include(p => p.StudentProfile)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.StudentProfile.UserId == userId);

        if (project is null) return null;

        project.Title = request.Title;
        project.Description = request.Description;
        project.TechStackJson = request.TechStackJson;
        project.GithubUrl = request.GithubUrl;
        project.DemoUrl = request.DemoUrl;
        project.ImageUrl = request.ImageUrl;

        await _context.SaveChangesAsync();

        return new StudentProjectResponse
        {
            Id = project.Id,
            StudentProfileId = project.StudentProfileId,
            Title = project.Title,
            Description = project.Description,
            TechStackJson = project.TechStackJson,
            GithubUrl = project.GithubUrl,
            DemoUrl = project.DemoUrl,
            ImageUrl = project.ImageUrl,
            CreatedAt = project.CreatedAt
        };
    }

    public async Task<bool> DeleteProjectAsync(Guid userId, Guid projectId)
    {
        var project = await _context.StudentProjects
            .Include(p => p.StudentProfile)
            .FirstOrDefaultAsync(p => p.Id == projectId && p.StudentProfile.UserId == userId);

        if (project is null) return false;

        _context.StudentProjects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }
}
