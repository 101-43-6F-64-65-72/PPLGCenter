using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.Services;

public interface IScheduleRotationService
{
    Task<ScheduleRotationConfigResponse?> GetConfigByClassIdAsync(Guid schoolClassId);
    Task<ScheduleRotationConfigResponse> SaveConfigAsync(SaveScheduleRotationConfigRequest request);
    Task<SubjectCategory> GetCurrentCategoryForClassAsync(Guid schoolClassId, DateTime targetDate);
}
