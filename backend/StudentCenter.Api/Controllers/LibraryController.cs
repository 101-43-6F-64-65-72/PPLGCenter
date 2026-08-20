using System;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StudentCenter.Api.Models.Responses;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;

namespace StudentCenter.Api.Controllers;

[ApiController]
[Route("api/library")]
[Authorize]
public class LibraryController : ControllerBase
{
    private readonly ILibraryService _libraryService;

    public LibraryController(ILibraryService libraryService)
    {
        _libraryService = libraryService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("folders")]
    public async Task<IActionResult> GetFolders([FromQuery] Guid? parentFolderId = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var folders = await _libraryService.GetFoldersAsync(parentFolderId, currentUserId);
            return Ok(folders);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("folders")]
    public async Task<IActionResult> CreateFolder([FromBody] CreateLibraryFolderRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var folder = await _libraryService.CreateFolderAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetFolders), new { parentFolderId = folder.ParentFolderId }, folder);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("folders/{folderId:guid}")]
    public async Task<IActionResult> DeleteFolder(Guid folderId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _libraryService.DeleteFolderAsync(folderId, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Folder tidak ditemukan."));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("books")]
    public async Task<IActionResult> GetBooks([FromQuery] Guid? folderId = null, [FromQuery] string? search = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var books = await _libraryService.GetBooksAsync(folderId, currentUserId, search);
            return Ok(books);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("books/{bookId:guid}")]
    public async Task<IActionResult> GetBookById(Guid bookId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var book = await _libraryService.GetBookByIdAsync(bookId, currentUserId);
            if (book is null) return NotFound(ApiResponse<object>.Fail("Buku tidak ditemukan."));
            return Ok(book);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("books")]
    public async Task<IActionResult> CreateBook([FromBody] CreateBookRequest request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var book = await _libraryService.CreateBookAsync(request, currentUserId);
            return CreatedAtAction(nameof(GetBookById), new { bookId = book.Id }, book);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpDelete("books/{bookId:guid}")]
    public async Task<IActionResult> DeleteBook(Guid bookId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _libraryService.DeleteBookAsync(bookId, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Buku tidak ditemukan."));
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("books/{bookId:guid}/borrow")]
    public async Task<IActionResult> CreateBorrowRequest(Guid bookId, [FromBody] CreateBorrowRequestDto request)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            request.BookId = bookId;
            var result = await _libraryService.CreateBorrowRequestAsync(request, currentUserId);
            return Ok(result);
        }
        catch (ValidationException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("inbox/borrow-requests")]
    public async Task<IActionResult> GetTargetedTeacherBorrowRequests()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var requests = await _libraryService.GetTargetedTeacherBorrowRequestsAsync(currentUserId);
            return Ok(requests);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpGet("my-borrow-requests")]
    public async Task<IActionResult> GetStudentBorrowRequests()
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var requests = await _libraryService.GetStudentBorrowRequestsAsync(currentUserId);
            return Ok(requests);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }

    [HttpPost("inbox/borrow-requests/{requestId:guid}/respond")]
    public async Task<IActionResult> RespondToBorrowRequest(Guid requestId, [FromQuery] bool approve = true, [FromQuery] string? reason = null)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            var success = await _libraryService.RespondToBorrowRequestAsync(requestId, approve, reason, currentUserId);
            if (!success) return NotFound(ApiResponse<object>.Fail("Permintaan peminjaman tidak ditemukan."));
            return Ok(new { Message = approve ? "Permintaan peminjaman disetujui." : "Permintaan peminjaman ditolak." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<object>.Fail(ex.Message));
        }
    }
}
