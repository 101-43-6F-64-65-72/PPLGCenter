using System.ComponentModel.DataAnnotations;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _context;

    public ScheduleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ScheduleResponse>> GetAllAsync(Guid? semesterId = null, Guid? classId = null, Guid? teacherId = null, int? dayOfWeek = null)
    {
        var query = BuildScheduleQuery();

        if (semesterId.HasValue)
            query = query.Where(s => s.SemesterId == semesterId.Value);

        if (classId.HasValue)
            query = query.Where(s => s.ClassSubject.ClassId == classId.Value);

        if (teacherId.HasValue)
            query = query.Where(s => s.ClassSubject.TeacherSubject.TeacherId == teacherId.Value);

        if (dayOfWeek.HasValue)
            query = query.Where(s => (int)s.DayOfWeek == dayOfWeek.Value);

        var list = await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<ScheduleResponse?> GetByIdAsync(Guid id)
    {
        var s = await BuildScheduleQuery().FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return null;
        return MapToResponse(s);
    }

    public async Task<ScheduleResponse> CreateAsync(CreateScheduleRequest request)
    {
        var (startTs, endTs) = ParseTimes(request.StartTime, request.EndTime);
        var dayEnum = (DayOfWeek)(request.DayOfWeek % 7); // convert 1=Mon..7=Sun to DayOfWeek

        // Validate Conflict Rules
        await ValidateScheduleRulesAsync(
            scheduleId: null,
            classSubjectId: request.ClassSubjectId,
            semesterId: request.SemesterId,
            dayOfWeek: dayEnum,
            startTime: startTs,
            endTime: endTs,
            room: request.Room);

        var schedule = new Schedule
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = request.ClassSubjectId,
            SemesterId = request.SemesterId,
            DayOfWeek = dayEnum,
            StartTime = startTs,
            EndTime = endTs,
            Room = request.Room.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#2c1ee8" : request.Color.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(schedule.Id))!;
    }

    public async Task<ScheduleResponse?> UpdateAsync(Guid id, UpdateScheduleRequest request)
    {
        var schedule = await _context.Schedules.FindAsync(id);
        if (schedule == null) return null;

        var (startTs, endTs) = ParseTimes(request.StartTime, request.EndTime);
        var dayEnum = (DayOfWeek)(request.DayOfWeek % 7);

        // Validate Conflict Rules excluding current schedule
        await ValidateScheduleRulesAsync(
            scheduleId: id,
            classSubjectId: request.ClassSubjectId,
            semesterId: request.SemesterId,
            dayOfWeek: dayEnum,
            startTime: startTs,
            endTime: endTs,
            room: request.Room);

        schedule.ClassSubjectId = request.ClassSubjectId;
        schedule.SemesterId = request.SemesterId;
        schedule.DayOfWeek = dayEnum;
        schedule.StartTime = startTs;
        schedule.EndTime = endTs;
        schedule.Room = request.Room.Trim();
        schedule.Color = request.Color?.Trim();
        schedule.IsActive = request.IsActive;
        schedule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var schedule = await _context.Schedules.FindAsync(id);
        if (schedule == null) return false;

        _context.Schedules.Remove(schedule);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ScheduleResponse>> GetTodaySchedulesForStudentAsync(Guid studentId)
    {
        var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == studentId);
        if (student == null || !student.ClassId.HasValue) return new List<ScheduleResponse>();

        var todayDay = DateTime.UtcNow.DayOfWeek;

        var activeSemester = await _context.Semesters
            .AsNoTracking()
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.IsActive && s.AcademicYear.IsActive);

        if (activeSemester == null) return new List<ScheduleResponse>();

        var list = await BuildScheduleQuery()
            .Where(s => s.SemesterId == activeSemester.Id &&
                        s.ClassSubject.ClassId == student.ClassId.Value &&
                        s.DayOfWeek == todayDay &&
                        s.IsActive)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<List<ScheduleResponse>> GetTodaySchedulesForTeacherAsync(Guid teacherId)
    {
        var todayDay = DateTime.UtcNow.DayOfWeek;

        var activeSemester = await _context.Semesters
            .AsNoTracking()
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.IsActive && s.AcademicYear.IsActive);

        if (activeSemester == null) return new List<ScheduleResponse>();

        var list = await BuildScheduleQuery()
            .Where(s => s.SemesterId == activeSemester.Id &&
                        s.ClassSubject.TeacherSubject.TeacherId == teacherId &&
                        s.DayOfWeek == todayDay &&
                        s.IsActive)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private Helpers & Conflict Detection Engine
    // ─────────────────────────────────────────────────────────────────────────

    private IQueryable<Schedule> BuildScheduleQuery()
    {
        return _context.Schedules
            .AsNoTracking()
            .Include(s => s.Semester)
                .ThenInclude(sem => sem.AcademicYear)
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.Class)
                    .ThenInclude(c => c.Department)
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Teacher)
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
                    .ThenInclude(ts => ts.Subject);
    }

    private static (TimeSpan Start, TimeSpan End) ParseTimes(string startStr, string endStr)
    {
        if (!TimeSpan.TryParseExact(startStr, @"hh\:mm", CultureInfo.InvariantCulture, out var startTs) &&
            !TimeSpan.TryParse(startStr, out startTs))
        {
            throw new ValidationException($"Invalid StartTime format '{startStr}'. Must be HH:mm.");
        }

        if (!TimeSpan.TryParseExact(endStr, @"hh\:mm", CultureInfo.InvariantCulture, out var endTs) &&
            !TimeSpan.TryParse(endStr, out endTs))
        {
            throw new ValidationException($"Invalid EndTime format '{endStr}'. Must be HH:mm.");
        }

        if (startTs >= endTs)
        {
            throw new ValidationException("StartTime must be strictly earlier than EndTime.");
        }

        return (startTs, endTs);
    }

    private async Task ValidateScheduleRulesAsync(
        Guid? scheduleId,
        Guid classSubjectId,
        Guid semesterId,
        DayOfWeek dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        string room)
    {
        // 1. Validate Semester & AcademicYear active status
        var semester = await _context.Semesters
            .AsNoTracking()
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.Id == semesterId);

        if (semester == null)
        {
            throw new ValidationException("Semester not found.");
        }

        if (!semester.IsActive)
        {
            throw new ValidationException($"Cannot schedule in inactive semester '{semester.Name}'.");
        }

        if (!semester.AcademicYear.IsActive)
        {
            throw new ValidationException($"Cannot schedule in semester with inactive academic year '{semester.AcademicYear.Name}'.");
        }

        // 2. Validate ClassSubject existence & details
        var classSubject = await _context.ClassSubjects
            .AsNoTracking()
            .Include(cs => cs.Class)
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Teacher)
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Subject)
            .FirstOrDefaultAsync(cs => cs.Id == classSubjectId);

        if (classSubject == null)
        {
            throw new ValidationException("ClassSubject assignment not found.");
        }

        var teacherId = classSubject.TeacherSubject.TeacherId;
        var classId = classSubject.ClassId;
        var roomLower = room.Trim().ToLower();

        // Query existing schedules in the same semester and day
        var query = _context.Schedules
            .AsNoTracking()
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .Where(s => s.SemesterId == semesterId && s.DayOfWeek == dayOfWeek && s.IsActive);

        if (scheduleId.HasValue)
        {
            query = query.Where(s => s.Id != scheduleId.Value);
        }

        var existingSchedules = await query.ToListAsync();

        foreach (var existing in existingSchedules)
        {
            // Time interval overlap test: newStart < existingEnd && newEnd > existingStart
            bool overlaps = startTime < existing.EndTime && endTime > existing.StartTime;
            if (!overlaps) continue; // Adjacent or non-overlapping time ranges are allowed

            // A. Teacher Conflict Check
            if (existing.ClassSubject.TeacherSubject.TeacherId == teacherId)
            {
                var teacherName = classSubject.TeacherSubject.Teacher.FullName;
                throw new ValidationException(
                    $"Bentrok Guru: Guru '{teacherName}' sudah memiliki jadwal mengajar pada jam {existing.StartTime:hh\\:mm}-{existing.EndTime:hh\\:mm}.");
            }

            // B. Class Conflict Check
            if (existing.ClassSubject.ClassId == classId)
            {
                var className = classSubject.Class.Name;
                throw new ValidationException(
                    $"Bentrok Kelas: Kelas '{className}' sudah memiliki pelajaran pada jam {existing.StartTime:hh\\:mm}-{existing.EndTime:hh\\:mm}.");
            }

            // C. Room Conflict Check
            if (existing.Room.Trim().ToLower() == roomLower)
            {
                throw new ValidationException(
                    $"Bentrok Ruangan: Ruangan '{room}' sudah digunakan pada jam {existing.StartTime:hh\\:mm}-{existing.EndTime:hh\\:mm}.");
            }
        }
    }

    private static ScheduleResponse MapToResponse(Schedule s)
    {
        int dayNum = (int)s.DayOfWeek;
        if (dayNum == 0) dayNum = 7; // Convert 0 (Sunday) to 7

        string dayNameStr = s.DayOfWeek switch
        {
            DayOfWeek.Monday => "Senin",
            DayOfWeek.Tuesday => "Selasa",
            DayOfWeek.Wednesday => "Rabu",
            DayOfWeek.Thursday => "Kamis",
            DayOfWeek.Friday => "Jumat",
            DayOfWeek.Saturday => "Sabtu",
            DayOfWeek.Sunday => "Minggu",
            _ => s.DayOfWeek.ToString()
        };

        return new ScheduleResponse
        {
            Id = s.Id,
            ClassSubjectId = s.ClassSubjectId,
            ClassId = s.ClassSubject?.ClassId ?? Guid.Empty,
            ClassName = s.ClassSubject?.Class?.Name ?? string.Empty,
            SubjectId = s.ClassSubject?.TeacherSubject?.SubjectId ?? Guid.Empty,
            SubjectCode = s.ClassSubject?.TeacherSubject?.Subject?.Code ?? string.Empty,
            SubjectName = s.ClassSubject?.TeacherSubject?.Subject?.Name ?? string.Empty,
            TeacherId = s.ClassSubject?.TeacherSubject?.TeacherId ?? Guid.Empty,
            TeacherName = s.ClassSubject?.TeacherSubject?.Teacher?.FullName ?? string.Empty,
            SemesterId = s.SemesterId,
            SemesterName = s.Semester?.Name ?? string.Empty,
            AcademicYearName = s.Semester?.AcademicYear?.Name ?? string.Empty,
            DayOfWeek = dayNum,
            DayName = dayNameStr,
            StartTime = s.StartTime.ToString(@"hh\:mm"),
            EndTime = s.EndTime.ToString(@"hh\:mm"),
            Room = s.Room,
            Color = s.Color,
            IsActive = s.IsActive,
            CreatedAt = s.CreatedAt
        };
    }
}
