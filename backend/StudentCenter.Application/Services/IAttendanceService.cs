using StudentCenter.Application.DTOs;
using StudentCenter.Domain.Enums;

namespace StudentCenter.Application.Services;

public interface IAttendanceService
{
    Task<PagedResult<AttendanceResponse>> GetAllAsync(int page, int pageSize);
    Task<AttendanceResponse?> GetByIdAsync(Guid id);
    Task<PagedResult<AttendanceResponse>> GetByStudentAsync(Guid studentId, int page, int pageSize);
    Task<PagedResult<AttendanceResponse>> GetByDateAsync(DateTime date, int page, int pageSize);
    Task<AttendanceResponse> CreateAsync(CreateAttendanceRequest request, Guid recordedByUserId);
    Task<AttendanceResponse?> UpdateAsync(Guid id, UpdateAttendanceRequest request, Guid userId, string userRole);
    Task<bool> DeleteAsync(Guid id, Guid userId, string userRole);
}
