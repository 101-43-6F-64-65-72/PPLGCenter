using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IBookService
{
    Task<PagedResult<BookResponse>> GetBooksAsync(int page, int pageSize, string? category, string? search);
    Task<BookResponse?> GetBookByIdAsync(Guid id);
    Task<BookResponse> CreateBookAsync(CreateBookRequest request);
    Task<BookResponse?> UpdateBookAsync(Guid id, UpdateBookRequest request);
    Task<bool> DeleteBookAsync(Guid id);

    // Book Manager Assignments
    Task<bool> AssignBookManagerAsync(string category, Guid managerUserId);
    Task<bool> RemoveBookManagerAsync(Guid managerId);

    // Borrowing Operations
    Task<BookBorrowRequestResponse> RequestBorrowAsync(Guid studentId, CreateBookBorrowRequest request);
    Task<PagedResult<BookBorrowRequestResponse>> GetMyBorrowRequestsAsync(Guid studentId, int page, int pageSize);
    Task<PagedResult<BookBorrowRequestResponse>> GetPendingBorrowRequestsAsync(int page, int pageSize);
    Task<BookBorrowRequestResponse?> ProcessBorrowRequestAsync(Guid requestId, ProcessBorrowRequest request, Guid approverUserId);
    Task<BookBorrowRequestResponse?> MarkBookReturnedAsync(Guid requestId, Guid approverUserId);
}
