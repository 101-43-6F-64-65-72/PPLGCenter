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

    public async Task<BookResponse> CreateBookAsync(CreateBookRequest request)
    {
        var book = new Book
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Author = request.Author,
            ISBN = request.ISBN,
            Category = request.Category,
            TotalCopies = Math.Max(1, request.TotalCopies),
            AvailableCopies = Math.Max(1, request.TotalCopies),
            CoverImageUrl = request.CoverImageUrl,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return MapBook(book);
    }

    public async Task<BookResponse?> UpdateBookAsync(Guid id, UpdateBookRequest request)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book is null) return null;

        var copyDiff = request.TotalCopies - book.TotalCopies;

        book.Title = request.Title;
        book.Author = request.Author;
        book.ISBN = request.ISBN;
        book.Category = request.Category;
        book.TotalCopies = Math.Max(0, request.TotalCopies);
        book.AvailableCopies = Math.Max(0, book.AvailableCopies + copyDiff);
        book.CoverImageUrl = request.CoverImageUrl;
        book.IsActive = request.IsActive;
        book.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapBook(book);
    }

    public async Task<bool> DeleteBookAsync(Guid id)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);
        if (book is null) return false;

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

    public async Task<PagedResult<BookBorrowRequestResponse>> GetMyBorrowRequestsAsync(Guid studentId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

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

    public async Task<PagedResult<BookBorrowRequestResponse>> GetPendingBorrowRequestsAsync(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

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

    public async Task<BookBorrowRequestResponse?> ProcessBorrowRequestAsync(Guid requestId, ProcessBorrowRequest request, Guid approverUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        var borrowReq = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (borrowReq is null || borrowReq.Status != BookBorrowStatus.Pending)
            return null;

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
        await transaction.CommitAsync();

        var updated = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .FirstAsync(r => r.Id == requestId);

        return MapBorrowResponse(updated);
    }

    public async Task<BookBorrowRequestResponse?> MarkBookReturnedAsync(Guid requestId, Guid approverUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        var borrowReq = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (borrowReq is null || borrowReq.Status != BookBorrowStatus.Approved)
            return null;

        borrowReq.Status = BookBorrowStatus.Returned;
        borrowReq.ReturnDate = DateTime.UtcNow;
        borrowReq.Book.AvailableCopies += 1; // Atomic increment
        borrowReq.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        var updated = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
            .Include(r => r.ApprovedByUser)
            .AsNoTracking()
            .FirstAsync(r => r.Id == requestId);

        return MapBorrowResponse(updated);
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
