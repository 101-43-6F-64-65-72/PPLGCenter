using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IFacilityService
{
    Task<PagedResult<FacilityResponse>> GetFacilitiesAsync(int page, int pageSize, bool? isActive);
    Task<FacilityResponse?> GetFacilityByIdAsync(Guid id);
    Task<FacilityResponse> CreateFacilityAsync(CreateFacilityRequest request);
    Task<FacilityResponse?> UpdateFacilityAsync(Guid id, UpdateFacilityRequest request);
    Task<bool> DeleteFacilityAsync(Guid id);
    Task<List<FacilityResponse>> GetManagedFacilitiesAsync(Guid teacherId);
    Task<PagedResult<BookingResponse>> GetManagedBookingsAsync(Guid teacherId, int page, int pageSize);
}
