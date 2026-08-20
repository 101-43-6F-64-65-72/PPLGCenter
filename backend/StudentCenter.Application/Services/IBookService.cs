using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IBookService
{
    Task<PagedResult<BookResponse>> GetBooksAsync(int page, int pageSize, string? category, string? search);
    Task<BookResponse?> GetBookByIdAsync(Guid id);
    Task<BookResponse> CreateBookAsync(CreateBookRequest request, Guid? requestingUserId = null, string? userRole = null);
    Task<BookResponse?> UpdateBookAsync(Guid id, UpdateBookRequest request, Guid? requestingUserId = null, string? userRole = null);
    Task<bool> DeleteBookAsync(Guid id, Guid? requestingUserId = null, string? userRole = null);

    // Book Manager Assignments
    Task<bool> AssignBookManagerAsync(string category, Guid managerUserId);
    Task<bool> RemoveBookManagerAsync(Guid managerId);

    // Borrowing Operations
    Task<BookBorrowRequestResponse> RequestBorrowAsync(Guid studentId, CreateBookBorrowRequest request);
    Task<BookBorrowRequestResponse?> GetBorrowRequestByIdAsync(Guid requestId, Guid requestingUserId, string userRole);
    Task<PagedResult<BookBorrowRequestResponse>> GetMyBorrowRequestsAsync(Guid studentId, int page, int pageSize);
    Task<PagedResult<BookBorrowRequestResponse>> GetPendingBorrowRequestsAsync(int page, int pageSize, Guid? requestingUserId = null, string? userRole = null);
    Task<BookBorrowRequestResponse?> ProcessBorrowRequestAsync(Guid requestId, ProcessBorrowRequest request, Guid approverUserId, string? userRole = null);
    Task<BookBorrowRequestResponse?> MarkBookReturnedAsync(Guid requestId, Guid approverUserId, string? userRole = null);
}
