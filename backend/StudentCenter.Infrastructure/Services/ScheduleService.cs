using System.ComponentModel.DataAnnotations;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _context;
    private readonly IScheduleRotationService _rotationService;

    private static readonly TimeZoneInfo WibTimeZone = GetWibTimeZone();

    public ScheduleService(AppDbContext context) : this(context, new ScheduleRotationService(context))
    {
    }

    public ScheduleService(AppDbContext context, IScheduleRotationService rotationService)
    {
        _context = context;
        _rotationService = rotationService;
    }


    private static TimeZoneInfo GetWibTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Jakarta");
        }
    }

    public static DateTime GetWibNow()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, WibTimeZone);
    }


    public async Task<List<ScheduleResponse>> GetAllAsync(
        Guid? semesterId = null,
        Guid? classId = null,
        Guid? teacherId = null,
        int? dayOfWeek = null,
        Guid? requestingUserId = null,
        string? requestingUserRole = null)
    {
        var query = BuildScheduleQuery();

        if (semesterId.HasValue)
        {
            query = query.Where(s => s.SemesterId == semesterId.Value);
        }

        if (classId.HasValue)
            query = query.Where(s => s.ClassSubject.ClassId == classId.Value);

        if (teacherId.HasValue)
            query = query.Where(s => s.ClassSubject.TeacherSubject.TeacherId == teacherId.Value);

        if (dayOfWeek.HasValue)
        {
            DayOfWeek targetDay = (dayOfWeek.Value == 7) ? DayOfWeek.Sunday : (DayOfWeek)(dayOfWeek.Value % 7);
            query = query.Where(s => s.DayOfWeek == targetDay);
        }




        var list = await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime).ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<ScheduleResponse?> GetByIdAsync(
        Guid id,
        Guid? requestingUserId = null,
        string? requestingUserRole = null)
    {
        var s = await BuildScheduleQuery().FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return null;

        if (requestingUserId.HasValue && requestingUserRole != "Admin")
        {
            if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
            {
                var student = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == requestingUserId.Value);
                if (student?.ClassId != s.ClassSubject.ClassId)
                {
                    throw new UnauthorizedAccessException("Student is not authorized to view schedules outside their class.");
                }
            }
            else if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
            {
                if (s.ClassSubject.TeacherSubject.TeacherId != requestingUserId.Value)
                {
                    throw new UnauthorizedAccessException("Teacher is not authorized to view schedules outside their teaching scope.");
                }
            }
        }

        return MapToResponse(s);
    }

    public async Task<ScheduleResponse> CreateAsync(CreateScheduleRequest request, Guid? requestingUserId = null, string? requestingUserRole = null)
    {
        var classSubject = await _context.ClassSubjects
            .Include(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(cs => cs.Id == request.ClassSubjectId);

        if (classSubject == null)
            throw new ValidationException("ClassSubject assignment not found.");

        VerifyMutationAuthorization(classSubject, requestingUserId, requestingUserRole);

        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

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

        var semester = await _context.Semesters.FindAsync(request.SemesterId);

        var schedule = new Schedule
        {
            Id = Guid.NewGuid(),
            ClassSubjectId = request.ClassSubjectId,
            ClassSubject = classSubject,
            SemesterId = request.SemesterId,
            Semester = semester!,
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

        if (transaction != null)
            await transaction.CommitAsync();

        return (await GetByIdAsync(schedule.Id, requestingUserId, requestingUserRole)) ?? MapToResponse(schedule);
    }

    public async Task<ScheduleResponse?> UpdateAsync(Guid id, UpdateScheduleRequest request, Guid? requestingUserId = null, string? requestingUserRole = null)
    {
        var schedule = await _context.Schedules
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule == null) return null;

        VerifyMutationAuthorization(schedule.ClassSubject, requestingUserId, requestingUserRole);

        using var transaction = _context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null;

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

        if (transaction != null)
            await transaction.CommitAsync();

        return (await GetByIdAsync(id, requestingUserId, requestingUserRole)) ?? MapToResponse(schedule);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid? requestingUserId = null, string? requestingUserRole = null)
    {
        var schedule = await _context.Schedules
            .Include(s => s.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (schedule == null) return false;

        VerifyMutationAuthorization(schedule.ClassSubject, requestingUserId, requestingUserRole);

        _context.Schedules.Remove(schedule);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void VerifyMutationAuthorization(ClassSubject classSubject, Guid? requestingUserId, string? requestingUserRole)
    {
        if (string.Equals(requestingUserRole, "Admin", StringComparison.OrdinalIgnoreCase))
            return;

        if (string.Equals(requestingUserRole, "Teacher", StringComparison.OrdinalIgnoreCase))
        {
            if (requestingUserId.HasValue && classSubject?.TeacherSubject?.TeacherId == requestingUserId.Value)
                return;

            throw new UnauthorizedAccessException("Teacher is only authorized to manage schedules for their assigned class subjects.");
        }

        if (string.Equals(requestingUserRole, "Student", StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Student is not authorized to create, update, or delete schedules.");
        }
    }

    public async Task<StudentTodayScheduleResponse> GetTodaySchedulesForStudentAsync(Guid studentId)
    {
        var student = await _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student == null || !student.ClassId.HasValue)
        {
            return new StudentTodayScheduleResponse
            {
                ClassName = string.Empty,
                ActiveCategory = SubjectCategory.MPU,
                IsKkUnavailable = false,
                Items = new List<ScheduleResponse>()
            };
        }

        var className = student.Class?.Name ?? string.Empty;

        var wibNow = GetWibNow();
        var todayDay = wibNow.DayOfWeek;

        var activeCategory = await _rotationService.GetCurrentCategoryForClassAsync(student.ClassId.Value, wibNow);

        var activeSemester = await _context.Semesters
            .AsNoTracking()
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.IsActive && s.AcademicYear.IsActive);

        if (activeSemester == null)
        {
            return new StudentTodayScheduleResponse
            {
                ClassName = className,
                ActiveCategory = activeCategory,
                IsKkUnavailable = (activeCategory == SubjectCategory.KK),
                Items = new List<ScheduleResponse>()
            };
        }

        var list = await BuildScheduleQuery()
            .Where(s => s.SemesterId == activeSemester.Id &&
                        s.ClassSubject.ClassId == student.ClassId.Value &&
                        s.DayOfWeek == todayDay &&
                        s.IsActive)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        var items = list.Select(MapToResponse).ToList();
        var isKkUnavailable = (activeCategory == SubjectCategory.KK && items.Count == 0);

        return new StudentTodayScheduleResponse
        {
            ClassName = className,
            ActiveCategory = activeCategory,
            IsKkUnavailable = isKkUnavailable,
            Items = items
        };
    }

    public async Task<List<ScheduleResponse>> GetTodaySchedulesForTeacherAsync(Guid teacherId)
    {
        var wibNow = GetWibNow();
        var todayDay = wibNow.DayOfWeek;

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

        // Query overlapping existing schedules in the same semester and day
        var baseQuery = _context.Schedules
            .AsNoTracking()
            .Where(s => s.SemesterId == semesterId &&
                        s.DayOfWeek == dayOfWeek &&
                        s.IsActive &&
                        s.StartTime < endTime &&
                        startTime < s.EndTime);

        if (scheduleId.HasValue)
        {
            baseQuery = baseQuery.Where(s => s.Id != scheduleId.Value);
        }

        // A. Teacher Conflict Check
        var teacherConflict = await baseQuery
            .Where(s => s.ClassSubject.TeacherSubject.TeacherId == teacherId)
            .Select(s => new { s.StartTime, s.EndTime })
            .FirstOrDefaultAsync();

        if (teacherConflict != null)
        {
            var teacherName = classSubject.TeacherSubject.Teacher.FullName;
            throw new ValidationException(
                $"Bentrok Guru: Guru '{teacherName}' sudah memiliki jadwal mengajar pada jam {teacherConflict.StartTime:hh\\:mm}-{teacherConflict.EndTime:hh\\:mm}.");
        }

        // B. Class Conflict Check
        var classConflict = await baseQuery
            .Where(s => s.ClassSubject.ClassId == classId)
            .Select(s => new { s.StartTime, s.EndTime })
            .FirstOrDefaultAsync();

        if (classConflict != null)
        {
            var className = classSubject.Class.Name;
            throw new ValidationException(
                $"Bentrok Kelas: Kelas '{className}' sudah memiliki pelajaran pada jam {classConflict.StartTime:hh\\:mm}-{classConflict.EndTime:hh\\:mm}.");
        }

        // C. Room Conflict Check
        var roomConflict = await baseQuery
            .Where(s => s.Room.Trim().ToLower() == roomLower)
            .Select(s => new { s.StartTime, s.EndTime })
            .FirstOrDefaultAsync();

        if (roomConflict != null)
        {
            throw new ValidationException(
                $"Bentrok Ruangan: Ruangan '{room}' sudah digunakan pada jam {roomConflict.StartTime:hh\\:mm}-{roomConflict.EndTime:hh\\:mm}.");
        }

        // 3. Reverse Facility Booking Integration Check
        var matchedFacility = await _context.Facilities
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Name.ToLower() == roomLower);

        if (matchedFacility != null)
        {
            var approvedBookings = await _context.FacilityBookings
                .AsNoTracking()
                .Where(b => b.FacilityId == matchedFacility.Id && b.Status == BookingStatus.Approved && b.EndTime > DateTime.UtcNow)
                .ToListAsync();

            foreach (var booking in approvedBookings)
            {
                if (booking.StartTime.DayOfWeek == dayOfWeek)
                {
                    var bStart = booking.StartTime.TimeOfDay;
                    var bEnd = booking.EndTime.TimeOfDay;

                    if (startTime < bEnd && endTime > bStart)
                    {
                        throw new InvalidOperationException(
                            $"Bentrok Fasilitas: Ruangan '{room}' telah dibooking oleh pengguna pada jam {bStart:hh\\:mm}-{bEnd:hh\\:mm}.");
                    }
                }
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
