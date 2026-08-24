using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Application.Helpers;

namespace StudentCenter.Infrastructure.Services;

public class ShowcaseBannerService : IShowcaseBannerService
{
    private readonly AppDbContext _context;
    private const int MAX_ACTIVE_BANNERS = 5;

    public ShowcaseBannerService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ShowcaseBannerResponse>> GetActiveBannersAsync()
    {
        var banners = await _context.ShowcaseBanners
            .AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Order)
            .ThenByDescending(b => b.CreatedAt)
            .Take(MAX_ACTIVE_BANNERS)
            .ToListAsync();

        return banners.Select(MapToResponse).ToList();
    }

    public async Task<List<ShowcaseBannerResponse>> GetAllBannersAsync()
    {
        var banners = await _context.ShowcaseBanners
            .AsNoTracking()
            .OrderByDescending(b => b.IsActive)
            .ThenBy(b => b.Order)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync();

        return banners.Select(MapToResponse).ToList();
    }

    public async Task<ShowcaseBannerResponse?> GetBannerByIdAsync(Guid id)
    {
        var banner = await _context.ShowcaseBanners
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        return banner == null ? null : MapToResponse(banner);
    }

    public async Task<ShowcaseBannerResponse> CreateBannerAsync(CreateShowcaseBannerRequest request)
    {
        if (request.IsActive)
        {
            var activeCount = await _context.ShowcaseBanners.CountAsync(b => b.IsActive);
            if (activeCount >= MAX_ACTIVE_BANNERS)
            {
                throw new InvalidOperationException($"Maksimal {MAX_ACTIVE_BANNERS} banner aktif telah tercapai. Nonaktifkan atau hapus salah satu banner terlebih dahulu.");
            }
        }

        var maxOrder = await _context.ShowcaseBanners
            .Where(b => b.IsActive)
            .MaxAsync(b => (int?)b.Order) ?? 0;

        var banner = new ShowcaseBanner
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            ImageUrl = request.ImageUrl.Trim(),
            LinkUrl = string.IsNullOrWhiteSpace(request.LinkUrl) ? null : request.LinkUrl.Trim(),
            ButtonText = string.IsNullOrWhiteSpace(request.ButtonText) ? null : request.ButtonText.Trim(),
            AnnouncementId = request.AnnouncementId,
            Order = request.Order > 0 ? request.Order : maxOrder + 1,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ShowcaseBanners.Add(banner);
        await _context.SaveChangesAsync();

        return MapToResponse(banner);
    }

    public async Task<ShowcaseBannerResponse> AddFromAnnouncementAsync(Guid announcementId)
    {
        var activeCount = await _context.ShowcaseBanners.CountAsync(b => b.IsActive);
        if (activeCount >= MAX_ACTIVE_BANNERS)
        {
            throw new InvalidOperationException($"Maksimal {MAX_ACTIVE_BANNERS} banner aktif telah tercapai. Nonaktifkan atau hapus salah satu banner terlebih dahulu.");
        }

        var announcement = await _context.Announcements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == announcementId);

        if (announcement == null)
        {
            throw new KeyNotFoundException("Pengumuman tidak ditemukan.");
        }

        var maxOrder = await _context.ShowcaseBanners
            .Where(b => b.IsActive)
            .MaxAsync(b => (int?)b.Order) ?? 0;

        var banner = new ShowcaseBanner
        {
            Id = Guid.NewGuid(),
            Title = announcement.Title,
            Description = announcement.Content,
            ImageUrl = !string.IsNullOrWhiteSpace(announcement.CoverImageUrl) 
                ? announcement.CoverImageUrl 
                : "/images/tempat/halamandepansmkn2ska.jpg",
            LinkUrl = $"/pengumuman/{announcement.Id}",
            ButtonText = "Baca Pengumuman",
            AnnouncementId = announcement.Id,
            Order = maxOrder + 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ShowcaseBanners.Add(banner);
        await _context.SaveChangesAsync();

        return MapToResponse(banner);
    }

    public async Task<ShowcaseBannerResponse> UpdateBannerAsync(Guid id, UpdateShowcaseBannerRequest request)
    {
        var banner = await _context.ShowcaseBanners.FindAsync(id);
        if (banner == null)
        {
            throw new KeyNotFoundException("Banner showcase tidak ditemukan.");
        }

        if (!banner.IsActive && request.IsActive)
        {
            var activeCount = await _context.ShowcaseBanners.CountAsync(b => b.IsActive);
            if (activeCount >= MAX_ACTIVE_BANNERS)
            {
                throw new InvalidOperationException($"Maksimal {MAX_ACTIVE_BANNERS} banner aktif telah tercapai. Nonaktifkan atau hapus salah satu banner terlebih dahulu.");
            }
        }

        banner.Title = request.Title.Trim();
        banner.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        banner.ImageUrl = request.ImageUrl.Trim();
        banner.LinkUrl = string.IsNullOrWhiteSpace(request.LinkUrl) ? null : request.LinkUrl.Trim();
        banner.ButtonText = string.IsNullOrWhiteSpace(request.ButtonText) ? null : request.ButtonText.Trim();
        banner.Order = request.Order;
        banner.IsActive = request.IsActive;
        banner.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(banner);
    }

    public async Task<bool> DeleteBannerAsync(Guid id, bool permanent = false)
    {
        var banner = await _context.ShowcaseBanners.FindAsync(id);
        if (banner == null) return false;

        if (permanent)
        {
            _context.ShowcaseBanners.Remove(banner);
        }
        else
        {
            banner.IsActive = false;
            banner.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ShowcaseBannerResponse> RestoreBannerAsync(Guid id)
    {
        var banner = await _context.ShowcaseBanners.FindAsync(id);
        if (banner == null)
        {
            throw new KeyNotFoundException("Banner showcase tidak ditemukan.");
        }

        var activeCount = await _context.ShowcaseBanners.CountAsync(b => b.IsActive);
        if (activeCount >= MAX_ACTIVE_BANNERS)
        {
            throw new InvalidOperationException($"Maksimal {MAX_ACTIVE_BANNERS} banner aktif telah tercapai. Nonaktifkan atau hapus salah satu banner aktif terlebih dahulu.");
        }

        var maxOrder = await _context.ShowcaseBanners
            .Where(b => b.IsActive)
            .MaxAsync(b => (int?)b.Order) ?? 0;

        banner.IsActive = true;
        banner.Order = maxOrder + 1;
        banner.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToResponse(banner);
    }

    public async Task<bool> ReorderBannersAsync(ReorderShowcaseBannersRequest request)
    {
        if (request.OrderedBannerIds == null || request.OrderedBannerIds.Count == 0)
            return false;

        var banners = await _context.ShowcaseBanners.ToListAsync();
        for (int i = 0; i < request.OrderedBannerIds.Count; i++)
        {
            var id = request.OrderedBannerIds[i];
            var banner = banners.FirstOrDefault(b => b.Id == id);
            if (banner != null)
            {
                banner.Order = i + 1;
                banner.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static ShowcaseBannerResponse MapToResponse(ShowcaseBanner b)
    {
        return new ShowcaseBannerResponse
        {
            Id = b.Id,
            Title = b.Title,
            Description = b.Description,
            ImageUrl = FileUrlHelper.ResolveUrl(b.ImageUrl),
            LinkUrl = b.LinkUrl,
            ButtonText = b.ButtonText,
            AnnouncementId = b.AnnouncementId,
            Order = b.Order,
            IsActive = b.IsActive,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt
        };
    }
}
