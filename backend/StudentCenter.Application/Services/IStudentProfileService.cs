using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IStudentProfileService
{
    Task<StudentProfileResponse?> GetProfileByUserIdAsync(Guid userId, Guid? requesterUserId, bool isRequesterAdminOrTeacher);
    Task<StudentProfileResponse> UpsertProfileAsync(Guid userId, UpdateStudentProfileRequest request);
    Task<StudentProjectResponse> AddProjectAsync(Guid userId, StudentProjectRequest request);
    Task<StudentProjectResponse?> UpdateProjectAsync(Guid userId, Guid projectId, StudentProjectRequest request);
    Task<bool> DeleteProjectAsync(Guid userId, Guid projectId);
}
