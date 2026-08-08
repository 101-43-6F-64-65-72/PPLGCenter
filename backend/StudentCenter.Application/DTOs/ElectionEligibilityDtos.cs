namespace StudentCenter.Application.DTOs;

public class ElectionEligibilityResponse
{
    public Guid ElectionId { get; set; }
    public Guid StudentId { get; set; }
    public bool Eligible { get; set; }
    public bool IsOsisMember { get; set; }
    public bool AlreadyRegistered { get; set; }
    public List<string> Reasons { get; set; } = new();
}
