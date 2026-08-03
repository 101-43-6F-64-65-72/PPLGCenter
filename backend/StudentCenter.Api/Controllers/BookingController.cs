using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ICurrentUserService _currentUserService;

    public BookingController(IBookingService bookingService, ICurrentUserService currentUserService)
    {
        _bookingService = bookingService;
        _currentUserService = currentUserService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? facilityId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] BookingStatus? status = null)
    {
        var result = await _bookingService.GetBookingsAsync(page, pageSize, facilityId, userId, status);
        return Ok(ApiResponse<PagedResult<BookingResponse>>.Ok("Bookings retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var result = await _bookingService.GetBookingByIdAsync(id);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Booking not found."));

        return Ok(ApiResponse<BookingResponse>.Ok("Booking retrieved successfully", result));
    }

    [Authorize(Roles = "Student,Teacher,OSIS")]
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _bookingService.CreateBookingAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetBooking), new { id = result.Id },
            ApiResponse<BookingResponse>.Ok("Booking created successfully", result));
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var result = await _bookingService.UpdateStatusAsync(id, request, userId.Value);

        if (result is null)
            return NotFound(ApiResponse<object>.Fail("Booking not found."));

        return Ok(ApiResponse<BookingResponse>.Ok("Booking status updated successfully", result));
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelBooking(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        var result = await _bookingService.CancelBookingAsync(id, userId.Value, userRole);

        if (!result)
            return NotFound(ApiResponse<object>.Fail("Booking not found."));

        return Ok(ApiResponse<object>.Ok("Booking cancelled successfully"));
    }
}
