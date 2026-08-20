using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface ILibraryService
{
    Task<List<LibraryFolderResponse>> GetFoldersAsync(Guid? parentFolderId, Guid currentUserId);
    Task<LibraryFolderResponse> CreateFolderAsync(CreateLibraryFolderRequest request, Guid currentUserId);
    Task<bool> DeleteFolderAsync(Guid folderId, Guid currentUserId);

    Task<List<BookResponse>> GetBooksAsync(Guid? folderId, Guid currentUserId, string? search);
    Task<BookResponse?> GetBookByIdAsync(Guid bookId, Guid currentUserId);
    Task<BookResponse> CreateBookAsync(CreateBookRequest request, Guid currentUserId);
    Task<bool> DeleteBookAsync(Guid bookId, Guid currentUserId);

    Task<BorrowRequestResponse> CreateBorrowRequestAsync(CreateBorrowRequestDto request, Guid studentUserId);
    Task<List<BorrowRequestResponse>> GetTargetedTeacherBorrowRequestsAsync(Guid teacherUserId);
    Task<List<BorrowRequestResponse>> GetStudentBorrowRequestsAsync(Guid studentUserId);
    Task<bool> RespondToBorrowRequestAsync(Guid requestId, bool approve, string? reason, Guid currentUserId);
}
