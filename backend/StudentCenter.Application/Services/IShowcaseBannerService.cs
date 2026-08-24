using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IShowcaseBannerService
{
    Task<List<ShowcaseBannerResponse>> GetActiveBannersAsync();
    Task<List<ShowcaseBannerResponse>> GetAllBannersAsync();
    Task<ShowcaseBannerResponse?> GetBannerByIdAsync(Guid id);
    Task<ShowcaseBannerResponse> CreateBannerAsync(CreateShowcaseBannerRequest request);
    Task<ShowcaseBannerResponse> UpdateBannerAsync(Guid id, UpdateShowcaseBannerRequest request);
    Task<bool> DeleteBannerAsync(Guid id, bool permanent = false);
    Task<ShowcaseBannerResponse> RestoreBannerAsync(Guid id);
    Task<bool> ReorderBannersAsync(ReorderShowcaseBannersRequest request);
    Task<ShowcaseBannerResponse> AddFromAnnouncementAsync(Guid announcementId);
}
