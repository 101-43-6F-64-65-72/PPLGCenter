namespace StudentCenter.Domain.Entities;

public class SubmissionRevision
{
    public Guid Id { get; set; }

    public Guid SubmissionId { get; set; }
    public Submission Submission { get; set; } = null!;

    public int Version { get; set; } = 1;

    /// <summary>TEXT | FILE | LINK</summary>
    public string SubmissionType { get; set; } = "FILE";

    public string? TextAnswer { get; set; }
    public string? FileUrl { get; set; }
    public string? LinkUrl { get; set; }
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
