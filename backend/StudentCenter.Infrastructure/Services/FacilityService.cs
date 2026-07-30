using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class FacilityService : IFacilityService
{
    private readonly AppDbContext _context;

    public FacilityService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<FacilityResponse>> GetFacilitiesAsync(int page, int pageSize, bool? isActive)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Facility>()
            .AsNoTracking()
            .AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(f => f.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(f => f.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FacilityResponse
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                Location = f.Location,
                Capacity = f.Capacity,
                IsActive = f.IsActive,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<FacilityResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<FacilityResponse?> GetFacilityByIdAsync(Guid id)
    {
        return await _context.Set<Facility>()
            .AsNoTracking()
            .Where(f => f.Id == id)
            .Select(f => new FacilityResponse
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                Location = f.Location,
                Capacity = f.Capacity,
                IsActive = f.IsActive,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<FacilityResponse> CreateFacilityAsync(CreateFacilityRequest request)
    {
        var facility = new Facility
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Location = request.Location,
            Capacity = request.Capacity,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<Facility>().Add(facility);
        await _context.SaveChangesAsync();

        return new FacilityResponse
        {
            Id = facility.Id,
            Name = facility.Name,
            Description = facility.Description,
            Location = facility.Location,
            Capacity = facility.Capacity,
            IsActive = facility.IsActive,
            CreatedAt = facility.CreatedAt,
            UpdatedAt = facility.UpdatedAt
        };
    }

    public async Task<FacilityResponse?> UpdateFacilityAsync(Guid id, UpdateFacilityRequest request)
    {
        var facility = await _context.Set<Facility>()
            .FirstOrDefaultAsync(f => f.Id == id);

        if (facility is null)
            return null;

        facility.Name = request.Name;
        facility.Description = request.Description;
        facility.Location = request.Location;
        facility.Capacity = request.Capacity;
        facility.IsActive = request.IsActive;
        facility.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new FacilityResponse
        {
            Id = facility.Id,
            Name = facility.Name,
            Description = facility.Description,
            Location = facility.Location,
            Capacity = facility.Capacity,
            IsActive = facility.IsActive,
            CreatedAt = facility.CreatedAt,
            UpdatedAt = facility.UpdatedAt
        };
    }

    public async Task<bool> DeleteFacilityAsync(Guid id)
    {
        var facility = await _context.Set<Facility>()
            .FirstOrDefaultAsync(f => f.Id == id);

        if (facility is null)
            return false;

        _context.Set<Facility>().Remove(facility);
        await _context.SaveChangesAsync();

        return true;
    }
}
