using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IBookingService
{
    Task<PagedResult<BookingResponse>> GetBookingsAsync(int page, int pageSize, Guid? facilityId, Guid? userId, Domain.Enums.BookingStatus? status);
    Task<BookingResponse?> GetBookingByIdAsync(Guid id);
    Task<BookingResponse> CreateBookingAsync(CreateBookingRequest request, Guid userId);
    Task<BookingResponse?> UpdateStatusAsync(Guid id, UpdateBookingStatusRequest request, Guid approverId);
    Task<bool> CancelBookingAsync(Guid id, Guid userId, string userRole);
}
