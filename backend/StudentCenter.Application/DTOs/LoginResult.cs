namespace StudentCenter.Application.DTOs;

public enum LoginStatus
{
    Success,
    UserNotFound,
    InvalidPassword,
    UserInactive
}

public class LoginResult
{
    public LoginStatus Status { get; set; }
    public LoginResponse? Data { get; set; }
}
