using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IScheduleService
{
    Task<List<ScheduleResponse>> GetAllAsync(Guid? semesterId = null, Guid? classId = null, Guid? teacherId = null, int? dayOfWeek = null);
    Task<ScheduleResponse?> GetByIdAsync(Guid id);
    Task<ScheduleResponse> CreateAsync(CreateScheduleRequest request);
    Task<ScheduleResponse?> UpdateAsync(Guid id, UpdateScheduleRequest request);
    Task<bool> DeleteAsync(Guid id);
    Task<List<ScheduleResponse>> GetTodaySchedulesForStudentAsync(Guid studentId);
    Task<List<ScheduleResponse>> GetTodaySchedulesForTeacherAsync(Guid teacherId);
}
