using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    private readonly IFacilityService _facilityService;

    public BookingController(IBookingService bookingService, ICurrentUserService currentUserService, IFacilityService facilityService)
    {
        _bookingService = bookingService;
        _currentUserService = currentUserService;
        _facilityService = facilityService;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? facilityId = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] BookingStatus? status = null,
        [FromQuery] bool isPublic = false)
    {
        var currentUserId = _currentUserService.UserId;
        var userRole = _currentUserService.Role;

        var result = await _bookingService.GetBookingsAsync(page, pageSize, facilityId, userId, status, currentUserId, userRole);
        return Ok(ApiResponse<PagedResult<BookingResponse>>.Ok("Bookings retrieved successfully", result));
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var currentUserId = _currentUserService.UserId;
        var userRole = _currentUserService.Role;

        try
        {
            var result = await _bookingService.GetBookingByIdAsync(id, currentUserId, userRole);

            if (result is null)
                return NotFound(ApiResponse<object>.Fail("Booking not found."));

            return Ok(ApiResponse<BookingResponse>.Ok("Booking retrieved successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize(Roles = "Student,Teacher,Admin")]
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        try
        {
            var result = await _bookingService.CreateBookingAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetBooking), new { id = result.Id },
                ApiResponse<BookingResponse>.Ok("Booking created successfully", result));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<object>.Fail(ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.Fail(ex.Message));
        }
        catch (DbUpdateException)
        {
            return StatusCode(409, ApiResponse<object>.Fail("A concurrency conflict occurred while processing your booking. Please try again."));
        }
    }

    [Authorize(Roles = "Admin,Teacher")]
    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateBookingStatusRequest request)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        try
        {
            var result = await _bookingService.UpdateStatusAsync(id, request, userId.Value, userRole);

            if (result is null)
                return NotFound(ApiResponse<object>.Fail("Booking not found."));

            return Ok(ApiResponse<BookingResponse>.Ok("Booking status updated successfully", result));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelBooking(Guid id)
    {
        var userId = _currentUserService.UserId;
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("User identity not found in token."));

        var userRole = _currentUserService.Role ?? string.Empty;

        try
        {
            var result = await _bookingService.CancelBookingAsync(id, userId.Value, userRole);

            if (!result)
                return NotFound(ApiResponse<object>.Fail("Booking not found."));

            return Ok(ApiResponse<object>.Ok("Booking cancelled successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ApiResponse<object>.Fail(ex.Message));
        }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(409, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
