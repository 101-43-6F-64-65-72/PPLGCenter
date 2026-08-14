using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IDashboardAggregationService
{
    Task<AdminDashboardResponse> GetAdminDashboardAsync();
    Task<TeacherDashboardResponse> GetTeacherDashboardAsync(Guid teacherId);
    Task<StudentDashboardResponse> GetStudentDashboardAsync(Guid studentId);
}
