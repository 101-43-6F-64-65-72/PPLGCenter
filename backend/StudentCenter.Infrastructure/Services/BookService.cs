using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class BookService : IBookService
{
    private readonly AppDbContext _context;

    public BookService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<BookResponse>> GetBooksAsync(int page, int pageSize, string? category, string? search)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Books.AsNoTracking().Where(b => b.IsActive);

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(b => b.Category.ToLower() == category.ToLower());

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(b => b.Title.ToLower().Contains(s) || b.Author.ToLower().Contains(s) || (b.ISBN != null && b.ISBN.Contains(s)));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(b => b.Title)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => MapBook(b))
            .ToListAsync();

        return new PagedResult<BookResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<BookResponse?> GetBookByIdAsync(Guid id)
    {
        var book = await _context.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        return book is null ? null : MapBook(book);
    }

    public async Task<BookResponse> CreateBookAsync(CreateBookRequest request, Guid? requestingUserId = null, string? userRole = null)
    {
        if (requestingUserId.HasValue && userRole != null)
        {
            await EnsureManagerAuthorizationAsync(requestingUserId.Value, userRole, request.Category);
        }

        var book = new Book
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Author = request.Author.Trim(),
            ISBN = request.ISBN?.Trim(),
            Category = request.Category.Trim(),
            TotalCopies = Math.Max(1, request.TotalCopies),
            AvailableCopies = Math.Max(1, request.TotalCopies),
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return MapBook(book);
    }

    public async Task<BookResponse?> UpdateBookAsync(Guid id, UpdateBookRequest request, Guid? requestingUserId = null, string? userRole = null)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book is null) return null;

        if (requestingUserId.HasValue && userRole != null)
        {
            await EnsureManagerAuthorizationAsync(requestingUserId.Value, userRole, book.Category);
        }

        var copyDiff = request.TotalCopies - book.TotalCopies;

        book.Title = request.Title.Trim();
        book.Author = request.Author.Trim();
        book.ISBN = request.ISBN?.Trim();
        book.Category = request.Category.Trim();
        book.TotalCopies = Math.Max(0, request.TotalCopies);
        book.AvailableCopies = Math.Max(0, book.AvailableCopies + copyDiff);
        book.CoverImageUrl = request.CoverImageUrl?.Trim();
        book.IsActive = request.IsActive;
        book.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapBook(book);
    }

    public async Task<bool> DeleteBookAsync(Guid id, Guid? requestingUserId = null, string? userRole = null)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book is null) return false;

        if (requestingUserId.HasValue && userRole != null)
        {
            await EnsureManagerAuthorizationAsync(requestingUserId.Value, userRole, book.Category);
        }

        book.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── Book Manager Assignments ─────────────────────────────────────────────

    public async Task<bool> AssignBookManagerAsync(string category, Guid managerUserId)
    {
        var userExists = await _context.Users.AnyAsync(u => u.Id == managerUserId);
        if (!userExists) return false;

        _context.BookManagers.Add(new BookManager
        {
            Id = Guid.NewGuid(),
            BookCategory = category,
            ManagerUserId = managerUserId,
            AssignedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveBookManagerAsync(Guid managerId)
    {
        var bm = await _context.BookManagers.FirstOrDefaultAsync(m => m.Id == managerId);
        if (bm is null) return false;

        _context.BookManagers.Remove(bm);
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── Borrowing Operations ──────────────────────────────────────────────────

    public async Task<BookBorrowRequestResponse> RequestBorrowAsync(Guid studentId, CreateBookBorrowRequest request)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == request.BookId && b.IsActive);
        if (book is null)
            throw new KeyNotFoundException("Book not found or inactive.");

        // Duplicate active request check
        var hasActiveRequest = await _context.BookBorrowRequests
            .AnyAsync(r => r.BookId == request.BookId 
                        && r.BorrowerStudentId == studentId 
                        && (r.Status == BookBorrowStatus.Pending || r.Status == BookBorrowStatus.Approved));

        if (hasActiveRequest)
            throw new InvalidOperationException("You already have a pending or active borrow request for this book.");

        var now = DateTime.UtcNow;
        var days = Math.Clamp(request.RequestedDays, 1, 14);

        var borrowRequest = new BookBorrowRequest
        {
            Id = Guid.NewGuid(),
            BookId = request.BookId,
            BorrowerStudentId = studentId,
            BorrowDate = now,
            DueDate = now.AddDays(days),
            Status = BookBorrowStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.BookBorrowRequests.Add(borrowRequest);
        await _context.SaveChangesAsync();

        var created = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .AsNoTracking()
            .FirstAsync(r => r.Id == borrowRequest.Id);

        return MapBorrowResponse(created);
    }

    public async Task<BookBorrowRequestResponse?> GetBorrowRequestByIdAsync(Guid requestId, Guid requestingUserId, string userRole)
    {
        var request = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) return null;

        if (userRole == "Student" && request.BorrowerStudentId != requestingUserId)
        {
            throw new UnauthorizedAccessException("Students cannot view borrowing records of other users.");
        }

        if (userRole == "Teacher")
        {
            await EnsureManagerAuthorizationAsync(requestingUserId, userRole, request.Book.Category);
        }

        return MapBorrowResponse(request);
    }

    public async Task<PagedResult<BookBorrowRequestResponse>> GetMyBorrowRequestsAsync(Guid studentId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .Where(r => r.BorrowerStudentId == studentId);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => MapBorrowResponse(r))
            .ToListAsync();

        return new PagedResult<BookBorrowRequestResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResult<BookBorrowRequestResponse>> GetPendingBorrowRequestsAsync(int page, int pageSize, Guid? requestingUserId = null, string? userRole = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        if (requestingUserId.HasValue && userRole != null)
        {
            await EnsureManagerAuthorizationAsync(requestingUserId.Value, userRole);
        }

        var query = _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .AsNoTracking()
            .Where(r => r.Status == BookBorrowStatus.Pending);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => MapBorrowResponse(r))
            .ToListAsync();

        return new PagedResult<BookBorrowRequestResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<BookBorrowRequestResponse?> ProcessBorrowRequestAsync(
        Guid requestId,
        ProcessBorrowRequest request,
        Guid approverUserId,
        string? userRole = null)
    {
        var borrowReq = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (borrowReq is null) return null;

        if (borrowReq.Status != BookBorrowStatus.Pending)
        {
            throw new InvalidOperationException($"Cannot process request in status '{borrowReq.Status}'. Only Pending requests can be processed.");
        }

        if (userRole != null)
        {
            await EnsureManagerAuthorizationAsync(approverUserId, userRole, borrowReq.Book.Category);
        }

        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

        if (request.Approve)
        {
            if (borrowReq.Book.AvailableCopies <= 0)
                throw new InvalidOperationException("No available copies remaining for this book.");

            borrowReq.Book.AvailableCopies -= 1; // Atomic decrement
            borrowReq.Status = BookBorrowStatus.Approved;
            borrowReq.ApprovedByUserId = approverUserId;
        }
        else
        {
            borrowReq.Status = BookBorrowStatus.Rejected;
            borrowReq.RejectionReason = request.RejectionReason;
            borrowReq.ApprovedByUserId = approverUserId;
        }

        borrowReq.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        if (transaction != null)
            await transaction.CommitAsync();

        var updated = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .FirstAsync(r => r.Id == requestId);

        return MapBorrowResponse(updated);
    }

    public async Task<BookBorrowRequestResponse?> MarkBookReturnedAsync(
        Guid requestId,
        Guid approverUserId,
        string? userRole = null)
    {
        var borrowReq = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (borrowReq is null) return null;

        // SEC-02 Fix: Allow returning both Approved AND Overdue books!
        if (borrowReq.Status != BookBorrowStatus.Approved && borrowReq.Status != BookBorrowStatus.Overdue)
        {
            throw new InvalidOperationException($"Cannot return book request in status '{borrowReq.Status}'. Only Approved or Overdue books can be returned.");
        }

        if (userRole != null)
        {
            await EnsureManagerAuthorizationAsync(approverUserId, userRole, borrowReq.Book.Category);
        }

        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

        borrowReq.Status = BookBorrowStatus.Returned;
        borrowReq.ReturnDate = DateTime.UtcNow;
        borrowReq.Book.AvailableCopies += 1; // Atomic increment
        borrowReq.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (transaction != null)
            await transaction.CommitAsync();

        var updated = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .FirstAsync(r => r.Id == requestId);

        return MapBorrowResponse(updated);
    }

    private async Task EnsureManagerAuthorizationAsync(Guid userId, string userRole, string? bookCategory = null)
    {
        if (userRole == "Admin") return;

        if (userRole == "Teacher")
        {
            var isManager = await _context.BookManagers.AsNoTracking()
                .AnyAsync(bm => bm.ManagerUserId == userId &&
                    (bm.BookCategory == null || bookCategory == null || bm.BookCategory.ToLower() == bookCategory.ToLower()));

            if (isManager) return;

            var hasAnyManagers = await _context.BookManagers.AsNoTracking()
                .AnyAsync(bm => bm.BookCategory == null || bookCategory == null || bm.BookCategory.ToLower() == bookCategory.ToLower());

            if (hasAnyManagers)
            {
                throw new UnauthorizedAccessException("Teacher is not an assigned BookManager for this category.");
            }

            var hasSystemManagers = await _context.BookManagers.AsNoTracking().AnyAsync();
            if (hasSystemManagers)
            {
                throw new UnauthorizedAccessException("Teacher is not an assigned BookManager.");
            }

            return;
        }

        throw new UnauthorizedAccessException("User is not authorized for library management.");
    }

    private static BookResponse MapBook(Book b) => new()
    {
        Id = b.Id,
        Title = b.Title,
        Author = b.Author,
        ISBN = b.ISBN,
        Category = b.Category,
        TotalCopies = b.TotalCopies,
        AvailableCopies = b.AvailableCopies,
        CoverImageUrl = b.CoverImageUrl,
        IsActive = b.IsActive,
        CreatedAt = b.CreatedAt
    };

    private static BookBorrowRequestResponse MapBorrowResponse(BookBorrowRequest r) => new()
    {
        Id = r.Id,
        BookId = r.BookId,
        BookTitle = r.Book?.Title ?? string.Empty,
        BorrowerStudentId = r.BorrowerStudentId,
        BorrowerName = r.BorrowerStudent?.FullName ?? r.BorrowerStudent?.Username ?? string.Empty,
        BorrowDate = r.BorrowDate,
        DueDate = r.DueDate,
        ReturnDate = r.ReturnDate,
        Status = r.Status,
        RejectionReason = r.RejectionReason,
        ApprovedByUserId = r.ApprovedByUserId,
        ApprovedByUserName = r.ApprovedByUser?.FullName ?? r.ApprovedByUser?.Username,
        CreatedAt = r.CreatedAt
    };
}
