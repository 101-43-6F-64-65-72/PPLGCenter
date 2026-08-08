using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ReportCardService : IReportCardService
{
    private readonly AppDbContext _context;
    private readonly IStudentGradeService _gradeService;

    public ReportCardService(AppDbContext context, IStudentGradeService gradeService)
    {
        _context = context;
        _gradeService = gradeService;
    }

    public async Task<ReportCardSummaryResponse> GetStudentReportCardSummaryAsync(Guid studentId, Guid? semesterId = null)
    {
        var student = await _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student == null) throw new ValidationException("Student not found.");

        var activeSemester = semesterId.HasValue
            ? await _context.Semesters.Include(s => s.AcademicYear).FirstOrDefaultAsync(s => s.Id == semesterId.Value)
            : await _context.Semesters.Include(s => s.AcademicYear).FirstOrDefaultAsync(s => s.IsActive);

        var transcript = await _gradeService.GetStudentTranscriptAsync(studentId);

        // Attendance stats
        var attendances = await _context.Attendances
            .AsNoTracking()
            .Where(a => a.StudentId == studentId && a.Status != AttendanceStatus.NotMarked)
            .ToListAsync();

        int presentCount = attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late);
        int absentCount = attendances.Count(a => a.Status == AttendanceStatus.Alpha || a.Status == AttendanceStatus.Absent);
        int totalDays = attendances.Count;

        double attendancePct = totalDays > 0 ? Math.Round((double)presentCount / totalDays * 100.0, 1) : 100.0;

        string remarks = transcript.OverallAverageScore >= 80.0m
            ? "Pertahankan prestasi akademis dan tingkatkan keaktifan."
            : transcript.OverallAverageScore >= 60.0m
                ? "Tingkatkan motivasi belajar dan rajin mengerjakan tugas."
                : "Perlu bimbingan dan perbaikan pada beberapa mata pelajaran.";

        return new ReportCardSummaryResponse
        {
            StudentId = studentId,
            StudentName = student.FullName,
            StudentNis = student.NIS ?? string.Empty,
            ClassName = student.Class?.Name ?? "N/A",
            SemesterName = activeSemester?.Name ?? "Semester Aktif",
            AcademicYear = activeSemester?.AcademicYear?.Name ?? "2025/2026",
            SemesterAverage = transcript.OverallAverageScore,
            OverallLetterGrade = transcript.OverallLetterGrade,
            OverallPredicate = transcript.OverallPredicate,
            AttendancePercentage = attendancePct,
            TotalPresentDays = presentCount,
            TotalAbsentDays = absentCount,
            SubjectGrades = transcript.SubjectSummaries,
            TeacherRemarks = remarks
        };
    }
}
