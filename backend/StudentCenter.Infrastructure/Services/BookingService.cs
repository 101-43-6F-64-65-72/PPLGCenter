using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<BookingService> _logger;

    public BookingService(AppDbContext context, INotificationService notificationService, ILogger<BookingService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<PagedResult<BookingResponse>> GetBookingsAsync(
        int page,
        int pageSize,
        Guid? facilityId,
        Guid? userId,
        BookingStatus? status,
        Guid? requestingUserId = null,
        string? requestingUserRole = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<FacilityBooking>()
            .AsNoTracking()
            .AsQueryable();

        if (requestingUserId.HasValue)
        {
            if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
            {
                // Students can ONLY view their own bookings.
                // Ignore any client-supplied userId or isPublic flag trying to bypass student scope.
                query = query.Where(b => b.BookedByUserId == requestingUserId.Value);
            }
            else if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                if (userId.HasValue)
                {
                    query = query.Where(b => b.BookedByUserId == userId.Value);
                }
                else
                {
                    var managedFacilityIds = await _context.FacilityManagers
                        .AsNoTracking()
                        .Where(fm => fm.ManagerUserId == requestingUserId.Value)
                        .Select(fm => fm.FacilityId)
                        .ToListAsync();

                    var legacyFacilityIds = await _context.Facilities
                        .AsNoTracking()
                        .Where(f => f.ManagerTeacherId == requestingUserId.Value)
                        .Select(f => f.Id)
                        .ToListAsync();

                    var allManagedIds = managedFacilityIds.Union(legacyFacilityIds).ToList();

                    query = query.Where(b => b.BookedByUserId == requestingUserId.Value || allManagedIds.Contains(b.FacilityId));
                }
            }
            else if (userId.HasValue)
            {
                query = query.Where(b => b.BookedByUserId == userId.Value);
            }
        }
        else if (userId.HasValue)
        {
            query = query.Where(b => b.BookedByUserId == userId.Value);
        }

        if (facilityId.HasValue)
        {
            query = query.Where(b => b.FacilityId == facilityId.Value);
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

    public async Task<BookingResponse?> GetBookingByIdAsync(
        Guid id,
        Guid? requestingUserId = null,
        string? requestingUserRole = null)
    {
        var booking = await _context.Set<FacilityBooking>()
            .Include(b => b.Facility)
            .Include(b => b.BookedByUser)
            .Include(b => b.ApprovedOrRejectedByUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return null;

        if (requestingUserId.HasValue)
        {
            bool isAdmin = string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase);
            bool isOwner = booking.BookedByUserId == requestingUserId.Value;
            bool isManager = false;

            if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                isManager = await _context.FacilityManagers
                    .AnyAsync(fm => fm.FacilityId == booking.FacilityId && fm.ManagerUserId == requestingUserId.Value)
                    || (booking.Facility != null && booking.Facility.ManagerTeacherId == requestingUserId.Value);
            }

            if (!isAdmin && !isOwner && !isManager)
            {
                throw new UnauthorizedAccessException("You are not authorized to view this booking.");
            }
        }

        return new BookingResponse
        {
            Id = booking.Id,
            FacilityId = booking.FacilityId,
            FacilityName = booking.Facility?.Name ?? string.Empty,
            BookedByUserId = booking.BookedByUserId,
            BookedByUserName = booking.BookedByUser?.FullName ?? string.Empty,
            Purpose = booking.Purpose,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            Status = booking.Status,
            RejectionReason = booking.RejectionReason,
            ApprovedOrRejectedByUserId = booking.ApprovedOrRejectedByUserId,
            ApprovedOrRejectedByUserName = booking.ApprovedOrRejectedByUser != null ? booking.ApprovedOrRejectedByUser.FullName : null,
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt
        };
    }

    public async Task<BookingResponse> CreateBookingAsync(CreateBookingRequest request, Guid userId)
    {
        if (request.StartTime >= request.EndTime)
        {
            throw new ValidationException("StartTime must be earlier than EndTime.");
        }

        if (request.StartTime < DateTime.UtcNow.AddMinutes(-5))
        {
            throw new ValidationException("Booking StartTime cannot be in the past.");
        }

        if (string.IsNullOrWhiteSpace(request.Purpose))
        {
            throw new ValidationException("Purpose is required and cannot be empty.");
        }

        var facility = await _context.Set<Facility>()
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == request.FacilityId);

        if (facility is null)
            throw new KeyNotFoundException("Facility not found.");

        if (!facility.IsActive)
            throw new InvalidOperationException("This facility is not active and cannot be booked.");

        // Cross-Module Conflict Check: Facility Booking ↔ Academic Class Schedule (Optimized Database IQueryable)
        var roomNameTrimmed = facility.Name.Trim();
        var bookingDayOfWeek = request.StartTime.DayOfWeek;
        var bookingStartTimeOfDay = request.StartTime.TimeOfDay;
        var bookingEndTimeOfDay = request.EndTime.TimeOfDay;

        var activeSemesterId = await _context.Semesters
            .AsNoTracking()
            .Where(sem => sem.IsActive && sem.AcademicYear.IsActive)
            .Select(sem => (Guid?)sem.Id)
            .FirstOrDefaultAsync();

        if (activeSemesterId.HasValue)
        {
            var conflictingSchedule = await _context.Schedules
                .AsNoTracking()
                .Where(s => s.SemesterId == activeSemesterId.Value
                    && s.IsActive
                    && s.DayOfWeek == bookingDayOfWeek
                    && s.Room.Trim().ToLower() == roomNameTrimmed.ToLower()
                    && bookingStartTimeOfDay < s.EndTime
                    && bookingEndTimeOfDay > s.StartTime)
                .FirstOrDefaultAsync();

            if (conflictingSchedule != null)
            {
                throw new InvalidOperationException($"Bentrok Jadwal Kelas: Ruangan '{facility.Name}' sedang digunakan untuk jadwal pelajaran ({conflictingSchedule.StartTime:hh\\:mm}-{conflictingSchedule.EndTime:hh\\:mm}).");
            }
        }

        int maxRetries = 3;
        for (int retry = 0; retry < maxRetries; retry++)
        {
            IDbContextTransaction? transaction = null;
            if (_context.Database.IsRelational())
            {
                transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
            }

            try
            {
                // Check for overlapping active bookings (Pending or Approved)
                var overlapping = await _context.Set<FacilityBooking>()
                    .AsNoTracking()
                    .AnyAsync(b => b.FacilityId == request.FacilityId 
                        && (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Approved) 
                        && request.StartTime < b.EndTime 
                        && request.EndTime > b.StartTime);

                if (overlapping)
                    throw new InvalidOperationException("This facility is already booked during the requested time period.");

                var booking = new FacilityBooking
                {
                    Id = Guid.NewGuid(),
                    FacilityId = request.FacilityId,
                    BookedByUserId = userId,
                    Purpose = request.Purpose.Trim(),
                    StartTime = request.StartTime,
                    EndTime = request.EndTime,
                    Status = BookingStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Set<FacilityBooking>().Add(booking);
                await _context.SaveChangesAsync();

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

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
            catch (DbUpdateException ex)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }

                if (retry == maxRetries - 1)
                {
                    _logger.LogWarning(ex, "Concurrency conflict during facility booking creation for facility {FacilityId}", request.FacilityId);
                    throw new InvalidOperationException("A concurrency conflict occurred while processing your booking. Please try again.");
                }

                await Task.Delay(20 * (retry + 1));
            }
            catch (InvalidOperationException)
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
            catch
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
            finally
            {
                if (transaction != null)
                {
                    await transaction.DisposeAsync();
                }
            }
        }

        throw new InvalidOperationException("A concurrency conflict occurred while processing your booking. Please try again.");
    }

    public async Task<BookingResponse?> UpdateStatusAsync(Guid id, UpdateBookingStatusRequest request, Guid approverId, string approverRole = "Admin")
    {
        var booking = await _context.Set<FacilityBooking>()
            .Include(b => b.Facility)
            .Include(b => b.BookedByUser)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return null;

        if (string.Equals(approverRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Students are not allowed to approve or reject facility bookings.");
        }

        if (!string.Equals(approverRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            var isFacilityManager = await _context.FacilityManagers
                .AnyAsync(fm => fm.FacilityId == booking.FacilityId && fm.ManagerUserId == approverId)
                || booking.Facility.ManagerTeacherId == approverId;

            if (!isFacilityManager)
            {
                throw new UnauthorizedAccessException("You can only approve or reject bookings for facilities you manage.");
            }
        }

        if (booking.Status != BookingStatus.Pending)
            throw new InvalidOperationException("Only pending bookings can be updated.");

        if (request.Status != BookingStatus.Approved && request.Status != BookingStatus.Rejected)
            throw new InvalidOperationException("Invalid status transition.");

        booking.Status = request.Status;
        booking.RejectionReason = request.Status == BookingStatus.Rejected ? request.RejectionReason : null;
        booking.ApprovedOrRejectedByUserId = approverId;
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (request.Status == BookingStatus.Approved)
        {
            await _notificationService.NotifyUserAsync(
                booking.BookedByUserId,
                $"Booking Approved: {booking.Facility.Name}",
                $"Your booking for {booking.Facility.Name} from {booking.StartTime:yyyy-MM-dd HH:mm} to {booking.EndTime:yyyy-MM-dd HH:mm} has been approved.",
                NotificationType.Booking,
                booking.Id.ToString(),
                "Booking"
            );
        }
        else if (request.Status == BookingStatus.Rejected)
        {
            await _notificationService.NotifyUserAsync(
                booking.BookedByUserId,
                $"Booking Rejected: {booking.Facility.Name}",
                $"Your booking for {booking.Facility.Name} has been rejected. Reason: {request.RejectionReason}",
                NotificationType.Booking,
                booking.Id.ToString(),
                "Booking"
            );
        }

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
            .Include(b => b.Facility)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking is null)
            return false;

        bool isOwner = booking.BookedByUserId == userId;
        bool isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
        bool isFacilityManager = false;

        if (string.Equals(userRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            isFacilityManager = await _context.FacilityManagers
                .AnyAsync(fm => fm.FacilityId == booking.FacilityId && fm.ManagerUserId == userId)
                || (booking.Facility != null && booking.Facility.ManagerTeacherId == userId);
        }

        if (!isAdmin && !isOwner && !isFacilityManager)
            throw new UnauthorizedAccessException("You can only cancel your own bookings or bookings for facilities you manage.");

        if (booking.Status == BookingStatus.Cancelled)
        {
            throw new InvalidOperationException("Peminjaman ini sudah dibatalkan sebelumnya.");
        }

        if (booking.Status == BookingStatus.Rejected)
        {
            throw new InvalidOperationException("Peminjaman yang sudah ditolak tidak dapat dibatalkan.");
        }

        if (booking.Status == BookingStatus.Approved && booking.EndTime <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Peminjaman yang sudah selesai tidak dapat dibatalkan.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return true;
    }
}
