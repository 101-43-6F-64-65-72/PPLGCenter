using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IOsisRecruitmentService
{
    // Positions
    Task<List<OsisPositionResponse>> GetPositionsAsync(Guid? academicYearId = null);
    Task<OsisPositionResponse> CreatePositionAsync(CreateOsisPositionRequest request);
    Task<bool> DeletePositionAsync(Guid id);

    // Applications
    Task<List<OsisApplicationResponse>> GetApplicationsAsync(Guid? positionId = null, Guid? studentId = null);
    Task<OsisApplicationResponse> SubmitApplicationAsync(SubmitOsisApplicationRequest request, Guid studentId);
    Task<bool> ReviewApplicationByTeacherAsync(Guid applicationId, ReviewOsisApplicationRequest request, Guid teacherUserId);
    Task<bool> ReviewApplicationByChairmanAsync(Guid applicationId, ReviewOsisApplicationRequest request, Guid chairmanUserId);
    Task<bool> ReviewApplicationByAdminAsync(Guid applicationId, ReviewOsisApplicationRequest request, Guid adminUserId);

    // Cabinet History & Structure
    Task<List<OsisCabinetMemberResponse>> GetCabinetStructureAsync(Guid? academicYearId = null);
    Task<OsisCabinetMemberResponse> AddCabinetMemberAsync(Guid academicYearId, Guid studentId, string positionTitle, string department, string? photoUrl);
    Task<bool> DeleteCabinetMemberAsync(Guid id);
}
