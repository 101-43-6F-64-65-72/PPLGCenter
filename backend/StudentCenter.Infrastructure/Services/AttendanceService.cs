using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;
using StudentCenter.Infrastructure.Helpers;

namespace StudentCenter.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AttendanceService(AppDbContext context, INotificationService? notificationService = null)
    {
        _context = context;
        _notificationService = notificationService ?? new NotificationService(context);
    }

    public async Task<List<AttendanceSessionResponse>> GetAllSessionsAsync(
        Guid requestingUserId,
        string requestingUserRole,
        Guid? scheduleId = null,
        Guid? classSubjectId = null,
        DateTime? date = null,
        string? status = null)
    {
        var query = BuildSessionQuery();

        if (scheduleId.HasValue)
            query = query.Where(s => s.ScheduleId == scheduleId.Value);

        if (classSubjectId.HasValue)
            query = query.Where(s => s.ClassSubjectId == classSubjectId.Value);

        if (date.HasValue)
        {
            var dateOnly = date.Value.Date;
            query = query.Where(s => s.Date.Date == dateOnly);
        }

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(s => s.Status.ToLower() == status.Trim().ToLower());

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId);
            if (student?.ClassId != null)
            {
                query = query.Where(s => s.ClassSubject.ClassId == student.ClassId.Value);
            }
            else
            {
                return new List<AttendanceSessionResponse>();
            }
        }
        else if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.TeacherId == requestingUserId || s.ClassSubject.TeacherSubject.TeacherId == requestingUserId);
        }

        var list = await query.OrderByDescending(s => s.Date).ThenByDescending(s => s.CreatedAt).ToListAsync();

        return list.Select(s => MapToSessionResponse(s, requestingUserId, requestingUserRole)).ToList();
    }

    public async Task<AttendanceSessionResponse?> GetSessionByIdAsync(
        Guid sessionId,
        Guid requestingUserId,
        string requestingUserRole)
    {
        var session = await BuildSessionQuery().FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null) return null;

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId);
            if (student?.ClassId != session.ClassSubject.ClassId)
            {
                throw new UnauthorizedAccessException("Student is not authorized to view attendance sessions outside their class.");
            }
        }
        else if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (!await _context.IsTeacherOrAdminAuthorizedAsync(requestingUserId, session.TeacherId) &&
                !await _context.IsTeacherOrAdminAuthorizedAsync(requestingUserId, session.ClassSubject.TeacherSubject.TeacherId))
            {
                throw new UnauthorizedAccessException("Teacher is not authorized to view attendance sessions outside their assigned scope.");
            }
        }

        return MapToSessionResponse(session, requestingUserId, requestingUserRole);
    }

    public async Task<AttendanceSessionResponse> CreateSessionAsync(Guid teacherId, CreateAttendanceSessionRequest request)
    {
        var schedule = await _context.Schedules
            .AsNoTracking()
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(s => s.Id == request.ScheduleId);

        if (schedule == null) throw new ValidationException("Schedule not found.");

        var scheduleTeacherId = schedule.ClassSubject.TeacherSubject.TeacherId;
        if (!await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, scheduleTeacherId))
        {
            throw new UnauthorizedAccessException("Only the designated teacher for this schedule can open an attendance session.");
        }

        var sessionDate = request.Date.Date;

        if (schedule.DayOfWeek != sessionDate.DayOfWeek)
        {
            throw new ValidationException($"Schedule is configured for {schedule.DayOfWeek}, but the provided session date is a {sessionDate.DayOfWeek}.");
        }

        if (await _context.AttendanceSessions.AnyAsync(s => s.ScheduleId == request.ScheduleId && s.Date == sessionDate))
        {
            throw new InvalidOperationException($"Attendance session for this schedule on {sessionDate:yyyy-MM-dd} already exists.");
        }

        var classId = schedule.ClassSubject.ClassId;
        var studentsInClass = await _context.Users
            .AsNoTracking()
            .Where(u => u.ClassId == classId && u.Role == UserRole.Student && u.IsActive)
            .ToListAsync();

        var session = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ScheduleId = schedule.Id,
            ClassSubjectId = schedule.ClassSubjectId,
            TeacherId = scheduleTeacherId,
            SemesterId = schedule.SemesterId,
            SessionNumber = request.SessionNumber > 0 ? request.SessionNumber : 1,
            Date = sessionDate,
            OpenedAt = DateTime.UtcNow,
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AttendanceSessions.Add(session);

        // Auto-generate Attendance records for all class students with default status NotMarked
        foreach (var student in studentsInClass)
        {
            _context.Attendances.Add(new Attendance
            {
                Id = Guid.NewGuid(),
                AttendanceSessionId = session.Id,
                StudentId = student.Id,
                AttendanceDate = sessionDate,
                Status = AttendanceStatus.NotMarked,
                RecordedByUserId = teacherId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            throw new InvalidOperationException("Attendance session for this schedule on this date already exists or is being created concurrently.", ex);
        }

        var subjectName = schedule.ClassSubject?.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran";
        var className = schedule.ClassSubject?.Class?.Name ?? "Kelas";
        var studentIds = studentsInClass.Select(s => s.Id).ToList();

        if (studentIds.Any())
        {
            await _notificationService.NotifyUsersAsync(
                studentIds,
                $"Presensi Dibuka: {subjectName}",
                $"Sesi presensi untuk {subjectName} ({className}) telah dibuka. Silakan melakukan presensi.",
                NotificationType.AttendanceOpened,
                NotificationPriority.High,
                session.Id.ToString(),
                NotificationReferenceType.AttendanceSession,
                $"/student/attendance/{session.Id}",
                "calendar-check",
                "#3b82f6"
            );
        }

        var userRole = (await _context.Users.FindAsync(teacherId))?.Role.ToString() ?? "Teacher";
        return (await GetSessionByIdAsync(session.Id, teacherId, userRole))!;
    }

    public async Task<AttendanceSessionResponse?> UpdateStudentStatusAsync(Guid sessionId, Guid teacherId, UpdateAttendanceStatusRequest request)
    {
        var session = await _context.AttendanceSessions
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        if (!await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, session.TeacherId) &&
            !await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, session.ClassSubject.TeacherSubject.TeacherId))
        {
            throw new UnauthorizedAccessException("Teacher is not authorized to modify attendance for this session.");
        }

        if (session.Status.Equals("Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Closed attendance session is immutable and cannot be modified.");
        }

        var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == request.StudentId);
        if (student == null || student.Role != UserRole.Student)
        {
            throw new ValidationException("Target student not found.");
        }

        if (student.ClassId == null || student.ClassId != session.ClassSubject.ClassId)
        {
            throw new ValidationException("Student does not belong to the class associated with this attendance session.");
        }

        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.AttendanceSessionId == sessionId && a.StudentId == request.StudentId);

        if (attendance == null)
        {
            throw new ValidationException("Student attendance record not found in this session.");
        }

        attendance.Status = request.Status;
        attendance.CheckInTime = DateTime.UtcNow;
        attendance.Notes = request.Notes?.Trim();
        attendance.RecordedByUserId = teacherId;
        attendance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        var userRole = (await _context.Users.FindAsync(teacherId))?.Role.ToString() ?? "Teacher";
        return await GetSessionByIdAsync(sessionId, teacherId, userRole);
    }

    public async Task<AttendanceSessionResponse?> BulkUpdateAttendanceAsync(Guid sessionId, Guid teacherId, BulkUpdateAttendanceRequest request)
    {
        var session = await _context.AttendanceSessions
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        if (!await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, session.TeacherId) &&
            !await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, session.ClassSubject.TeacherSubject.TeacherId))
        {
            throw new UnauthorizedAccessException("Teacher is not authorized to modify attendance for this session.");
        }

        if (session.Status.Equals("Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Closed attendance session is immutable and cannot be modified.");
        }

        var requestStudentIds = request.Records.Select(r => r.StudentId).Distinct().ToList();
        var enrolledStudentCount = await _context.Users
            .AsNoTracking()
            .Where(u => u.ClassId == session.ClassSubject.ClassId && u.Role == UserRole.Student && requestStudentIds.Contains(u.Id))
            .CountAsync();

        if (enrolledStudentCount != requestStudentIds.Count)
        {
            throw new ValidationException("One or more students in the bulk update request do not belong to the class associated with this attendance session.");
        }

        var attendances = await _context.Attendances
            .Where(a => a.AttendanceSessionId == sessionId)
            .ToListAsync();

        foreach (var item in request.Records)
        {
            var att = attendances.FirstOrDefault(a => a.StudentId == item.StudentId);
            if (att != null)
            {
                att.Status = item.Status;
                att.CheckInTime = DateTime.UtcNow;
                att.Notes = item.Notes?.Trim();
                att.RecordedByUserId = teacherId;
                att.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        var userRole = (await _context.Users.FindAsync(teacherId))?.Role.ToString() ?? "Teacher";
        return await GetSessionByIdAsync(sessionId, teacherId, userRole);
    }

    public async Task<AttendanceSessionResponse?> CloseSessionAsync(Guid sessionId, Guid teacherId)
    {
        var session = await _context.AttendanceSessions
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session == null) return null;

        if (!await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, session.TeacherId) &&
            !await _context.IsTeacherOrAdminAuthorizedAsync(teacherId, session.ClassSubject.TeacherSubject.TeacherId))
        {
            throw new UnauthorizedAccessException("Teacher is not authorized to close this attendance session.");
        }

        if (session.Status.Equals("Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Attendance session is already closed.");
        }

        session.Status = "Closed";
        session.ClosedAt = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        // Auto-convert all remaining NotMarked attendances to Alpha
        var notMarkedAttendances = await _context.Attendances
            .Where(a => a.AttendanceSessionId == sessionId && a.Status == AttendanceStatus.NotMarked)
            .ToListAsync();

        foreach (var att in notMarkedAttendances)
        {
            att.Status = AttendanceStatus.Alpha;
            att.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        var sessionFull = await BuildSessionQuery().FirstOrDefaultAsync(s => s.Id == sessionId);
        if (sessionFull != null)
        {
            var studentIds = sessionFull.Attendances.Select(a => a.StudentId).ToList();
            var subjectName = sessionFull.ClassSubject?.TeacherSubject?.Subject?.Name ?? "Mata Pelajaran";

            if (studentIds.Any())
            {
                await _notificationService.NotifyUsersAsync(
                    studentIds,
                    $"Presensi Ditutup: {subjectName}",
                    $"Sesi presensi untuk {subjectName} telah ditutup.",
                    NotificationType.AttendanceClosed,
                    NotificationPriority.Normal,
                    sessionId.ToString(),
                    NotificationReferenceType.AttendanceSession,
                    $"/student/attendance/{sessionId}",
                    "calendar-xmark",
                    "#ef4444"
                );
            }
        }

        var userRole = (await _context.Users.FindAsync(teacherId))?.Role.ToString() ?? "Teacher";
        return await GetSessionByIdAsync(sessionId, teacherId, userRole);
    }

    public async Task<List<AttendanceRecordResponse>> GetStudentAttendanceHistoryAsync(Guid studentId)
    {
        var list = await _context.Attendances
            .AsNoTracking()
            .Include(a => a.Student)
            .Include(a => a.AttendanceSession)
                .ThenInclude(s => s!.ClassSubject)
                    .ThenInclude(cs => cs.Class)
            .Include(a => a.AttendanceSession)
                .ThenInclude(s => s!.ClassSubject)
                    .ThenInclude(cs => cs.TeacherSubject)
                        .ThenInclude(ts => ts.Subject)
            .Include(a => a.AttendanceSession)
                .ThenInclude(s => s!.Teacher)
            .Where(a => a.StudentId == studentId && a.AttendanceSessionId != null)
            .OrderByDescending(a => a.AttendanceDate)
            .ToListAsync();

        return list.Select(a => new AttendanceRecordResponse
        {
            Id = a.Id,
            AttendanceSessionId = a.AttendanceSessionId ?? Guid.Empty,
            StudentId = a.StudentId,
            StudentName = a.Student?.FullName ?? string.Empty,
            StudentNis = a.Student?.NIS ?? string.Empty,
            ClassName = a.AttendanceSession?.ClassSubject?.Class?.Name ?? string.Empty,
            SubjectName = a.AttendanceSession?.ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty,
            SubjectCode = a.AttendanceSession?.ClassSubject?.TeacherSubject?.Subject?.Code ?? string.Empty,
            TeacherName = a.AttendanceSession?.Teacher?.FullName ?? string.Empty,
            Date = a.AttendanceSession?.Date ?? a.AttendanceDate,
            Status = a.Status.ToString(),
            CheckInTime = a.CheckInTime,
            Notes = a.Notes
        }).ToList();
    }

    private IQueryable<AttendanceSession> BuildSessionQuery()
    {
        return _context.AttendanceSessions
            .AsNoTracking()
            .Include(s => s.Teacher)
            .Include(s => s.Semester)
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.Class)
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject)
            .Include(s => s.Attendances)
                .ThenInclude(a => a.Student);
    }

    private static AttendanceSessionResponse MapToSessionResponse(AttendanceSession s, Guid requestingUserId, string requestingUserRole)
    {
        var isStudent = string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase);

        var rawAttendances = isStudent
            ? s.Attendances.Where(a => a.StudentId == requestingUserId).ToList()
            : s.Attendances.ToList();

        var attList = rawAttendances.Select(a => new AttendanceRecordResponse
        {
            Id = a.Id,
            AttendanceSessionId = s.Id,
            StudentId = a.StudentId,
            StudentName = a.Student?.FullName ?? string.Empty,
            StudentNis = a.Student?.NIS ?? string.Empty,
            Status = a.Status.ToString(),
            CheckInTime = a.CheckInTime,
            Notes = a.Notes
        }).OrderBy(a => a.StudentName).ToList();

        var allAttendances = s.Attendances.ToList();

        return new AttendanceSessionResponse
        {
            Id = s.Id,
            ScheduleId = s.ScheduleId,
            ClassSubjectId = s.ClassSubjectId,
            ClassName = s.ClassSubject?.Class?.Name ?? string.Empty,
            SubjectName = s.ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty,
            SubjectCode = s.ClassSubject?.TeacherSubject?.Subject?.Code ?? string.Empty,
            TeacherId = s.TeacherId,
            TeacherName = s.Teacher?.FullName ?? string.Empty,
            SemesterId = s.SemesterId,
            SessionNumber = s.SessionNumber,
            Date = s.Date,
            OpenedAt = s.OpenedAt,
            ClosedAt = s.ClosedAt,
            Status = s.Status,
            TotalStudents = allAttendances.Count,
            PresentCount = allAttendances.Count(a => a.Status == AttendanceStatus.Present),
            LateCount = allAttendances.Count(a => a.Status == AttendanceStatus.Late),
            PermissionCount = allAttendances.Count(a => a.Status == AttendanceStatus.Permission),
            SickCount = allAttendances.Count(a => a.Status == AttendanceStatus.Sick),
            AlphaCount = allAttendances.Count(a => a.Status == AttendanceStatus.Alpha),
            NotMarkedCount = allAttendances.Count(a => a.Status == AttendanceStatus.NotMarked),
            Attendances = attList
        };
    }
}
