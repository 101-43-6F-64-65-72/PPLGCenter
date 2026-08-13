namespace StudentCenter.Application.DTOs;

public class UserPermissionResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Capability { get; set; } = string.Empty;
    public DateTime GrantedAt { get; set; }
    public Guid GrantedByUserId { get; set; }
}

public class GrantPermissionRequest
{
    public Guid UserId { get; set; }
    public string Capability { get; set; } = string.Empty;
}
