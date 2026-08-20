using System;
using System.Collections.Generic;

namespace StudentCenter.Domain.Entities;

public class Book
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? ISBN { get; set; }
    public string Category { get; set; } = "Umum";
    public string? Publisher { get; set; }
    public int? PublicationYear { get; set; }
    public string? Synopsis { get; set; }

    public int TotalCopies { get; set; } = 1;
    public int AvailableCopies { get; set; } = 1;
    public string? CoverImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Location: Offline vs Digital
    public string LocationType { get; set; } = "Offline"; // "Offline", "Digital"
    public string? LocationDetails { get; set; } // e.g. "Perpustakaan Utama Rak A-3" or "https://..."

    // Hierarchy & Ownership
    public Guid? FolderId { get; set; }
    public LibraryFolder? Folder { get; set; }

    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BookBorrowRequest> BorrowRequests { get; set; } = new List<BookBorrowRequest>();
}
