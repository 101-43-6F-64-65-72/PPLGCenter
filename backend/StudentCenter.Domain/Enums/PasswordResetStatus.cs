namespace StudentCenter.Domain.Enums;

public enum PasswordResetStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Consumed = 3,
    Expired = 4
}
