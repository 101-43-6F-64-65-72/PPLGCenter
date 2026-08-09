using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AnnouncementReactionService : IAnnouncementReactionService
{
    private readonly AppDbContext _context;

    public AnnouncementReactionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> ToggleReactionAsync(Guid announcementId, string type, Guid userId)
    {
        var exists = await _context.Set<Announcement>()
            .AsNoTracking()
            .AnyAsync(a => a.Id == announcementId);

        if (!exists)
            throw new KeyNotFoundException("Announcement not found.");

        var existing = await _context.Set<AnnouncementReaction>()
            .FirstOrDefaultAsync(r => r.AnnouncementId == announcementId && r.UserId == userId);

        if (existing is not null)
        {
            _context.Set<AnnouncementReaction>().Remove(existing);
        }

        var reaction = new AnnouncementReaction
        {
            Id = Guid.NewGuid(),
            Type = type,
            CreatedAt = DateTime.UtcNow,
            AnnouncementId = announcementId,
            UserId = userId
        };

        _context.Set<AnnouncementReaction>().Add(reaction);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> RemoveReactionAsync(Guid announcementId, Guid userId)
    {
        var reaction = await _context.Set<AnnouncementReaction>()
            .FirstOrDefaultAsync(r => r.AnnouncementId == announcementId && r.UserId == userId);

        if (reaction is null)
            return false;

        _context.Set<AnnouncementReaction>().Remove(reaction);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<StudentCenter.Application.DTOs.AnnouncementReactionSummaryResponse> GetReactionSummaryAsync(Guid announcementId, Guid? userId)
    {
        var reactions = await _context.Set<AnnouncementReaction>()
            .AsNoTracking()
            .Where(r => r.AnnouncementId == announcementId)
            .ToListAsync();

        var counts = reactions
            .GroupBy(r => r.Type)
            .ToDictionary(g => g.Key, g => g.Count());

        string? userReaction = null;
        if (userId.HasValue)
        {
            userReaction = reactions.FirstOrDefault(r => r.UserId == userId.Value)?.Type;
        }

        return new StudentCenter.Application.DTOs.AnnouncementReactionSummaryResponse
        {
            AnnouncementId = announcementId,
            TotalReactions = reactions.Count,
            Counts = counts,
            UserReaction = userReaction
        };
    }
}
