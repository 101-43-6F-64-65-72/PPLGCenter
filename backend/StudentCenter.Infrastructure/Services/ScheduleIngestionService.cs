using System.ComponentModel.DataAnnotations;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class ScheduleIngestionService : IScheduleIngestionService
{
    private readonly AppDbContext _context;

    public ScheduleIngestionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ImportSummaryResponse> ImportWeeklyAgendaCsvAsync(string csvContent)
    {
        if (string.IsNullOrWhiteSpace(csvContent))
            throw new ValidationException("CSV content cannot be empty.");

        using var transaction = (_context.Database.IsRelational() && _context.Database.CurrentTransaction == null) ? await _context.Database.BeginTransactionAsync() : null;


        try
        {
            var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length <= 1)
            {
                return new ImportSummaryResponse { TotalRead = 0, SuccessCount = 0, SkippedCount = 0, FailedCount = 0 };
            }


            var classes = await _context.SchoolClasses.ToListAsync();
            var activeAcademicYear = await _context.AcademicYears.FirstOrDefaultAsync(ay => ay.IsActive)
                ?? await _context.AcademicYears.FirstOrDefaultAsync();

            if (activeAcademicYear == null)
            {
                throw new ValidationException("Active AcademicYear not found in database.");
            }

            var ganjilSemester = await _context.Semesters.FirstOrDefaultAsync(s => s.AcademicYearId == activeAcademicYear.Id && s.Name.Contains("Ganjil"))
                ?? await _context.Semesters.FirstOrDefaultAsync(s => s.AcademicYearId == activeAcademicYear.Id);
            var genapSemester = await _context.Semesters.FirstOrDefaultAsync(s => s.AcademicYearId == activeAcademicYear.Id && s.Name.Contains("Genap"))
                ?? ganjilSemester;

            int processed = 0;
            int inserted = 0;
            int skipped = 0;

            for (int i = 1; i < lines.Length; i++)
            {
                var row = ParseCsvLine(lines[i]);
                if (row.Count < 6) continue;

                processed++;
                var rawClassName = row[0].Trim();
                var semesterName = row[1].Trim();
                var monthStr = row[2].Trim();
                var weekNumStr = row[3].Trim();
                var dateRangeStr = row[4].Trim();
                var code = row[5].Trim().ToUpperInvariant();
                var description = row.Count > 6 ? row[6].Trim() : string.Empty;

                var normalizedClassName = NormalizeClassName(rawClassName);
                var targetClass = classes.FirstOrDefault(c => string.Equals(c.Name, normalizedClassName, StringComparison.OrdinalIgnoreCase));
                if (targetClass == null)
                {
                    skipped++;
                    continue;
                }

                // Handle ScheduleRotationConfig for Grade XI classes (XI PPLG-A / XI PPLG-B)
                if (normalizedClassName.StartsWith("XI PPLG", StringComparison.OrdinalIgnoreCase) && int.TryParse(weekNumStr, out int weekNum) && weekNum == 1)
                {
                    var initialCategory = string.Equals(code, "KK", StringComparison.OrdinalIgnoreCase) ? SubjectCategory.KK : SubjectCategory.MPU;
                    var existingConfig = await _context.ScheduleRotationConfigs
                        .FirstOrDefaultAsync(c => c.SchoolClassId == targetClass.Id);

                    if (existingConfig == null)
                    {
                        _context.ScheduleRotationConfigs.Add(new ScheduleRotationConfig
                        {
                            Id = Guid.NewGuid(),
                            SchoolClassId = targetClass.Id,
                            AnchorStartDate = DateTime.SpecifyKind(new DateTime(2026, 7, 13), DateTimeKind.Utc),
                            InitialCategory = initialCategory,
                            CycleWeeks = 1,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        });
                        inserted++;
                    }
                }

                // Map special academic activities to AcademicEvent
                if (!string.Equals(code, "MPU", StringComparison.OrdinalIgnoreCase) && !string.Equals(code, "KK", StringComparison.OrdinalIgnoreCase))
                {
                    var targetSemester = semesterName.Equals("Genap", StringComparison.OrdinalIgnoreCase) ? genapSemester : ganjilSemester;
                    var eventTitle = $"{code} - {normalizedClassName}";
                    var existingEvent = await _context.AcademicEvents
                        .FirstOrDefaultAsync(e => e.TargetClassId == targetClass.Id && e.Title == eventTitle);

                    if (existingEvent == null)
                    {
                        _context.AcademicEvents.Add(new AcademicEvent
                        {
                            Id = Guid.NewGuid(),
                            Title = eventTitle,
                            Description = string.IsNullOrWhiteSpace(description) ? $"Agenda {code} untuk {normalizedClassName}" : description,
                            Type = code switch
                            {
                                "PKL" => "FieldWork",
                                "LIBUR" or "LBID" => "Holiday",
                                "ASAS" or "PSAS" or "ASAT" or "ASAJ" or "TKA" or "BIMBEL TKA" => "Exam",
                                _ => "School"
                            },
                            TargetType = "Class",
                            TargetClassId = targetClass.Id,
                            StartDate = DateTime.SpecifyKind(new DateTime(2026, 7, 13), DateTimeKind.Utc),
                            EndDate = DateTime.SpecifyKind(new DateTime(2027, 6, 30), DateTimeKind.Utc),
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                        inserted++;
                    }
                    else
                    {
                        skipped++;
                    }
                }
            }

            await _context.SaveChangesAsync();
            if (transaction != null) await transaction.CommitAsync();

            return new ImportSummaryResponse
            {
                TotalRead = processed,
                SuccessCount = inserted,
                SkippedCount = skipped,
                FailedCount = 0
            };

        }
        catch (Exception ex)
        {
            if (transaction != null) await transaction.RollbackAsync();
            throw new InvalidOperationException($"Weekly Agenda ingestion failed: {ex.Message}", ex);
        }
    }

    public async Task<ImportSummaryResponse> ImportDailyTimetableCsvAsync(string csvContent)
    {
        if (string.IsNullOrWhiteSpace(csvContent))
            throw new ValidationException("CSV content cannot be empty.");

        using var transaction = (_context.Database.IsRelational() && _context.Database.CurrentTransaction == null) ? await _context.Database.BeginTransactionAsync() : null;


        try
        {
            var lines = csvContent.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length <= 1)
            {
                return new ImportSummaryResponse { TotalRead = 0, SuccessCount = 0, SkippedCount = 0, FailedCount = 0 };
            }


            var classes = await _context.SchoolClasses.ToListAsync();
            var activeSemester = await _context.Semesters
                .Include(s => s.AcademicYear)
                .FirstOrDefaultAsync(s => s.IsActive && s.AcademicYear.IsActive)
                ?? await _context.Semesters.FirstOrDefaultAsync();

            if (activeSemester == null)
            {
                throw new ValidationException("Active Semester not found in database.");
            }

            var defaultTeacher = await _context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Teacher)
                ?? throw new ValidationException("No default teacher found in database.");

            var existingSubjects = await _context.Subjects.ToListAsync();
            var subjectMap = BuildSubjectMap(existingSubjects);

            int processed = 0;
            int inserted = 0;
            int skipped = 0;

            for (int i = 1; i < lines.Length; i++)
            {
                var row = ParseCsvLine(lines[i]);
                if (row.Count < 6) continue;

                processed++;
                var rawClassName = row[0].Trim();
                var dayStr = row[1].Trim();
                var periodStr = row[2].Trim();
                var timeStr = row[3].Trim();
                var rawSubjectCode = row[4].Trim().ToUpperInvariant();
                var statusStr = row[5].Trim();

                if (string.Equals(rawSubjectCode, "KOSONG", StringComparison.OrdinalIgnoreCase))
                {
                    skipped++;
                    continue;
                }

                var targetClass = classes.FirstOrDefault(c => c.Name.Replace(" ", "").Replace("-", "").Equals(rawClassName.Replace(" ", "").Replace("-", ""), StringComparison.OrdinalIgnoreCase));

                if (targetClass == null)
                {
                    skipped++;
                    continue;
                }

                // Ensure Subject exists in database
                var targetSubject = EnsureSubjectExists(rawSubjectCode, subjectMap);

                // Ensure TeacherSubject assignment exists
                var teacherSubject = await _context.TeacherSubjects
                    .FirstOrDefaultAsync(ts => ts.TeacherId == defaultTeacher.Id && ts.SubjectId == targetSubject.Id);

                if (teacherSubject == null)
                {
                    teacherSubject = new TeacherSubject
                    {
                        Id = Guid.NewGuid(),
                        TeacherId = defaultTeacher.Id,
                        SubjectId = targetSubject.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.TeacherSubjects.Add(teacherSubject);
                    await _context.SaveChangesAsync();
                }

                // Ensure ClassSubject assignment exists
                var classSubject = await _context.ClassSubjects
                    .FirstOrDefaultAsync(cs => cs.ClassId == targetClass.Id && cs.TeacherSubjectId == teacherSubject.Id);

                if (classSubject == null)
                {
                    classSubject = new ClassSubject
                    {
                        Id = Guid.NewGuid(),
                        ClassId = targetClass.Id,
                        TeacherSubjectId = teacherSubject.Id,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.ClassSubjects.Add(classSubject);
                    await _context.SaveChangesAsync();
                }

                // Convert Hari -> DayOfWeek
                var dayOfWeek = ParseDayOfWeek(dayStr);
                var (startTime, endTime) = ParseTimeSlot(timeStr);

                // Idempotency Check: (SemesterId, ClassSubjectId, DayOfWeek, StartTime)
                var existingSchedule = await _context.Schedules
                    .FirstOrDefaultAsync(s => s.SemesterId == activeSemester.Id &&
                                               s.ClassSubjectId == classSubject.Id &&
                                               s.DayOfWeek == dayOfWeek &&
                                               s.StartTime == startTime);

                if (existingSchedule == null)
                {
                    _context.Schedules.Add(new Schedule
                    {
                        Id = Guid.NewGuid(),
                        ClassSubjectId = classSubject.Id,
                        SemesterId = activeSemester.Id,
                        DayOfWeek = dayOfWeek,
                        StartTime = startTime,
                        EndTime = endTime,
                        Room = "Ruang Kelas PPLG",
                        Color = "#2c1ee8",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                    inserted++;
                }
                else
                {
                    skipped++;
                }
            }

            await _context.SaveChangesAsync();
            if (transaction != null) await transaction.CommitAsync();

            return new ImportSummaryResponse
            {
                TotalRead = processed,
                SuccessCount = inserted,
                SkippedCount = skipped,
                FailedCount = 0
            };

        }
        catch (Exception ex)
        {
            if (transaction != null) await transaction.RollbackAsync();
            throw new InvalidOperationException($"Daily MPU Timetable ingestion failed: {ex.Message}", ex);
        }
    }

    private Subject EnsureSubjectExists(string rawSubjectCode, Dictionary<string, Subject> subjectMap)
    {
        if (subjectMap.TryGetValue(rawSubjectCode, out var existing))
            return existing;

        var (canonicalCode, name) = MapSubjectDetails(rawSubjectCode);
        var subject = _context.Subjects.FirstOrDefault(s => s.Code == canonicalCode);
        if (subject == null)
        {
            subject = new Subject
            {
                Id = Guid.NewGuid(),
                Code = canonicalCode,
                Name = name,
                Description = $"Mata Pelajaran {name}",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Subjects.Add(subject);
            _context.SaveChanges();
        }

        subjectMap[rawSubjectCode] = subject;
        return subject;
    }

    private static (string Code, string Name) MapSubjectDetails(string rawCode) => rawCode.Trim().ToUpperInvariant() switch
    {
        "BINDO" => ("BINDO", "BINDO (Bahasa Indonesia)"),
        "BING" => ("BING", "BING (Bahasa Inggris)"),
        "MAT" => ("MAT", "MAT (Matematika)"),
        "PABP" => ("PABP", "PABP (Pendidikan Agama)"),
        "KKA" => ("KKA", "KKA (Kecerdasan Buatan)"),
        "PJOK" => ("PJOK", "PJOK (Penjaskes)"),
        "DPK" => ("DPK", "DPK (Dasar Keahlian)"),
        "IPAS" => ("IPAS", "IPAS (Projek IPAS)"),
        "PP" => ("PP", "PP (Pendidikan Pancasila)"),
        "SB" => ("SB", "SB (Seni Budaya)"),
        "BK" => ("BK", "BK (Bimbingan Konseling)"),
        "BJW" => ("BJW", "BJW (Bahasa Jawa)"),
        "INF" => ("INF", "INF (Informatika)"),
        "SEJ" => ("SEJ", "SEJ (Sejarah)"),
        "MPP" => ("MPP", "MPP (Mata Pelajaran Pilihan)"),
        _ => (rawCode, rawCode)
    };

    private static Dictionary<string, Subject> BuildSubjectMap(List<Subject> existing)
    {
        var dict = new Dictionary<string, Subject>(StringComparer.OrdinalIgnoreCase);
        foreach (var s in existing)
        {
            dict[s.Code] = s;
            if (s.Code == "BIND") dict["BINDO"] = s;
            if (s.Code == "MTK") dict["MAT"] = s;
            if (s.Code == "PAI") dict["PABP"] = s;
            if (s.Code == "RPL-AI") dict["KKA"] = s;
            if (s.Code == "RPL-KDD") dict["DPK"] = s;
        }
        return dict;
    }

    private static string NormalizeClassName(string name)
    {
        var trimmed = name.Trim();
        if (trimmed.Equals("X PPLG A", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("X PPLG-A", StringComparison.OrdinalIgnoreCase)) return "X PPLG A";
        if (trimmed.Equals("X PPLG B", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("X PPLG-B", StringComparison.OrdinalIgnoreCase)) return "X PPLG B";
        if (trimmed.Equals("XI PPLG A", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("XI PPLG-A", StringComparison.OrdinalIgnoreCase)) return "XI PPLG A";
        if (trimmed.Equals("XI PPLG B", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("XI PPLG-B", StringComparison.OrdinalIgnoreCase)) return "XI PPLG B";
        if (trimmed.Equals("XII PPLG A", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("XII PPLG-A", StringComparison.OrdinalIgnoreCase)) return "XII PPLG A";
        if (trimmed.Equals("XII PPLG B", StringComparison.OrdinalIgnoreCase) || trimmed.Equals("XII PPLG-B", StringComparison.OrdinalIgnoreCase)) return "XII PPLG B";
        return trimmed;
    }



    private static DayOfWeek ParseDayOfWeek(string dayStr) => dayStr.Trim().ToLowerInvariant() switch
    {
        "senin" => DayOfWeek.Monday,
        "selasa" => DayOfWeek.Tuesday,
        "rabu" => DayOfWeek.Wednesday,
        "kamis" => DayOfWeek.Thursday,
        "jumat" or "jum'at" => DayOfWeek.Friday,
        "sabtu" => DayOfWeek.Saturday,
        "minggu" => DayOfWeek.Sunday,
        _ => DayOfWeek.Monday
    };

    private static (TimeSpan Start, TimeSpan End) ParseTimeSlot(string timeStr)
    {
        var parts = timeStr.Split(new[] { '-', '–' }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 2 &&
            TimeSpan.TryParseExact(parts[0].Trim().Replace('.', ':'), @"h\:mm", CultureInfo.InvariantCulture, out var startTs) &&
            TimeSpan.TryParseExact(parts[1].Trim().Replace('.', ':'), @"h\:mm", CultureInfo.InvariantCulture, out var endTs))
        {
            return (startTs, endTs);
        }
        return (new TimeSpan(7, 0, 0), new TimeSpan(7, 45, 0));
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();

        foreach (char c in line)
        {
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString());
        return result;
    }
}
