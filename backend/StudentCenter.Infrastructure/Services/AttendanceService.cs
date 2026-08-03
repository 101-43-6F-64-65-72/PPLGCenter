using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AttendanceService> _logger;

    public AttendanceService(AppDbContext context, ILogger<AttendanceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<AttendanceResponse>> GetAllAsync(int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Attendance>()
            .AsNoTracking()
            .AsQueryable();

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.AttendanceDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AttendanceResponse
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student.FullName,
                AttendanceDate = a.AttendanceDate,
                Status = a.Status,
                Notes = a.Notes,
                RecordedByUserId = a.RecordedByUserId,
                RecordedByUserName = a.RecordedByUser.FullName,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<AttendanceResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AttendanceResponse?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Attendance>()
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new AttendanceResponse
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student.FullName,
                AttendanceDate = a.AttendanceDate,
                Status = a.Status,
                Notes = a.Notes,
                RecordedByUserId = a.RecordedByUserId,
                RecordedByUserName = a.RecordedByUser.FullName,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PagedResult<AttendanceResponse>> GetByStudentAsync(Guid studentId, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var query = _context.Set<Attendance>()
            .AsNoTracking()
            .Where(a => a.StudentId == studentId);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.AttendanceDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AttendanceResponse
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student.FullName,
                AttendanceDate = a.AttendanceDate,
                Status = a.Status,
                Notes = a.Notes,
                RecordedByUserId = a.RecordedByUserId,
                RecordedByUserName = a.RecordedByUser.FullName,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<AttendanceResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PagedResult<AttendanceResponse>> GetByDateAsync(DateTime date, int page, int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var dateOnly = date.Date;
        var query = _context.Set<Attendance>()
            .AsNoTracking()
            .Where(a => a.AttendanceDate.Date == dateOnly);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(a => a.Student.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AttendanceResponse
            {
                Id = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student.FullName,
                AttendanceDate = a.AttendanceDate,
                Status = a.Status,
                Notes = a.Notes,
                RecordedByUserId = a.RecordedByUserId,
                RecordedByUserName = a.RecordedByUser.FullName,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<AttendanceResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<AttendanceResponse> CreateAsync(CreateAttendanceRequest request, Guid recordedByUserId)
    {
        if (request.AttendanceDate.Date > DateTime.UtcNow.Date)
            throw new InvalidOperationException("Attendance date cannot be in the future.");

        var student = await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.StudentId);

        if (student is null)
            throw new KeyNotFoundException("Student not found.");

        var existing = await _context.Set<Attendance>()
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.StudentId == request.StudentId && a.AttendanceDate.Date == request.AttendanceDate.Date);

        if (existing is not null)
            throw new InvalidOperationException("Attendance already exists for this student on this date.");

        var recorder = await _context.Set<User>()
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == recordedByUserId);

        if (recorder is null)
            throw new KeyNotFoundException("Recorder user not found.");

        var attendance = new Attendance
        {
            Id = Guid.NewGuid(),
            StudentId = request.StudentId,
            AttendanceDate = request.AttendanceDate.Date,
            Status = request.Status,
            Notes = request.Notes,
            RecordedByUserId = recordedByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Set<Attendance>().Add(attendance);
        await _context.SaveChangesAsync();

        return new AttendanceResponse
        {
            Id = attendance.Id,
            StudentId = attendance.StudentId,
            StudentName = student.FullName,
            AttendanceDate = attendance.AttendanceDate,
            Status = attendance.Status,
            Notes = attendance.Notes,
            RecordedByUserId = attendance.RecordedByUserId,
            RecordedByUserName = recorder.FullName,
            CreatedAt = attendance.CreatedAt,
            UpdatedAt = attendance.UpdatedAt
        };
    }

    public async Task<AttendanceResponse?> UpdateAsync(Guid id, UpdateAttendanceRequest request, Guid userId, string userRole)
    {
        var attendance = await _context.Set<Attendance>()
            .Include(a => a.Student)
            .Include(a => a.RecordedByUser)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance is null)
            return null;

        if (userRole != "Admin" && attendance.RecordedByUserId != userId)
            throw new UnauthorizedAccessException("You can only update attendance you recorded.");

        attendance.Status = request.Status;
        attendance.Notes = request.Notes;
        attendance.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new AttendanceResponse
        {
            Id = attendance.Id,
            StudentId = attendance.StudentId,
            StudentName = attendance.Student.FullName,
            AttendanceDate = attendance.AttendanceDate,
            Status = attendance.Status,
            Notes = attendance.Notes,
            RecordedByUserId = attendance.RecordedByUserId,
            RecordedByUserName = attendance.RecordedByUser.FullName,
            CreatedAt = attendance.CreatedAt,
            UpdatedAt = attendance.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId, string userRole)
    {
        var attendance = await _context.Set<Attendance>()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance is null)
            return false;

        if (userRole != "Admin" && attendance.RecordedByUserId != userId)
            throw new UnauthorizedAccessException("You can only delete attendance you recorded.");

        _context.Set<Attendance>().Remove(attendance);
        await _context.SaveChangesAsync();

        return true;
    }
}
