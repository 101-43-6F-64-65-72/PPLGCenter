namespace StudentCenter.Application.DTOs;

public class MembershipInfo
{
    public Guid ExtracurricularId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class AdvisorInfo
{
    public Guid ExtracurricularId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class LoginUserInfo
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? NIS { get; set; }
    public string? NISN { get; set; }
    public string? NIP { get; set; }
    public string? PhoneNumber { get; set; }
    public string? PhotoUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid? ClassId { get; set; }
    public string? ClassName { get; set; }
    public string? DepartmentCode { get; set; }
    public int? StudentNumber { get; set; }
    public string? Gender { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Address { get; set; }
    public string? Position { get; set; }
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public string PrimaryIdentifier { get; set; } = string.Empty;
    public LoginUserInfo? User { get; set; }
    public List<MembershipInfo> Memberships { get; set; } = new();
    public List<AdvisorInfo> AdvisorFor { get; set; } = new();
}
