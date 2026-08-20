using System;
using System.Collections.Generic;

namespace StudentCenter.Application.DTOs;

public class LibraryFolderResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentFolderId { get; set; }
    public string VisibilityType { get; set; } = "Public"; // "Public", "TeachersOnly", "TargetedClasses"
    public List<Guid> AllowedClassIds { get; set; } = new();
    public Guid CreatedByUserId { get; set; }
    public string CreatorName { get; set; } = string.Empty;
    public int SubFoldersCount { get; set; }
    public int BooksCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLibraryFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentFolderId { get; set; }
    public string VisibilityType { get; set; } = "Public";
    public List<Guid>? AllowedClassIds { get; set; }
}

public class CreateBorrowRequestDto
{
    public Guid BookId { get; set; }
    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public string? Notes { get; set; }
}

public class BorrowRequestResponse
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string? BookCoverUrl { get; set; }
    public Guid BorrowerStudentId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string? BorrowerClassName { get; set; }
    public Guid? TargetTeacherId { get; set; }
    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public string? BorrowNotes { get; set; }
    public string Status { get; set; } = "Pending";
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
