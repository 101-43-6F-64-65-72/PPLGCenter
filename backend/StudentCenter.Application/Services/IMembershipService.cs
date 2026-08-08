namespace StudentCenter.Application.Services;

/// <summary>
/// Service for membership and advisor authorization checks.
/// Used to determine extracurricular-level permissions beyond global Role.
/// </summary>
public interface IMembershipService
{
    /// <summary>
    /// Returns true if the user is an active member of the specified extracurricular.
    /// </summary>
    Task<bool> IsMemberOfExtracurricularAsync(Guid userId, Guid extracurricularId);

    /// <summary>
    /// Returns true if the user is assigned as advisor for the specified extracurricular.
    /// </summary>
    Task<bool> IsAdvisorOfExtracurricularAsync(Guid userId, Guid extracurricularId);

    /// <summary>
    /// Returns true if the user holds the Leader position in the specified extracurricular.
    /// </summary>
    Task<bool> IsLeaderOfExtracurricularAsync(Guid userId, Guid extracurricularId);

    /// <summary>
    /// Gets the user's position in the specified extracurricular, or null if not a member.
    /// </summary>
    Task<string?> GetPositionInExtracurricularAsync(Guid userId, Guid extracurricularId);
}
