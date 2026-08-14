namespace StudentCenter.Domain.Enums;

/// <summary>
/// Explicit user type used for login routing and JWT claims.
/// Distinct from UserRole to avoid coupling identity to authorization.
/// </summary>
public enum UserType
{
    Student = 0,
    Teacher = 1,
    Admin = 2
}
