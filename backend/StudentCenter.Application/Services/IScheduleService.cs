using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IScheduleService
{
    Task<List<ScheduleResponse>> GetAllAsync(Guid? semesterId = null, Guid? classId = null, Guid? teacherId = null, int? dayOfWeek = null, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<ScheduleResponse?> GetByIdAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<ScheduleResponse> CreateAsync(CreateScheduleRequest request, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<ScheduleResponse?> UpdateAsync(Guid id, UpdateScheduleRequest request, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<bool> DeleteAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null);
    Task<StudentTodayScheduleResponse> GetTodaySchedulesForStudentAsync(Guid studentId);
    Task<List<ScheduleResponse>> GetTodaySchedulesForTeacherAsync(Guid teacherId);
}

