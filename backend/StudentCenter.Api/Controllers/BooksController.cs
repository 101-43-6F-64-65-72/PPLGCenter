using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private string GetCurrentUserRole()
    {
        if (User.IsInRole("Admin")) return "Admin";
        if (User.IsInRole("Teacher")) return "Teacher";
        if (User.IsInRole("Student")) return "Student";
        return User.FindFirstValue(ClaimTypes.Role) ?? "User";
    }

    [HttpGet]
    public async Task<IActionResult> GetBooks([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? category = null, [FromQuery] string? search = null)
    {
        var books = await _bookService.GetBooksAsync(page, pageSize, category, search);
        return Ok(books);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBookById(Guid id)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        if (book is null) return NotFound("Book not found.");
        return Ok(book);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> CreateBook([FromBody] CreateBookRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var book = await _bookService.CreateBookAsync(request, userId, userRole);
            return CreatedAtAction(nameof(GetBookById), new { id = book.Id }, book);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateBook(Guid id, [FromBody] UpdateBookRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var book = await _bookService.UpdateBookAsync(id, request, userId, userRole);
            if (book is null) return NotFound("Book not found.");
            return Ok(book);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> DeleteBook(Guid id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var success = await _bookService.DeleteBookAsync(id, userId, userRole);
            if (!success) return NotFound("Book not found.");
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
    }

    // ─── Book Manager Management ──────────────────────────────────────────────

    [HttpPost("managers")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignManager([FromBody] AssignBookManagerRequest request)
    {
        var success = await _bookService.AssignBookManagerAsync(request.Category, request.ManagerUserId);
        if (!success) return BadRequest("Failed to assign book manager. User not found.");
        return Ok(new { message = "Book manager assigned successfully." });
    }

    [HttpDelete("managers/{managerId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RemoveManager(Guid managerId)
    {
        var success = await _bookService.RemoveBookManagerAsync(managerId);
        if (!success) return NotFound("Book manager assignment not found.");
        return NoContent();
    }

    // ─── Borrowing API Endpoints (SEC-01 Dual Route Compatibility) ────────────

    [HttpPost("borrow")]
    [HttpPost("borrow/request")]
    public async Task<IActionResult> RequestBorrow([FromBody] CreateBookBorrowRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var borrowReq = await _bookService.RequestBorrowAsync(currentUserId, request);
            return CreatedAtAction(nameof(GetMyBorrowRequests), new { page = 1 }, borrowReq);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("borrow/my")]
    [HttpGet("borrow/my-requests")]
    public async Task<IActionResult> GetMyBorrowRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var currentUserId = GetCurrentUserId();
        var requests = await _bookService.GetMyBorrowRequestsAsync(currentUserId, page, pageSize);
        return Ok(requests);
    }

    [HttpGet("borrow/pending")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> GetPendingBorrowRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var requests = await _bookService.GetPendingBorrowRequestsAsync(page, pageSize, currentUserId, userRole);
            return Ok(requests);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
    }

    [HttpGet("borrow/{requestId:guid}")]
    public async Task<IActionResult> GetBorrowRequestById(Guid requestId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var result = await _bookService.GetBorrowRequestByIdAsync(requestId, currentUserId, userRole);
            if (result is null) return NotFound("Borrow request not found.");
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
    }

    [HttpPost("borrow/{requestId:guid}/process")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> ProcessBorrowRequest(Guid requestId, [FromBody] ProcessBorrowRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var result = await _bookService.ProcessBorrowRequestAsync(requestId, request, currentUserId, userRole);
            if (result is null) return NotFound("Pending borrow request not found.");
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("borrow/{requestId:guid}/return")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> MarkReturned(Guid requestId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();
            var result = await _bookService.MarkBookReturnedAsync(requestId, currentUserId, userRole);
            if (result is null) return NotFound("Active borrow request not found.");
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
