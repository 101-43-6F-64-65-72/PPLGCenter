using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace StudentCenter.Application.DTOs;

public class CreateFeedbackRequest
{
    [Required(ErrorMessage = "Kategori wajib dipilih")]
    [MaxLength(50)]
    public string Category { get; set; } = "Fitur";

    [Range(1, 5, ErrorMessage = "Rating harus antara 1 sampai 5")]
    public int Rating { get; set; } = 5;

    [Required(ErrorMessage = "Pesan umpan balik tidak boleh kosong")]
    [MinLength(5, ErrorMessage = "Pesan minimal 5 karakter")]
    [MaxLength(1000, ErrorMessage = "Pesan maksimal 1000 karakter")]
    public string Content { get; set; } = string.Empty;

    public bool IsAnonymous { get; set; } = false;
}

public class UpdateFeedbackStatusRequest
{
    [Required]
    [MaxLength(30)]
    public string Status { get; set; } = "Reviewed"; // Pending, Reviewed, Resolved

    [MaxLength(500)]
    public string? AdminNotes { get; set; }
}

public class FeedbackResponse
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string UserName { get; set; } = "Anonim";
    public string? UserIdentifier { get; set; }
    public string UserRole { get; set; } = "Student";
    public string Category { get; set; } = "Fitur";
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; }
    public string Status { get; set; } = "Pending";
    public string? AdminNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class FeedbackSummaryResponse
{
    public int TotalCount { get; set; }
    public double AverageRating { get; set; }
    public int PendingCount { get; set; }
    public int ReviewedCount { get; set; }
    public int ResolvedCount { get; set; }
    public Dictionary<string, int> CategoryBreakdown { get; set; } = new();
    public Dictionary<int, int> RatingBreakdown { get; set; } = new();
}

public class PagedFeedbackResult
{
    public List<FeedbackResponse> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
