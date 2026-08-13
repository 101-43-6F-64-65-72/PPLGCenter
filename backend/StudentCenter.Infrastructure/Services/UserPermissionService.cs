using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class UserPermissionService : IUserPermissionService
{
    private readonly AppDbContext _context;

    public UserPermissionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserPermissionResponse>> GetUserPermissionsAsync(Guid userId)
    {
        return await _context.UserPermissions
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .Select(p => new UserPermissionResponse
            {
                Id = p.Id,
                UserId = p.UserId,
                Capability = p.Capability,
                GrantedAt = p.GrantedAt,
                GrantedByUserId = p.GrantedByUserId
            })
            .ToListAsync();
    }

    public async Task<bool> HasCapabilityAsync(Guid userId, string capability)
    {
        return await _context.UserPermissions
            .AsNoTracking()
            .AnyAsync(p => p.UserId == userId && p.Capability.ToLower() == capability.ToLower());
    }

    public async Task<UserPermissionResponse> GrantPermissionAsync(GrantPermissionRequest request, Guid grantedByUserId)
    {
        var existing = await _context.UserPermissions
            .FirstOrDefaultAsync(p => p.UserId == request.UserId && p.Capability.ToLower() == request.Capability.ToLower());

        if (existing is not null)
        {
            return new UserPermissionResponse
            {
                Id = existing.Id,
                UserId = existing.UserId,
                Capability = existing.Capability,
                GrantedAt = existing.GrantedAt,
                GrantedByUserId = existing.GrantedByUserId
            };
        }

        var perm = new UserPermission
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Capability = request.Capability.ToLower(),
            GrantedAt = DateTime.UtcNow,
            GrantedByUserId = grantedByUserId
        };

        _context.UserPermissions.Add(perm);
        await _context.SaveChangesAsync();

        return new UserPermissionResponse
        {
            Id = perm.Id,
            UserId = perm.UserId,
            Capability = perm.Capability,
            GrantedAt = perm.GrantedAt,
            GrantedByUserId = perm.GrantedByUserId
        };
    }

    public async Task<bool> RevokePermissionAsync(Guid userId, string capability)
    {
        var perm = await _context.UserPermissions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Capability.ToLower() == capability.ToLower());

        if (perm is null) return false;

        _context.UserPermissions.Remove(perm);
        await _context.SaveChangesAsync();
        return true;
    }
}
