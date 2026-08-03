namespace StudentCenter.Application.DTOs;

public class ExtracurricularMemberResponse
{
    public Guid Id { get; set; }
    public Guid ExtracurricularId { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}
