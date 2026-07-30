using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;

    public BookingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<BookingResponse>> GetBookingsAsync(int page, int pageSize, Guid? facilityId, Guid? userId, BookingStatus? status)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<FacilityBooking>()
            .AsNoTracking()
            .AsQueryable();

        if (facilityId.HasValue)
        {
            query = query.Where(b => b.FacilityId == facilityId.Value);
        }

        if (userId.HasValue)
        {
            query = query.Where(b => b.BookedByUserId == userId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(b => b.Status == status.Value);
        }

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
                BookedByUserName = b.BookedByUser.FullName,
                Purpose = b.Purpose,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                RejectionReason = b.RejectionReason,
                ApprovedOrRejectedByUserId = b.ApprovedOrRejectedByUserId,
                ApprovedOrRejectedByUserName = b.ApprovedOrRejectedByUser != null ? b.ApprovedOrRejectedByUser.FullName : null,
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

    public async Task<BookingResponse?> GetBookingByIdAsync(Guid id)
    {
        return await _context.Set<FacilityBooking>()
            .AsNoTracking()
            .Where(b => b.Id == id)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                FacilityId = b.FacilityId,
                FacilityName = b.Facility.Name,
                BookedByUserId = b.BookedByUserId,
                BookedByUserName = b.BookedByUser.FullName,
                Purpose = b.Purpose,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                RejectionReason = b.RejectionReason,
                ApprovedOrRejectedByUserId = b.ApprovedOrRejectedByUserId,
                ApprovedOrRejectedByUserName = b.ApprovedOrRejectedByUser != null ? b.ApprovedOrRejectedByUser.FullName : null,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<BookingResponse> CreateBookingAsync(CreateBookingRequest request, Guid userId)
    {
        var facility = await _context.Set<Facility>()
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == request.FacilityId);

        if (facility is null)
            throw new KeyNotFoundException("Facility not found.");

        if (!facility.IsActive)
            throw new InvalidOperationException("This facility is not active and cannot be booked.");

        // Check for overlapping bookings
        var overlapping = await _context.Set<FacilityBooking>()
            .AsNoTracking()
            .AnyAsync(b => b.FacilityId == request.FacilityId 
                && b.Status != BookingStatus.Rejected 
                && request.StartTime < b.EndTime 
                && request.EndTime > b.StartTime);

        if (overlapping)
            throw new InvalidOperationException("This facility is already booked during the requested time period.");

        var booking = new FacilityBooking
        {
            Id = Guid.NewGuid(),
            FacilityId = request.FacilityId,
            BookedByUserId = userId,
            Purpose = request.Purpose,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = BookingStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<FacilityBooking>().Add(booking);
        await _context.SaveChangesAsync();

        var user = await _context.Set<User>().FindAsync(userId);

        return new BookingResponse
        {
            Id = booking.Id,
            FacilityId = booking.FacilityId,
            FacilityName = facility.Name,
            BookedByUserId = booking.BookedByUserId,
            BookedByUserName = user?.FullName ?? string.Empty,
            Purpose = booking.Purpose,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt
        };
    }

    public async Task<BookingResponse?> UpdateStatusAsync(Guid id, UpdateBookingStatusRequest request, Guid approverId)
    {
        var booking = await _context.Set<FacilityBooking>()
            .Include(b => b.Facility)
            .Include(b => b.BookedByUser)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return null;

        booking.Status = request.Status;
        booking.RejectionReason = request.Status == BookingStatus.Rejected ? request.RejectionReason : null;
        booking.ApprovedOrRejectedByUserId = approverId;
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var approver = await _context.Set<User>().FindAsync(approverId);

        return new BookingResponse
        {
            Id = booking.Id,
            FacilityId = booking.FacilityId,
            FacilityName = booking.Facility.Name,
            BookedByUserId = booking.BookedByUserId,
            BookedByUserName = booking.BookedByUser.FullName,
            Purpose = booking.Purpose,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            RejectionReason = booking.RejectionReason,
            ApprovedOrRejectedByUserId = booking.ApprovedOrRejectedByUserId,
            ApprovedOrRejectedByUserName = approver?.FullName ?? string.Empty,
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt
        };
    }

    public async Task<bool> CancelBookingAsync(Guid id, Guid userId, string userRole)
    {
        var booking = await _context.Set<FacilityBooking>()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return false;

        if (userRole != "Admin" && booking.BookedByUserId != userId)
            throw new UnauthorizedAccessException("You can only cancel your own bookings.");

        _context.Set<FacilityBooking>().Remove(booking);
        await _context.SaveChangesAsync();

        return true;
    }
}
