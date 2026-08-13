using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Application.Helpers;

namespace StudentCenter.Infrastructure.Services;

public class FacilityService : IFacilityService
{
    private readonly AppDbContext _context;
    private readonly ILogger<FacilityService> _logger;

    public FacilityService(AppDbContext context, ILogger<FacilityService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static FacilityResponse MapFacility(Facility f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Description = f.Description,
        Location = f.Location,
        Capacity = f.Capacity,
        ImageUrl = FileUrlHelper.ResolveUrl(f.ImageUrl),
        Category = f.Category,
        IsActive = f.IsActive,
        ManagerTeacherId = f.ManagerTeacherId,
        ManagerTeacherName = f.ManagerTeacher != null
            ? (f.ManagerTeacher.FullName ?? f.ManagerTeacher.Username)
            : null,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };

    // ─── Get All ──────────────────────────────────────────────────────────────

    public async Task<PagedResult<FacilityResponse>> GetFacilitiesAsync(int page, int pageSize, bool? isActive)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Facilities
            .Include(f => f.ManagerTeacher)
            .AsNoTracking()
            .AsQueryable();

        if (isActive.HasValue)
            query = query.Where(f => f.IsActive == isActive.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(f => f.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<FacilityResponse>
        {
            Items = items.Select(MapFacility).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    // ─── Get By Id ────────────────────────────────────────────────────────────

    public async Task<FacilityResponse?> GetFacilityByIdAsync(Guid id)
    {
        var f = await _context.Facilities
            .Include(f => f.ManagerTeacher)
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);

        return f is null ? null : MapFacility(f);
    }

    // ─── Create ───────────────────────────────────────────────────────────────

    public async Task<FacilityResponse> CreateFacilityAsync(CreateFacilityRequest request)
    {
        var facility = new Facility
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Location = request.Location,
            Capacity = request.Capacity,
            ImageUrl = request.ImageUrl,
            Category = request.Category,
            IsActive = request.IsActive,
            ManagerTeacherId = request.ManagerTeacherId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Facilities.Add(facility);

        if (request.ManagerTeacherId.HasValue)
        {
            _context.FacilityManagers.Add(new FacilityManager
            {
                Id = Guid.NewGuid(),
                FacilityId = facility.Id,
                ManagerUserId = request.ManagerTeacherId.Value,
                AssignedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        var created = await _context.Facilities
            .Include(f => f.ManagerTeacher)
            .AsNoTracking()
            .FirstAsync(f => f.Id == facility.Id);

        return MapFacility(created);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    public async Task<FacilityResponse?> UpdateFacilityAsync(Guid id, UpdateFacilityRequest request)
    {
        var facility = await _context.Facilities
            .FirstOrDefaultAsync(f => f.Id == id);

        if (facility is null)
            return null;

        facility.Name = request.Name;
        facility.Description = request.Description;
        facility.Location = request.Location;
        facility.Capacity = request.Capacity;
        facility.ImageUrl = request.ImageUrl;
        facility.Category = request.Category;
        facility.IsActive = request.IsActive;
        facility.ManagerTeacherId = request.ManagerTeacherId;
        facility.UpdatedAt = DateTime.UtcNow;

        if (request.ManagerTeacherId.HasValue)
        {
            var exists = await _context.FacilityManagers
                .AnyAsync(fm => fm.FacilityId == id && fm.ManagerUserId == request.ManagerTeacherId.Value);

            if (!exists)
            {
                _context.FacilityManagers.Add(new FacilityManager
                {
                    Id = Guid.NewGuid(),
                    FacilityId = id,
                    ManagerUserId = request.ManagerTeacherId.Value,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        var updated = await _context.Facilities
            .Include(f => f.ManagerTeacher)
            .AsNoTracking()
            .FirstAsync(f => f.Id == id);

        return MapFacility(updated);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    public async Task<bool> DeleteFacilityAsync(Guid id)
    {
        var facility = await _context.Facilities
            .FirstOrDefaultAsync(f => f.Id == id);

        if (facility is null)
            return false;

        _context.Facilities.Remove(facility);
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── Get Managed Facilities (Multi-Manager + Legacy Fallback) ─────────────

    public async Task<List<FacilityResponse>> GetManagedFacilitiesAsync(Guid teacherId)
    {
        // Query FacilityManagers table as primary authoritative source
        var managerFacilityIds = await _context.FacilityManagers
            .AsNoTracking()
            .Where(fm => fm.ManagerUserId == teacherId)
            .Select(fm => fm.FacilityId)
            .ToListAsync();

        var facilities = await _context.Facilities
            .Include(f => f.ManagerTeacher)
            .AsNoTracking()
            .Where(f => (managerFacilityIds.Contains(f.Id) || f.ManagerTeacherId == teacherId) && !f.IsDeleted)
            .OrderBy(f => f.Name)
            .ToListAsync();

        return facilities.Select(MapFacility).ToList();
    }

    // ─── Get Managed Bookings (Multi-Manager) ─────────────────────────────────

    public async Task<PagedResult<BookingResponse>> GetManagedBookingsAsync(Guid teacherId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 200) pageSize = 200;

        var managerFacilityIds = await _context.FacilityManagers
            .AsNoTracking()
            .Where(fm => fm.ManagerUserId == teacherId)
            .Select(fm => fm.FacilityId)
            .ToListAsync();

        var legacyFacilityIds = await _context.Facilities
            .AsNoTracking()
            .Where(f => f.ManagerTeacherId == teacherId && !f.IsDeleted)
            .Select(f => f.Id)
            .ToListAsync();

        var allManagedIds = managerFacilityIds.Union(legacyFacilityIds).ToList();

        var query = _context.FacilityBookings
            .Include(b => b.Facility)
            .Include(b => b.BookedByUser)
            .Include(b => b.ApprovedOrRejectedByUser)
            .AsNoTracking()
            .Where(b => allManagedIds.Contains(b.FacilityId));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(b => b.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                FacilityId = b.FacilityId,
                FacilityName = b.Facility.Name,
                BookedByUserId = b.BookedByUserId,
                BookedByUserName = b.BookedByUser.FullName ?? b.BookedByUser.Username,
                Purpose = b.Purpose,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                RejectionReason = b.RejectionReason,
                ApprovedOrRejectedByUserId = b.ApprovedOrRejectedByUserId,
                ApprovedOrRejectedByUserName = b.ApprovedOrRejectedByUser != null
                    ? (b.ApprovedOrRejectedByUser.FullName ?? b.ApprovedOrRejectedByUser.Username)
                    : null,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<BookingResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    // ─── Multi-Manager Assignment Operations ──────────────────────────────────

    public async Task<bool> AssignManagerAsync(Guid facilityId, Guid managerUserId)
    {
        var facility = await _context.Facilities.FirstOrDefaultAsync(f => f.Id == facilityId);
        var userExists = await _context.Users.AnyAsync(u => u.Id == managerUserId);

        if (facility is null || !userExists)
            return false;

        var existing = await _context.FacilityManagers
            .FirstOrDefaultAsync(fm => fm.FacilityId == facilityId && fm.ManagerUserId == managerUserId);

        if (existing is null)
        {
            _context.FacilityManagers.Add(new FacilityManager
            {
                Id = Guid.NewGuid(),
                FacilityId = facilityId,
                ManagerUserId = managerUserId,
                AssignedAt = DateTime.UtcNow
            });
        }

        // Sync legacy scalar field if empty
        if (!facility.ManagerTeacherId.HasValue)
        {
            facility.ManagerTeacherId = managerUserId;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveManagerAsync(Guid facilityId, Guid managerUserId)
    {
        var facility = await _context.Facilities.FirstOrDefaultAsync(f => f.Id == facilityId);
        var manager = await _context.FacilityManagers
            .FirstOrDefaultAsync(fm => fm.FacilityId == facilityId && fm.ManagerUserId == managerUserId);

        if (manager is null)
            return false;

        _context.FacilityManagers.Remove(manager);

        // Sync legacy scalar field if it matches the removed manager
        if (facility != null && facility.ManagerTeacherId == managerUserId)
        {
            var nextManager = await _context.FacilityManagers
                .Where(fm => fm.FacilityId == facilityId && fm.ManagerUserId != managerUserId)
                .Select(fm => (Guid?)fm.ManagerUserId)
                .FirstOrDefaultAsync();

            facility.ManagerTeacherId = nextManager;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<FacilityManagerResponse>> GetFacilityManagersAsync(Guid facilityId)
    {
        return await _context.FacilityManagers
            .Include(fm => fm.ManagerUser)
            .AsNoTracking()
            .Where(fm => fm.FacilityId == facilityId)
            .Select(fm => new FacilityManagerResponse
            {
                Id = fm.Id,
                FacilityId = fm.FacilityId,
                ManagerUserId = fm.ManagerUserId,
                ManagerName = fm.ManagerUser.FullName ?? fm.ManagerUser.Username,
                ManagerEmail = fm.ManagerUser.Email,
                AssignedAt = fm.AssignedAt
            })
            .ToListAsync();
    }
}
