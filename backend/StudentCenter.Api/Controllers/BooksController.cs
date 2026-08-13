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
        var book = await _bookService.CreateBookAsync(request);
        return CreatedAtAction(nameof(GetBookById), new { id = book.Id }, book);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> UpdateBook(Guid id, [FromBody] UpdateBookRequest request)
    {
        var book = await _bookService.UpdateBookAsync(id, request);
        if (book is null) return NotFound("Book not found.");
        return Ok(book);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> DeleteBook(Guid id)
    {
        var success = await _bookService.DeleteBookAsync(id);
        if (!success) return NotFound("Book not found.");
        return NoContent();
    }

    // ─── Borrowing API Endpoints ──────────────────────────────────────────────

    [HttpPost("borrow")]
    public async Task<IActionResult> RequestBorrow([FromBody] CreateBookBorrowRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var borrowReq = await _bookService.RequestBorrowAsync(currentUserId, request);
        return CreatedAtAction(nameof(GetMyBorrowRequests), new { page = 1 }, borrowReq);
    }

    [HttpGet("borrow/my")]
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
        var requests = await _bookService.GetPendingBorrowRequestsAsync(page, pageSize);
        return Ok(requests);
    }

    [HttpPost("borrow/{requestId:guid}/process")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> ProcessBorrowRequest(Guid requestId, [FromBody] ProcessBorrowRequest request)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _bookService.ProcessBorrowRequestAsync(requestId, request, currentUserId);
        if (result is null) return NotFound("Pending borrow request not found.");
        return Ok(result);
    }

    [HttpPost("borrow/{requestId:guid}/return")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<IActionResult> MarkReturned(Guid requestId)
    {
        var currentUserId = GetCurrentUserId();
        var result = await _bookService.MarkBookReturnedAsync(requestId, currentUserId);
        if (result is null) return NotFound("Active borrow request not found.");
        return Ok(result);
    }
}
