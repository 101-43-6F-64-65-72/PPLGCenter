using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.Services;

public interface IScheduleRotationService
{
    Task<ScheduleRotationConfigResponse?> GetConfigByClassIdAsync(Guid schoolClassId, Guid requestingUserId, string requestingUserRole);
    Task<ScheduleRotationConfigResponse> SaveConfigAsync(SaveScheduleRotationConfigRequest request, Guid requestingUserId, string requestingUserRole);
    Task<SubjectCategory> GetCurrentCategoryForClassAsync(Guid schoolClassId, DateTime targetDate, Guid requestingUserId = default, string requestingUserRole = "Admin");
}
