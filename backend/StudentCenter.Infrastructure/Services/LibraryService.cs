using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class LibraryService : ILibraryService
{
    private readonly AppDbContext _context;

    public LibraryService(AppDbContext context)
    {
        _context = context;
    }

    private async Task EnsureDatabaseSchemaAsync()
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""LibraryFolders"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Name"" text NOT NULL,
                    ""Description"" text NULL,
                    ""ParentFolderId"" uuid NULL REFERENCES ""LibraryFolders""(""Id"") ON DELETE CASCADE,
                    ""VisibilityType"" text NOT NULL DEFAULT 'Public',
                    ""AllowedClassIdsJson"" text NULL,
                    ""CreatedByUserId"" uuid NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""FolderId"" uuid NULL REFERENCES ""LibraryFolders""(""Id"") ON DELETE SET NULL;
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""LocationType"" text NOT NULL DEFAULT 'Offline';
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""LocationDetails"" text NULL;
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""Publisher"" text NULL;
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""PublicationYear"" integer NULL;
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""Synopsis"" text NULL;
                ALTER TABLE ""Books"" ADD COLUMN IF NOT EXISTS ""CreatedByUserId"" uuid NULL REFERENCES ""Users""(""Id"") ON DELETE SET NULL;
                ALTER TABLE ""BookBorrowRequests"" ADD COLUMN IF NOT EXISTS ""TargetTeacherId"" uuid NULL REFERENCES ""Users""(""Id"") ON DELETE SET NULL;
                ALTER TABLE ""BookBorrowRequests"" ADD COLUMN IF NOT EXISTS ""BorrowNotes"" text NULL;
            ");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Library Schema Verification Warning] {ex.Message}");
        }
    }

    public async Task<List<LibraryFolderResponse>> GetFoldersAsync(Guid? parentFolderId, Guid currentUserId)
    {
        await EnsureDatabaseSchemaAsync();
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);
        string studentClassIdStr = currentUser?.ClassId?.ToString() ?? string.Empty;

        var query = _context.LibraryFolders
            .Include(f => f.CreatedByUser)
            .Include(f => f.SubFolders)
            .Include(f => f.Books)
            .AsNoTracking()
            .Where(f => f.ParentFolderId == parentFolderId);

        var folders = await query.ToListAsync();

        if (!isAdminOrTeacher)
        {
            // Filter strictly for students based on targeted visibility settings
            folders = folders.Where(f =>
            {
                if (string.Equals(f.VisibilityType, "Public", StringComparison.OrdinalIgnoreCase))
                    return true;

                if (string.Equals(f.VisibilityType, "TargetedClasses", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(studentClassIdStr))
                {
                    if (string.IsNullOrEmpty(f.AllowedClassIdsJson)) return false;
                    return f.AllowedClassIdsJson.Contains(studentClassIdStr, StringComparison.OrdinalIgnoreCase);
                }

                return false;
            }).ToList();
        }

        return folders.Select(MapFolder).ToList();
    }

    public async Task<LibraryFolderResponse> CreateFolderAsync(CreateLibraryFolderRequest request, Guid currentUserId)
    {
        await EnsureDatabaseSchemaAsync();
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);

        if (!isAdminOrTeacher)
            throw new UnauthorizedAccessException("Hanya Guru dan Admin yang dapat membuat folder/kategori perpustakaan.");

        string? allowedJson = null;
        if (request.AllowedClassIds != null && request.AllowedClassIds.Any())
        {
            allowedJson = JsonSerializer.Serialize(request.AllowedClassIds);
        }

        var folder = new LibraryFolder
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ParentFolderId = request.ParentFolderId,
            VisibilityType = string.IsNullOrWhiteSpace(request.VisibilityType) ? "Public" : request.VisibilityType,
            AllowedClassIdsJson = allowedJson,
            CreatedByUserId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.LibraryFolders.Add(folder);
        await _context.SaveChangesAsync();

        var created = await _context.LibraryFolders
            .Include(f => f.CreatedByUser)
            .Include(f => f.SubFolders)
            .Include(f => f.Books)
            .AsNoTracking()
            .FirstAsync(f => f.Id == folder.Id);

        return MapFolder(created);
    }

    public async Task<bool> DeleteFolderAsync(Guid folderId, Guid currentUserId)
    {
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);

        if (!isAdminOrTeacher)
            throw new UnauthorizedAccessException("Hanya Guru dan Admin yang dapat menghapus folder.");

        var folder = await _context.LibraryFolders
            .Include(f => f.SubFolders)
            .Include(f => f.Books)
            .FirstOrDefaultAsync(f => f.Id == folderId);

        if (folder is null) return false;

        _context.LibraryFolders.Remove(folder);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<BookResponse>> GetBooksAsync(Guid? folderId, Guid currentUserId, string? search)
    {
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);
        string studentClassIdStr = currentUser?.ClassId?.ToString() ?? string.Empty;

        var query = _context.Books
            .Include(b => b.CreatedByUser)
            .Include(b => b.Folder)
            .AsNoTracking()
            .Where(b => b.IsActive);

        if (folderId.HasValue)
        {
            query = query.Where(b => b.FolderId == folderId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(b => b.Title.ToLower().Contains(s) || b.Author.ToLower().Contains(s) || (b.Synopsis != null && b.Synopsis.ToLower().Contains(s)));
        }

        var books = await query.ToListAsync();

        if (!isAdminOrTeacher)
        {
            // Filter books inside targeted folders for students
            books = books.Where(b =>
            {
                if (b.Folder == null) return true;
                if (string.Equals(b.Folder.VisibilityType, "Public", StringComparison.OrdinalIgnoreCase)) return true;
                if (string.Equals(b.Folder.VisibilityType, "TargetedClasses", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(studentClassIdStr))
                {
                    if (string.IsNullOrEmpty(b.Folder.AllowedClassIdsJson)) return false;
                    return b.Folder.AllowedClassIdsJson.Contains(studentClassIdStr, StringComparison.OrdinalIgnoreCase);
                }
                return false;
            }).ToList();
        }

        return books.Select(MapBook).ToList();
    }

    public async Task<BookResponse?> GetBookByIdAsync(Guid bookId, Guid currentUserId)
    {
        var book = await _context.Books
            .Include(b => b.CreatedByUser)
            .Include(b => b.Folder)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == bookId);

        return book is null ? null : MapBook(book);
    }

    public async Task<BookResponse> CreateBookAsync(CreateBookRequest request, Guid currentUserId)
    {
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);

        if (!isAdminOrTeacher)
            throw new UnauthorizedAccessException("Hanya Guru dan Admin yang dapat menambahkan buku.");

        var book = new Book
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Author = request.Author.Trim(),
            ISBN = request.ISBN?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Umum" : request.Category.Trim(),
            Publisher = request.Publisher?.Trim(),
            PublicationYear = request.PublicationYear,
            Synopsis = request.Synopsis?.Trim(),
            TotalCopies = request.TotalCopies < 1 ? 1 : request.TotalCopies,
            AvailableCopies = request.TotalCopies < 1 ? 1 : request.TotalCopies,
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            LocationType = string.IsNullOrWhiteSpace(request.LocationType) ? "Offline" : request.LocationType,
            LocationDetails = request.LocationDetails?.Trim(),
            FolderId = request.FolderId,
            CreatedByUserId = currentUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var created = await _context.Books
            .Include(b => b.CreatedByUser)
            .Include(b => b.Folder)
            .AsNoTracking()
            .FirstAsync(b => b.Id == book.Id);

        return MapBook(created);
    }

    public async Task<bool> DeleteBookAsync(Guid bookId, Guid currentUserId)
    {
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == currentUserId);
        bool isAdminOrTeacher = currentUser != null && (currentUser.Role == UserRole.Admin || currentUser.Role == UserRole.Teacher);

        if (!isAdminOrTeacher)
            throw new UnauthorizedAccessException("Hanya Guru dan Admin yang dapat menghapus buku.");

        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == bookId);
        if (book is null) return false;

        book.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<BorrowRequestResponse> CreateBorrowRequestAsync(CreateBorrowRequestDto request, Guid studentUserId)
    {
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == request.BookId && b.IsActive);
        if (book is null)
            throw new ValidationException("Buku tidak ditemukan.");

        if (book.AvailableCopies < 1)
            throw new ValidationException("Stok buku tidak tersedia saat ini.");

        var borrowReq = new BookBorrowRequest
        {
            Id = Guid.NewGuid(),
            BookId = book.Id,
            BorrowerStudentId = studentUserId,
            TargetTeacherId = book.CreatedByUserId, // Targeted ONLY to book owner teacher
            BorrowDate = request.BorrowDate,
            DueDate = request.DueDate,
            BorrowNotes = request.Notes?.Trim(),
            Status = BookBorrowStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BookBorrowRequests.Add(borrowReq);
        await _context.SaveChangesAsync();

        var created = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
                .ThenInclude(s => s.Class)
            .AsNoTracking()
            .FirstAsync(r => r.Id == borrowReq.Id);

        return MapBorrowRequest(created);
    }

    public async Task<List<BorrowRequestResponse>> GetTargetedTeacherBorrowRequestsAsync(Guid teacherUserId)
    {
        var requests = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
                .ThenInclude(s => s.Class)
            .AsNoTracking()
            .Where(r => r.TargetTeacherId == teacherUserId || (r.TargetTeacherId == null && r.Book.CreatedByUserId == teacherUserId))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(MapBorrowRequest).ToList();
    }

    public async Task<List<BorrowRequestResponse>> GetStudentBorrowRequestsAsync(Guid studentUserId)
    {
        var requests = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .Include(r => r.BorrowerStudent)
                .ThenInclude(s => s.Class)
            .AsNoTracking()
            .Where(r => r.BorrowerStudentId == studentUserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(MapBorrowRequest).ToList();
    }

    public async Task<bool> RespondToBorrowRequestAsync(Guid requestId, bool approve, string? reason, Guid currentUserId)
    {
        var req = await _context.BookBorrowRequests
            .Include(r => r.Book)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (req is null) return false;

        req.Status = approve ? BookBorrowStatus.Approved : BookBorrowStatus.Rejected;
        req.ApprovedByUserId = currentUserId;
        req.RejectionReason = reason;
        req.UpdatedAt = DateTime.UtcNow;

        if (approve && req.Book != null && req.Book.AvailableCopies > 0)
        {
            req.Book.AvailableCopies -= 1;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static LibraryFolderResponse MapFolder(LibraryFolder f)
    {
        List<Guid> classIds = new();
        if (!string.IsNullOrEmpty(f.AllowedClassIdsJson))
        {
            try { classIds = JsonSerializer.Deserialize<List<Guid>>(f.AllowedClassIdsJson) ?? new(); }
            catch { }
        }

        return new LibraryFolderResponse
        {
            Id = f.Id,
            Name = f.Name,
            Description = f.Description,
            ParentFolderId = f.ParentFolderId,
            VisibilityType = f.VisibilityType,
            AllowedClassIds = classIds,
            CreatedByUserId = f.CreatedByUserId,
            CreatorName = f.CreatedByUser?.FullName ?? f.CreatedByUser?.Username ?? "Pengajar",
            SubFoldersCount = f.SubFolders?.Count ?? 0,
            BooksCount = f.Books?.Count ?? 0,
            CreatedAt = f.CreatedAt
        };
    }

    private static BookResponse MapBook(Book b) => new()
    {
        Id = b.Id,
        Title = b.Title,
        Author = b.Author,
        ISBN = b.ISBN,
        Category = b.Category,
        Publisher = b.Publisher,
        PublicationYear = b.PublicationYear,
        Synopsis = b.Synopsis,
        TotalCopies = b.TotalCopies,
        AvailableCopies = b.AvailableCopies,
        CoverImageUrl = b.CoverImageUrl,
        LocationType = b.LocationType,
        LocationDetails = b.LocationDetails,
        FolderId = b.FolderId,
        CreatedByUserId = b.CreatedByUserId,
        CreatorName = b.CreatedByUser?.FullName ?? b.CreatedByUser?.Username ?? "Pengajar",
        CreatedAt = b.CreatedAt
    };

    private static BorrowRequestResponse MapBorrowRequest(BookBorrowRequest r) => new()
    {
        Id = r.Id,
        BookId = r.BookId,
        BookTitle = r.Book?.Title ?? "Buku",
        BookCoverUrl = r.Book?.CoverImageUrl,
        BorrowerStudentId = r.BorrowerStudentId,
        BorrowerName = r.BorrowerStudent?.FullName ?? r.BorrowerStudent?.Username ?? "Siswa",
        BorrowerClassName = r.BorrowerStudent?.Class?.Name,
        TargetTeacherId = r.TargetTeacherId,
        BorrowDate = r.BorrowDate,
        DueDate = r.DueDate,
        ReturnDate = r.ReturnDate,
        BorrowNotes = r.BorrowNotes,
        Status = r.Status.ToString(),
        RejectionReason = r.RejectionReason,
        CreatedAt = r.CreatedAt
    };
}
