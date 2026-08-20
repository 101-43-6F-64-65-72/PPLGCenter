using System;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.DTOs;

public class BookResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public int? PublicationYear { get; set; }
    public string? Synopsis { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public string? CoverImageUrl { get; set; }
    public string LocationType { get; set; } = "Offline";
    public string? LocationDetails { get; set; }
    public Guid? FolderId { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public string? CreatorName { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookRequest
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Publisher { get; set; }
    public int? PublicationYear { get; set; }
    public string? Synopsis { get; set; }
    public int TotalCopies { get; set; } = 1;
    public string? CoverImageUrl { get; set; }
    public string LocationType { get; set; } = "Offline"; // "Offline", "Digital"
    public string? LocationDetails { get; set; }
    public Guid? FolderId { get; set; }
}

public class UpdateBookRequest
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string Category { get; set; } = string.Empty;
    public int TotalCopies { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

public class BookBorrowRequestResponse
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public Guid BorrowerStudentId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public BookBorrowStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookBorrowRequest
{
    public Guid BookId { get; set; }
    public int RequestedDays { get; set; } = 7;
}

public class ProcessBorrowRequest
{
    public bool Approve { get; set; }
    public string? RejectionReason { get; set; }
}

public class AssignBookManagerRequest
{
    public string Category { get; set; } = string.Empty;
    public Guid ManagerUserId { get; set; }
}
