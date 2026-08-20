using StudentCenter.Application.DTOs;

namespace StudentCenter.Application.Services;

public interface IAttendanceService
{
    Task<List<AttendanceSessionResponse>> GetAllSessionsAsync(Guid requestingUserId, string requestingUserRole, Guid? scheduleId = null, Guid? classSubjectId = null, DateTime? date = null, string? status = null);
    Task<AttendanceSessionResponse?> GetSessionByIdAsync(Guid sessionId, Guid requestingUserId, string requestingUserRole);
    Task<AttendanceSessionResponse> CreateSessionAsync(Guid teacherId, CreateAttendanceSessionRequest request);
    Task<AttendanceSessionResponse?> UpdateStudentStatusAsync(Guid sessionId, Guid teacherId, UpdateAttendanceStatusRequest request);
    Task<AttendanceSessionResponse?> BulkUpdateAttendanceAsync(Guid sessionId, Guid teacherId, BulkUpdateAttendanceRequest request);
    Task<AttendanceSessionResponse?> CloseSessionAsync(Guid sessionId, Guid teacherId);
    Task<List<AttendanceRecordResponse>> GetStudentAttendanceHistoryAsync(Guid studentId);
}
