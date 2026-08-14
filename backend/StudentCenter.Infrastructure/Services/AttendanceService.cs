using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

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

    public async Task<List<AttendanceSessionResponse>> GetAllSessionsAsync(Guid? scheduleId = null, Guid? classSubjectId = null, DateTime? date = null, string? status = null)
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

        var list = await query.OrderByDescending(s => s.Date).ThenByDescending(s => s.CreatedAt).ToListAsync();

        return list.Select(MapToSessionResponse).ToList();
    }

    public async Task<AttendanceSessionResponse?> GetSessionByIdAsync(Guid sessionId)
    {
        var session = await BuildSessionQuery().FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null) return null;
        return MapToSessionResponse(session);
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
        if (teacherId != scheduleTeacherId)
        {
            var requestingUser = await _context.Users.FindAsync(teacherId);
            if (requestingUser?.Role != UserRole.Admin)
            {
                throw new ValidationException("Only the designated teacher for this schedule can open an attendance session.");
            }
        }

        var sessionDate = request.Date.Date;

        if (await _context.AttendanceSessions.AnyAsync(s => s.ScheduleId == request.ScheduleId && s.Date == sessionDate))
        {
            throw new ValidationException($"Attendance session for this schedule on {sessionDate:yyyy-MM-dd} already exists.");
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

        await _context.SaveChangesAsync();

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

        return (await GetSessionByIdAsync(session.Id))!;
    }

    public async Task<AttendanceSessionResponse?> UpdateStudentStatusAsync(Guid sessionId, Guid teacherId, UpdateAttendanceStatusRequest request)
    {
        var session = await _context.AttendanceSessions.FindAsync(sessionId);
        if (session == null) return null;

        if (session.Status.Equals("Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Closed attendance session is immutable and cannot be modified.");
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
        return await GetSessionByIdAsync(sessionId);
    }

    public async Task<AttendanceSessionResponse?> BulkUpdateAttendanceAsync(Guid sessionId, Guid teacherId, BulkUpdateAttendanceRequest request)
    {
        var session = await _context.AttendanceSessions.FindAsync(sessionId);
        if (session == null) return null;

        if (session.Status.Equals("Closed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Closed attendance session is immutable and cannot be modified.");
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
        return await GetSessionByIdAsync(sessionId);
    }

    public async Task<AttendanceSessionResponse?> CloseSessionAsync(Guid sessionId, Guid teacherId)
    {
        var session = await _context.AttendanceSessions.FindAsync(sessionId);
        if (session == null) return null;

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

        return await GetSessionByIdAsync(sessionId);
    }

    public async Task<List<AttendanceRecordResponse>> GetStudentAttendanceHistoryAsync(Guid studentId)
    {
        var list = await _context.Attendances
            .AsNoTracking()
            .Include(a => a.Student)
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

    private static AttendanceSessionResponse MapToSessionResponse(AttendanceSession s)
    {
        var attList = s.Attendances.Select(a => new AttendanceRecordResponse
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
            TotalStudents = attList.Count,
            PresentCount = attList.Count(a => a.Status == "Present"),
            LateCount = attList.Count(a => a.Status == "Late"),
            PermissionCount = attList.Count(a => a.Status == "Permission"),
            SickCount = attList.Count(a => a.Status == "Sick"),
            AlphaCount = attList.Count(a => a.Status == "Alpha"),
            NotMarkedCount = attList.Count(a => a.Status == "NotMarked"),
            Attendances = attList
        };
    }
}
