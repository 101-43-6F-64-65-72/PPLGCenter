using System.ComponentModel.DataAnnotations;
using System.Text;
using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class StudentGradeService : IStudentGradeService
{
    private readonly AppDbContext _context;
    private readonly IGradeCalculationService _gradeEngine;
    private readonly INotificationService _notificationService;

    public StudentGradeService(
        AppDbContext context, 
        IGradeCalculationService gradeEngine, 
        INotificationService? notificationService = null)
    {
        _context = context;
        _gradeEngine = gradeEngine;
        _notificationService = notificationService ?? new NotificationService(context);
    }

    public async Task<StudentGradeResponse?> GetGradeByIdAsync(Guid id)
    {
        var grade = await BuildGradeQuery().FirstOrDefaultAsync(g => g.Id == id);
        return grade == null ? null : MapToGradeResponse(grade);
    }

    public async Task<StudentGradeResponse> UpsertGradeAsync(Guid teacherId, Guid assessmentId, GradeItemRequest request, bool publish = false)
    {
        var assessment = await _context.Assessments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(a => a.Id == assessmentId);

        if (assessment == null) throw new ValidationException("Assessment not found.");

        if (assessment.TeacherId != teacherId && assessment.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized for this assessment.");
            }
        }

        if (request.RawScore < 0 || request.RawScore > assessment.MaxScore)
        {
            throw new ValidationException($"RawScore must be between 0 and {assessment.MaxScore}.");
        }

        var student = await _context.Users.FindAsync(request.StudentId);
        if (student == null || student.Role != UserRole.Student)
        {
            throw new ValidationException("Student not found.");
        }

        // Calculate normalized final score (0 - 100) & letter grade
        decimal normalizedScore = assessment.MaxScore > 0 
            ? (request.RawScore / assessment.MaxScore) * 100.0m 
            : request.RawScore;

        var (letter, predicate) = await _gradeEngine.GetGradeScaleAsync(normalizedScore);

        var existing = await _context.StudentGrades
            .FirstOrDefaultAsync(g => g.AssessmentId == assessmentId && g.StudentId == request.StudentId);

        bool isUpdate = existing != null;
        DateTime now = DateTime.UtcNow;

        if (existing != null)
        {
            existing.RawScore = request.RawScore;
            existing.FinalScore = Math.Round(normalizedScore, 2);
            existing.LetterGrade = letter;
            existing.Predicate = predicate;
            existing.Remarks = request.Remarks?.Trim();
            existing.GradedBy = teacherId;
            existing.GradedAt = now;
            existing.UpdatedAt = now;

            if (publish && !existing.IsPublished)
            {
                existing.IsPublished = true;
                existing.PublishedAt = now;
            }
        }
        else
        {
            existing = new StudentGrade
            {
                Id = Guid.NewGuid(),
                AssessmentId = assessmentId,
                StudentId = request.StudentId,
                RawScore = request.RawScore,
                FinalScore = Math.Round(normalizedScore, 2),
                LetterGrade = letter,
                Predicate = predicate,
                Remarks = request.Remarks?.Trim(),
                GradedBy = teacherId,
                GradedAt = now,
                PublishedAt = publish ? now : null,
                IsPublished = publish,
                CreatedAt = now,
                UpdatedAt = now
            };
            _context.StudentGrades.Add(existing);
        }

        await _context.SaveChangesAsync();

        // Trigger Notification
        if (publish || existing.IsPublished)
        {
            var notifType = isUpdate ? NotificationType.GradeUpdated : NotificationType.GradePublished;
            var notifTitle = isUpdate ? $"Nilai Diperbarui: {assessment.Title}" : $"Nilai Dipublikasikan: {assessment.Title}";
            var notifBody = $"Nilai Anda untuk '{assessment.Title}' adalah {request.RawScore}/{assessment.MaxScore} ({letter} - {predicate}).";

            await _notificationService.NotifyUserAsync(
                request.StudentId,
                notifTitle,
                notifBody,
                notifType,
                NotificationPriority.High,
                existing.Id.ToString(),
                NotificationReferenceType.StudentGrade,
                $"/student/grades",
                "award",
                "#10b981"
            );
        }

        return (await GetGradeByIdAsync(existing.Id))!;
    }

    public async Task<List<StudentGradeResponse>> BulkGradeAsync(Guid teacherId, BulkGradeRequest request)
    {
        var assessment = await _context.Assessments.FindAsync(request.AssessmentId);
        if (assessment == null) throw new ValidationException("Assessment not found.");

        var responses = new List<StudentGradeResponse>();
        foreach (var item in request.Items)
        {
            var res = await UpsertGradeAsync(teacherId, request.AssessmentId, item, request.PublishImmediately);
            responses.Add(res);
        }

        return responses;
    }

    public async Task<bool> PublishGradesAsync(Guid teacherId, Guid assessmentId, List<Guid>? studentIds = null)
    {
        var assessment = await _context.Assessments
            .Include(a => a.ClassSubject)
                .ThenInclude(cs => cs.TeacherSubject)
            .FirstOrDefaultAsync(a => a.Id == assessmentId);

        if (assessment == null) return false;

        if (assessment.TeacherId != teacherId && assessment.ClassSubject.TeacherSubject.TeacherId != teacherId)
        {
            var user = await _context.Users.FindAsync(teacherId);
            if (user?.Role != UserRole.Admin)
            {
                throw new ValidationException("Teacher is not authorized for this assessment.");
            }
        }

        var query = _context.StudentGrades
            .Where(g => g.AssessmentId == assessmentId && !g.IsPublished);

        if (studentIds != null && studentIds.Any())
        {
            query = query.Where(g => studentIds.Contains(g.StudentId));
        }

        var unpubGrades = await query.ToListAsync();
        if (!unpubGrades.Any()) return true;

        DateTime now = DateTime.UtcNow;
        foreach (var g in unpubGrades)
        {
            g.IsPublished = true;
            g.PublishedAt = now;
            g.UpdatedAt = now;
        }

        await _context.SaveChangesAsync();

        // Trigger batch notification to students
        foreach (var g in unpubGrades)
        {
            await _notificationService.NotifyUserAsync(
                g.StudentId,
                $"Nilai Dipublikasikan: {assessment.Title}",
                $"Nilai Anda untuk '{assessment.Title}' adalah {g.RawScore}/{assessment.MaxScore} ({g.LetterGrade} - {g.Predicate}).",
                NotificationType.GradePublished,
                NotificationPriority.High,
                g.Id.ToString(),
                NotificationReferenceType.StudentGrade,
                $"/student/grades",
                "award",
                "#10b981"
            );
        }

        return true;
    }

    public async Task<TeacherGradebookViewResponse> GetTeacherGradebookAsync(Guid teacherId, Guid classSubjectId)
    {
        var cs = await _context.ClassSubjects
            .AsNoTracking()
            .Include(c => c.Class)
            .Include(c => c.TeacherSubject)
                .ThenInclude(ts => ts.Subject)
            .FirstOrDefaultAsync(c => c.Id == classSubjectId);

        if (cs == null) throw new ValidationException("ClassSubject not found.");

        var assessments = await _context.Assessments
            .AsNoTracking()
            .Include(a => a.GradeCategory)
            .Include(a => a.StudentGrades)
            .Where(a => a.ClassSubjectId == classSubjectId)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();

        var categories = await _context.GradeCategories.AsNoTracking().Where(c => c.IsActive).ToListAsync();
        var scales = await _context.GradeScales.AsNoTracking().Where(s => s.IsActive).ToListAsync();

        var studentsInClass = await _context.Users
            .AsNoTracking()
            .Where(u => u.ClassId == cs.ClassId && u.Role == UserRole.Student && u.IsActive)
            .OrderBy(u => u.FullName)
            .ToListAsync();

        var allGrades = await _context.StudentGrades
            .AsNoTracking()
            .Include(g => g.GradedByUser)
            .Include(g => g.Student)
            .Where(g => assessments.Select(a => a.Id).Contains(g.AssessmentId))
            .ToListAsync();

        var assessmentResponses = assessments.Select(a => new AssessmentResponse
        {
            Id = a.Id,
            ClassSubjectId = a.ClassSubjectId,
            ClassName = cs.Class?.Name ?? string.Empty,
            SubjectName = cs.TeacherSubject?.Subject?.Name ?? string.Empty,
            SubjectCode = cs.TeacherSubject?.Subject?.Code ?? string.Empty,
            GradeCategoryId = a.GradeCategoryId,
            GradeCategoryName = a.GradeCategory?.Name ?? string.Empty,
            CategoryWeight = a.GradeCategory?.Weight ?? 0m,
            TeacherId = a.TeacherId,
            Title = a.Title,
            Description = a.Description,
            AssessmentType = a.AssessmentType,
            MaxScore = a.MaxScore,
            WeightOverride = a.WeightOverride,
            PublishAt = a.PublishAt,
            DueDate = a.DueDate,
            IsPublished = a.IsPublished,
            GradedCount = a.StudentGrades.Count,
            TotalStudentsCount = studentsInClass.Count,
            AverageScore = a.StudentGrades.Any() ? Math.Round(a.StudentGrades.Average(g => g.RawScore), 2) : 0m,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        }).ToList();

        var studentRows = new List<GradebookStudentRow>();

        foreach (var student in studentsInClass)
        {
            var studentGrades = allGrades.Where(g => g.StudentId == student.Id).ToList();
            var gradeDict = new Dictionary<Guid, StudentGradeResponse>();

            foreach (var g in studentGrades)
            {
                gradeDict[g.AssessmentId] = MapToGradeResponse(g);
            }

            // Calculate final subject score for this student using GradeCalculationEngine
            decimal finalScore = _gradeEngine.CalculateWeightedSubjectScore(studentGrades, assessments, categories);
            var (letter, predicate) = _gradeEngine.MatchGradeScale(finalScore, scales);
            bool isPassed = _gradeEngine.DeterminePassStatus(finalScore);

            studentRows.Add(new GradebookStudentRow
            {
                StudentId = student.Id,
                StudentName = student.FullName,
                StudentNis = student.NIS ?? string.Empty,
                AssessmentGrades = gradeDict,
                FinalSubjectScore = finalScore,
                FinalLetterGrade = letter,
                FinalPredicate = predicate,
                IsPassed = isPassed
            });
        }

        // Calculate class ranks
        studentRows = _gradeEngine.CalculateClassRankings(studentRows);

        decimal classAvg = studentRows.Any() ? Math.Round(studentRows.Average(r => r.FinalSubjectScore), 2) : 0m;
        decimal classHigh = studentRows.Any() ? studentRows.Max(r => r.FinalSubjectScore) : 0m;
        decimal classLow = studentRows.Any() ? studentRows.Min(r => r.FinalSubjectScore) : 0m;

        return new TeacherGradebookViewResponse
        {
            ClassSubjectId = classSubjectId,
            ClassName = cs.Class?.Name ?? string.Empty,
            SubjectName = cs.TeacherSubject?.Subject?.Name ?? string.Empty,
            Assessments = assessmentResponses,
            StudentRows = studentRows,
            ClassAverage = classAvg,
            ClassHighest = classHigh,
            ClassLowest = classLow,
            TotalStudents = studentsInClass.Count
        };
    }

    public async Task<List<StudentGradeResponse>> GetStudentGradesAsync(Guid studentId, Guid? classSubjectId = null)
    {
        var query = _context.StudentGrades
            .AsNoTracking()
            .Include(g => g.Assessment)
                .ThenInclude(a => a.ClassSubject)
            .Include(g => g.Student)
            .Include(g => g.GradedByUser)
            .Where(g => g.StudentId == studentId && g.IsPublished);

        if (classSubjectId.HasValue)
        {
            query = query.Where(g => g.Assessment.ClassSubjectId == classSubjectId.Value);
        }

        var list = await query.OrderByDescending(g => g.GradedAt).ToListAsync();
        return list.Select(MapToGradeResponse).ToList();
    }

    public async Task<StudentTranscriptResponse> GetStudentTranscriptAsync(Guid studentId)
    {
        var student = await _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        if (student == null) throw new ValidationException("Student not found.");

        var classId = student.ClassId;
        if (classId == null)
        {
            return new StudentTranscriptResponse
            {
                StudentId = studentId,
                StudentName = student.FullName,
                StudentNis = student.NIS ?? string.Empty,
                ClassName = "N/A"
            };
        }

        var classSubjects = await _context.ClassSubjects
            .AsNoTracking()
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Subject)
            .Include(cs => cs.TeacherSubject)
                .ThenInclude(ts => ts.Teacher)
            .Where(cs => cs.ClassId == classId)
            .ToListAsync();

        var categories = await _context.GradeCategories.AsNoTracking().Where(c => c.IsActive).ToListAsync();
        var scales = await _context.GradeScales.AsNoTracking().Where(s => s.IsActive).ToListAsync();

        var subjectSummaries = new List<SubjectGradeSummary>();

        foreach (var cs in classSubjects)
        {
            if (cs.TeacherSubject == null) continue;

            var teacherbook = await GetTeacherGradebookAsync(cs.TeacherSubject.TeacherId, cs.Id);
            var studentRow = teacherbook.StudentRows.FirstOrDefault(r => r.StudentId == studentId);

            if (studentRow != null)
            {
                subjectSummaries.Add(new SubjectGradeSummary
                {
                    ClassSubjectId = cs.Id,
                    SubjectCode = cs.TeacherSubject?.Subject?.Code ?? string.Empty,
                    SubjectName = cs.TeacherSubject?.Subject?.Name ?? string.Empty,
                    TeacherName = cs.TeacherSubject?.Teacher?.FullName ?? string.Empty,
                    FinalScore = studentRow.FinalSubjectScore,
                    LetterGrade = studentRow.FinalLetterGrade,
                    Predicate = studentRow.FinalPredicate,
                    RankInClass = studentRow.ClassRank,
                    IsPassed = studentRow.IsPassed,
                    Grades = studentRow.AssessmentGrades.Values.Where(g => g.IsPublished).ToList()
                });
            }
        }

        decimal overallAvg = subjectSummaries.Any() ? Math.Round(subjectSummaries.Average(s => s.FinalScore), 2) : 0m;
        decimal overallGpa = _gradeEngine.CalculateGpa(overallAvg);
        var (overallLetter, overallPred) = _gradeEngine.MatchGradeScale(overallAvg, scales);

        return new StudentTranscriptResponse
        {
            StudentId = studentId,
            StudentName = student.FullName,
            StudentNis = student.NIS ?? string.Empty,
            ClassName = student.Class?.Name ?? string.Empty,
            OverallGpa = overallGpa,
            OverallAverageScore = overallAvg,
            OverallLetterGrade = overallLetter,
            OverallPredicate = overallPred,
            TotalSubjects = subjectSummaries.Count,
            TotalPassedSubjects = subjectSummaries.Count(s => s.IsPassed),
            SubjectSummaries = subjectSummaries
        };
    }

    public async Task<(int ImportedCount, List<string> Errors)> ImportGradesCsvAsync(Guid teacherId, Guid assessmentId, string csvContent)
    {
        var assessment = await _context.Assessments.FindAsync(assessmentId);
        if (assessment == null) throw new ValidationException("Assessment not found.");

        var lines = csvContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length <= 1)
        {
            return (0, new List<string> { "CSV file is empty or missing data rows." });
        }

        int imported = 0;
        var errors = new List<string>();

        // Skip header line (e.g. NIS,Nama,RawScore,Remarks)
        for (int i = 1; i < lines.Length; i++)
        {
            var cols = lines[i].Split(',');
            if (cols.Length < 2) continue;

            string nis = cols[0].Trim().Trim('"');
            string scoreStr = (cols.Length > 2 ? cols[2] : cols[1]).Trim().Trim('"');
            string? remarks = cols.Length > 3 ? cols[3].Trim().Trim('"') : null;

            var student = await _context.Users.FirstOrDefaultAsync(u => u.NIS != null && u.NIS.Trim().ToLower() == nis.ToLower());
            if (student == null)
            {
                errors.Add($"Line {i + 1}: Student with NIS '{nis}' not found.");
                continue;
            }

            if (!decimal.TryParse(scoreStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal score))
            {
                errors.Add($"Line {i + 1}: Invalid score '{scoreStr}' for NIS '{nis}'.");
                continue;
            }

            try
            {
                await UpsertGradeAsync(teacherId, assessmentId, new GradeItemRequest
                {
                    StudentId = student.Id,
                    RawScore = score,
                    Remarks = remarks
                }, false);

                imported++;
            }
            catch (Exception ex)
            {
                errors.Add($"Line {i + 1}: {ex.Message}");
            }
        }

        return (imported, errors);
    }

    public async Task<string> ExportGradesCsvAsync(Guid teacherId, Guid assessmentId)
    {
        var assessment = await _context.Assessments
            .AsNoTracking()
            .Include(a => a.ClassSubject)
            .FirstOrDefaultAsync(a => a.Id == assessmentId);

        if (assessment == null) throw new ValidationException("Assessment not found.");

        var classId = assessment.ClassSubject?.ClassId;
        if (classId == null) return "NIS,Nama,RawScore,MaxScore,LetterGrade,Predicate,Remarks";

        var students = await _context.Users
            .AsNoTracking()
            .Where(u => u.ClassId == classId.Value && u.Role == UserRole.Student && u.IsActive)
            .OrderBy(u => u.FullName)
            .ToListAsync();

        var grades = await _context.StudentGrades
            .AsNoTracking()
            .Where(g => g.AssessmentId == assessmentId)
            .ToDictionaryAsync(g => g.StudentId);

        var sb = new StringBuilder();
        sb.AppendLine("NIS,Nama,RawScore,MaxScore,LetterGrade,Predicate,Remarks");

        foreach (var s in students)
        {
            grades.TryGetValue(s.Id, out var g);
            string scoreFormatted = g != null ? g.RawScore.ToString(System.Globalization.CultureInfo.InvariantCulture) : "0.0";
            string maxScoreFormatted = assessment.MaxScore.ToString(System.Globalization.CultureInfo.InvariantCulture);
            sb.AppendLine($"\"{s.NIS}\",\"{s.FullName}\",{scoreFormatted},{maxScoreFormatted},\"{g?.LetterGrade ?? "-"}\",\"{g?.Predicate ?? "-"}\",\"{g?.Remarks ?? ""}\"");
        }

        return sb.ToString();
    }

    private IQueryable<StudentGrade> BuildGradeQuery()
    {
        return _context.StudentGrades
            .AsNoTracking()
            .Include(g => g.Assessment)
            .Include(g => g.Student)
            .Include(g => g.GradedByUser);
    }

    private static StudentGradeResponse MapToGradeResponse(StudentGrade g)
    {
        return new StudentGradeResponse
        {
            Id = g.Id,
            AssessmentId = g.AssessmentId,
            AssessmentTitle = g.Assessment?.Title ?? string.Empty,
            MaxScore = g.Assessment?.MaxScore ?? 100.0m,
            StudentId = g.StudentId,
            StudentName = g.Student?.FullName ?? string.Empty,
            StudentNis = g.Student?.NIS ?? string.Empty,
            RawScore = g.RawScore,
            FinalScore = g.FinalScore,
            LetterGrade = g.LetterGrade,
            Predicate = g.Predicate,
            Remarks = g.Remarks,
            GradedBy = g.GradedBy,
            GradedByName = g.GradedByUser?.FullName ?? string.Empty,
            GradedAt = g.GradedAt,
            PublishedAt = g.PublishedAt,
            IsPublished = g.IsPublished
        };
    }
}
