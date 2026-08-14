using StudentCenter.Domain.Enums;

namespace StudentCenter.Domain.Entities;

public class BookBorrowRequest
{
    public Guid Id { get; set; }
    public Guid BookId { get; set; }
    public Book Book { get; set; } = null!;

    public Guid BorrowerStudentId { get; set; }
    public User BorrowerStudent { get; set; } = null!;

    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }

    public BookBorrowStatus Status { get; set; } = BookBorrowStatus.Pending;
    public string? RejectionReason { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public User? ApprovedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
