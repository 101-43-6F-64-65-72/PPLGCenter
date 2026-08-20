using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Application.Helpers;

namespace StudentCenter.Infrastructure.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AnnouncementService> _logger;

    public AnnouncementService(AppDbContext context, INotificationService notificationService, ILogger<AnnouncementService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    private async Task<bool> IsUserAuthorizedForAnnouncementAsync(
        Announcement announcement,
        Guid? requestingUserId,
        string? requestingUserRole,
        Guid? requestingClassId)
    {
        // Admin & Teachers (both PPLG and non-PPLG) can see all announcements
        if (string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Student filtering
        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var now = DateTime.UtcNow;

            // Date-time publish window check with timezone margin tolerance (allows immediate viewing if start date is today)
            if (announcement.PublishStart.HasValue && now.AddHours(14) < announcement.PublishStart.Value)
            {
                return false;
            }

            if (announcement.PublishEnd.HasValue && now > announcement.PublishEnd.Value)
            {
                return false;
            }

            // Target classes check
            var target = announcement.TargetClasses?.Trim();
            if (string.IsNullOrWhiteSpace(target) ||
                string.Equals(target, "Semua Kelas", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(target, "All", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Fetch student class name with fallback lookup by ClassId
            string? studentClassName = null;
            if (requestingUserId.HasValue)
            {
                var studentUser = await _context.Users.AsNoTracking().Include(u => u.Class).FirstOrDefaultAsync(u => u.Id == requestingUserId.Value);
                if (studentUser != null)
                {
                    studentClassName = studentUser.Class?.Name?.Trim();
                    if (string.IsNullOrWhiteSpace(studentClassName) && studentUser.ClassId.HasValue)
                    {
                        var cls = await _context.SchoolClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == studentUser.ClassId.Value);
                        studentClassName = cls?.Name?.Trim();
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(studentClassName))
            {
                var targets = target.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim());
                
                foreach (var t in targets)
                {
                    // 1. Exact match (case insensitive)
                    if (string.Equals(t, studentClassName, StringComparison.OrdinalIgnoreCase)) return true;

                    // 2. Normalized hyphens/spaces (e.g. "X PPLG-A" vs "X PPLG A")
                    var normT = t.Replace("-", " ").Replace("  ", " ");
                    var normStudentClass = studentClassName.Replace("-", " ").Replace("  ", " ");
                    if (string.Equals(normT, normStudentClass, StringComparison.OrdinalIgnoreCase)) return true;

                    // 3. General / All Classes keywords
                    if (normT.Equals("Semua", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("Semua Kelas", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("All", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("General", StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    // 4. Grade-level targeting (e.g., "Semua Kelas X", "Kelas X", "X PPLG", "Kelas 10", "X")
                    if (normT.Contains("Kelas X", StringComparison.OrdinalIgnoreCase) ||
                        normT.Contains("Semua X", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("X PPLG", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("X", StringComparison.OrdinalIgnoreCase))
                    {
                        if (normStudentClass.StartsWith("X ", StringComparison.OrdinalIgnoreCase) || normStudentClass.StartsWith("X-", StringComparison.OrdinalIgnoreCase)) return true;
                    }

                    if (normT.Contains("Kelas XI", StringComparison.OrdinalIgnoreCase) ||
                        normT.Contains("Semua XI", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("XI PPLG", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("XI", StringComparison.OrdinalIgnoreCase))
                    {
                        if (normStudentClass.StartsWith("XI ", StringComparison.OrdinalIgnoreCase) || normStudentClass.StartsWith("XI-", StringComparison.OrdinalIgnoreCase)) return true;
                    }

                    if (normT.Contains("Kelas XII", StringComparison.OrdinalIgnoreCase) ||
                        normT.Contains("Semua XII", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("XII PPLG", StringComparison.OrdinalIgnoreCase) ||
                        normT.Equals("XII", StringComparison.OrdinalIgnoreCase))
                    {
                        if (normStudentClass.StartsWith("XII ", StringComparison.OrdinalIgnoreCase) || normStudentClass.StartsWith("XII-", StringComparison.OrdinalIgnoreCase)) return true;
                    }

                    // 5. Substring match
                    if (normStudentClass.Contains(normT, StringComparison.OrdinalIgnoreCase) || normT.Contains(normStudentClass, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        return true;
    }

    public async Task<PagedResult<AnnouncementResponse>> GetAnnouncementsAsync(
        int page,
        int pageSize,
        string? category,
        Guid? requestingUserId = null,
        string? requestingUserRole = null,
        Guid? requestingClassId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var rawList = await _context.Set<Announcement>()
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(category))
        {
            rawList = rawList.Where(a => string.Equals(a.Category, category, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        // Server-side deterministic recipient filtering
        var authorizedItems = new List<Announcement>();
        foreach (var item in rawList)
        {
            if (await IsUserAuthorizedForAnnouncementAsync(item, requestingUserId, requestingUserRole, requestingClassId))
            {
                authorizedItems.Add(item);
            }
        }

        var totalCount = authorizedItems.Count;

        var items = authorizedItems
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AnnouncementResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Category = a.Category,
                TargetClasses = a.TargetClasses,
                PublishStart = a.PublishStart,
                PublishEnd = a.PublishEnd,
                CoverImageUrl = FileUrlHelper.ResolveUrl(a.CoverImageUrl),
                IsPinned = a.IsPinned,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser != null ? a.CreatedByUser.FullName : string.Empty,
                ReactionCount = a.Reactions.Count,
                CommentCount = a.Comments.Count
            })
            .ToList();

        return new PagedResult<AnnouncementResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResult<AnnouncementFeedResponse>> GetFeedAsync(
        int page,
        int pageSize,
        string? category,
        Guid? requestingUserId = null,
        string? requestingUserRole = null,
        Guid? requestingClassId = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var rawList = await _context.Set<Announcement>()
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .Include(a => a.Comments)
                .ThenInclude(c => c.User)
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(category))
        {
            rawList = rawList.Where(a => string.Equals(a.Category, category, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        var authorizedItems = new List<Announcement>();
        foreach (var item in rawList)
        {
            if (await IsUserAuthorizedForAnnouncementAsync(item, requestingUserId, requestingUserRole, requestingClassId))
            {
                authorizedItems.Add(item);
            }
        }

        var totalCount = authorizedItems.Count;

        var items = authorizedItems
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AnnouncementFeedResponse
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                Category = a.Category,
                TargetClasses = a.TargetClasses,
                PublishStart = a.PublishStart,
                PublishEnd = a.PublishEnd,
                CoverImageUrl = FileUrlHelper.ResolveUrl(a.CoverImageUrl),
                IsPinned = a.IsPinned,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt,
                CreatedByUserId = a.CreatedByUserId,
                CreatedByUserName = a.CreatedByUser != null ? a.CreatedByUser.FullName : string.Empty,
                ReactionCount = a.Reactions.Count,
                CommentCount = a.Comments.Count,
                LatestComments = a.Comments
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(3)
                    .Select(c => new CommentResponse
                    {
                        Id = c.Id,
                        Content = c.Content,
                        CreatedAt = c.CreatedAt,
                        AnnouncementId = c.AnnouncementId,
                        UserId = c.UserId,
                        UserName = c.User != null ? c.User.FullName : string.Empty
                    })
                    .ToList()
            })
            .ToList();

        return new PagedResult<AnnouncementFeedResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AnnouncementResponse?> GetAnnouncementByIdAsync(
        Guid id,
        Guid? requestingUserId = null,
        string? requestingUserRole = null,
        Guid? requestingClassId = null)
    {
        var announcement = await _context.Set<Announcement>()
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null)
            return null;

        bool isAuthorized = await IsUserAuthorizedForAnnouncementAsync(announcement, requestingUserId, requestingUserRole, requestingClassId);
        if (!isAuthorized)
        {
            throw new UnauthorizedAccessException("Forbidden. You do not have permission to access this announcement.");
        }

        return new AnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Content = announcement.Content,
            Category = announcement.Category,
            TargetClasses = announcement.TargetClasses,
            PublishStart = announcement.PublishStart,
            PublishEnd = announcement.PublishEnd,
            CoverImageUrl = FileUrlHelper.ResolveUrl(announcement.CoverImageUrl),
            IsPinned = announcement.IsPinned,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByUserName = announcement.CreatedByUser != null ? announcement.CreatedByUser.FullName : string.Empty,
            ReactionCount = await _context.Set<AnnouncementReaction>().CountAsync(r => r.AnnouncementId == announcement.Id),
            CommentCount = await _context.Set<AnnouncementComment>().CountAsync(c => c.AnnouncementId == announcement.Id)
        };
    }

    public async Task<AnnouncementResponse> CreateAnnouncementAsync(CreateAnnouncementRequest request, Guid userId, string userRole = "Admin")
    {
        if (string.Equals(userRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not allowed to create announcements.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required and cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Content is required and cannot be empty.");
        }

        if (request.IsPinned && !string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Only administrators can pin announcements.");
        }

        var category = request.Category?.Trim() ?? "General";

        // Target validations
        if (category.StartsWith("Role:", StringComparison.OrdinalIgnoreCase))
        {
            var targetRole = category.Substring(5).Trim();
            if (!string.Equals(targetRole, "Student", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(targetRole, "Teacher", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(targetRole, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Invalid target role specified in category.");
            }
        }
        else if (category.StartsWith("Class:", StringComparison.OrdinalIgnoreCase))
        {
            var targetClass = category.Substring(6).Trim();
            SchoolClass? schoolClass = null;

            if (Guid.TryParse(targetClass, out var targetClassGuid))
            {
                schoolClass = await _context.SchoolClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == targetClassGuid);
            }
            else
            {
                schoolClass = await _context.SchoolClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Name.ToLower() == targetClass.ToLower());
            }

            if (schoolClass == null)
            {
                throw new ValidationException("Target class specified in category does not exist.");
            }

            // Teacher scope check for class-targeted announcements
            if (string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                bool isHomeroom = schoolClass.HomeroomTeacherId == userId;
                bool teachesClass = await _context.ClassSubjects.AsNoTracking().AnyAsync(cs => cs.ClassId == schoolClass.Id && cs.TeacherSubject.TeacherId == userId);

                if (!isHomeroom && !teachesClass)
                {
                    throw new ValidationException("Teachers can only target classes they are assigned to teach.");
                }
            }
        }

        var announcement = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim(),
            TargetClasses = request.TargetClasses,
            PublishStart = request.PublishStart,
            PublishEnd = request.PublishEnd,
            CoverImageUrl = request.CoverImageUrl,
            IsPinned = request.IsPinned,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };

        _context.Set<Announcement>().Add(announcement);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        var allUserIds = await _context.Set<User>()
            .AsNoTracking()
            .Select(u => u.Id)
            .ToListAsync();

        if (allUserIds.Count > 0)
        {
            var cleanText = System.Text.RegularExpressions.Regex.Replace(announcement.Content ?? string.Empty, "<.*?>", " ");
            cleanText = System.Net.WebUtility.HtmlDecode(cleanText);
            cleanText = System.Text.RegularExpressions.Regex.Replace(cleanText, @"\s+", " ").Trim();

            await _notificationService.NotifyUsersAsync(
                allUserIds,
                $"Pengumuman: {announcement.Title}",
                cleanText.Length > 200 ? cleanText.Substring(0, 197) + "..." : cleanText,
                NotificationType.Announcement,
                NotificationPriority.Normal,
                announcement.Id.ToString(),
                NotificationReferenceType.Announcement,
                $"/pengumuman/{announcement.Id}",
                "bullhorn",
                "#3b82f6"
            );
        }

        return new AnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Content = announcement.Content,
            Category = announcement.Category,
            TargetClasses = announcement.TargetClasses,
            PublishStart = announcement.PublishStart,
            PublishEnd = announcement.PublishEnd,
            CoverImageUrl = announcement.CoverImageUrl,
            IsPinned = announcement.IsPinned,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByUserName = user?.FullName ?? string.Empty
        };
    }

    public async Task<AnnouncementResponse?> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementRequest request, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        var announcement = await _context.Set<Announcement>()
            .Include(a => a.CreatedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null)
            return null;

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not allowed to update announcements.");
        }

        if (!string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
            requestingUserId != default &&
            announcement.CreatedByUserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("You can only update your own announcements.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required and cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new ValidationException("Content is required and cannot be empty.");
        }

        if (request.IsPinned != announcement.IsPinned && request.IsPinned && !string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Only administrators can pin announcements.");
        }

        var category = request.Category?.Trim() ?? "General";

        // Target validations
        if (category.StartsWith("Role:", StringComparison.OrdinalIgnoreCase))
        {
            var targetRole = category.Substring(5).Trim();
            if (!string.Equals(targetRole, "Student", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(targetRole, "Teacher", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(targetRole, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException("Invalid target role specified in category.");
            }
        }
        else if (category.StartsWith("Class:", StringComparison.OrdinalIgnoreCase))
        {
            var targetClass = category.Substring(6).Trim();
            SchoolClass? schoolClass = null;

            if (Guid.TryParse(targetClass, out var targetClassGuid))
            {
                schoolClass = await _context.SchoolClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Id == targetClassGuid);
            }
            else
            {
                schoolClass = await _context.SchoolClasses.AsNoTracking().FirstOrDefaultAsync(c => c.Name.ToLower() == targetClass.ToLower());
            }

            if (schoolClass == null)
            {
                throw new ValidationException("Target class specified in category does not exist.");
            }

            // Teacher scope check for class-targeted announcements
            if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                bool isHomeroom = schoolClass.HomeroomTeacherId == requestingUserId;
                bool teachesClass = await _context.ClassSubjects.AsNoTracking().AnyAsync(cs => cs.ClassId == schoolClass.Id && cs.TeacherSubject.TeacherId == requestingUserId);

                if (!isHomeroom && !teachesClass)
                {
                    throw new ValidationException("Teachers can only target classes they are assigned to teach.");
                }
            }
        }

        announcement.Title = request.Title.Trim();
        announcement.Content = request.Content.Trim();
        announcement.Category = string.IsNullOrWhiteSpace(request.Category) ? "General" : request.Category.Trim();
        announcement.TargetClasses = request.TargetClasses;
        announcement.PublishStart = request.PublishStart;
        announcement.PublishEnd = request.PublishEnd;
        announcement.CoverImageUrl = request.CoverImageUrl;
        announcement.IsPinned = request.IsPinned;
        announcement.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AnnouncementResponse
        {
            Id = announcement.Id,
            Title = announcement.Title,
            Content = announcement.Content,
            Category = announcement.Category,
            TargetClasses = announcement.TargetClasses,
            PublishStart = announcement.PublishStart,
            PublishEnd = announcement.PublishEnd,
            CoverImageUrl = announcement.CoverImageUrl,
            IsPinned = announcement.IsPinned,
            CreatedAt = announcement.CreatedAt,
            UpdatedAt = announcement.UpdatedAt,
            CreatedByUserId = announcement.CreatedByUserId,
            CreatedByUserName = announcement.CreatedByUser != null ? announcement.CreatedByUser.FullName : string.Empty
        };
    }

    public async Task<bool> DeleteAnnouncementAsync(Guid id, Guid requestingUserId = default, string requestingUserRole = "Admin")
    {
        var announcement = await _context.Set<Announcement>()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (announcement is null)
            return false;

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not allowed to delete announcements.");
        }

        if (!string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase) &&
            requestingUserId != default &&
            announcement.CreatedByUserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("You can only delete your own announcements.");
        }

        // Remove child comments and reactions first to prevent Foreign Key constraint 500 errors
        var comments = await _context.Set<AnnouncementComment>()
            .Where(c => c.AnnouncementId == id)
            .ToListAsync();
        if (comments.Count > 0)
        {
            _context.Set<AnnouncementComment>().RemoveRange(comments);
        }

        var reactions = await _context.Set<AnnouncementReaction>()
            .Where(r => r.AnnouncementId == id)
            .ToListAsync();
        if (reactions.Count > 0)
        {
            _context.Set<AnnouncementReaction>().RemoveRange(reactions);
        }

        _context.Set<Announcement>().Remove(announcement);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<PagedResult<AnnouncementResponse>> SearchAsync(int page, int pageSize, string? keyword = null, bool? isPinned = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Announcement>()
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var searchTerm = keyword.ToLower();
            query = query.Where(a => a.Title.ToLower().Contains(searchTerm) || a.Content.ToLower().Contains(searchTerm));
        }

        if (isPinned.HasValue)
        {
            query = query.Where(a => a.IsPinned == isPinned.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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
                CreatedByUserName = a.CreatedByUser != null ? a.CreatedByUser.FullName : string.Empty
            })
            .ToListAsync();

        return new PagedResult<AnnouncementResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
