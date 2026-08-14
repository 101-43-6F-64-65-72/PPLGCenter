namespace StudentCenter.Application.DTOs;

public class ExtracurricularMemberResponse
{
    public Guid Id { get; set; }
    public Guid ExtracurricularId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string? NIS { get; set; }
    public string? NISN { get; set; }
    public string? ClassName { get; set; }
    public string? PhotoUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string Status { get; set; } = "Active";
    public string Position { get; set; } = "Anggota";
    public DateTime JoinedAt { get; set; }
}

