using Microsoft.EntityFrameworkCore;
using StudentCenter.Application.DTOs;
using StudentCenter.Application.Services;
using StudentCenter.Domain.Entities;
using StudentCenter.Domain.Enums;
using StudentCenter.Infrastructure.Data;

namespace StudentCenter.Infrastructure.Services;

public class DashboardAggregationService : IDashboardAggregationService
{
    private readonly AppDbContext _context;
    private readonly IScheduleService _scheduleService;
    private readonly ILessonMaterialService _materialService;
    private readonly IAssignmentService _assignmentService;
    private readonly IAcademicEventService _academicEventService;

    public DashboardAggregationService(
        AppDbContext context,
        IScheduleService scheduleService,
        ILessonMaterialService materialService,
        IAssignmentService assignmentService,
        IAcademicEventService academicEventService)
    {
        _context = context;
        _scheduleService = scheduleService;
        _materialService = materialService;
        _assignmentService = assignmentService;
        _academicEventService = academicEventService;
    }

    public async Task<AdminDashboardResponse> GetAdminDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;

        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
        var totalStudents = await _context.Users.CountAsync(u => u.Role == UserRole.Student);
        var totalTeachers = await _context.Users.CountAsync(u => u.Role == UserRole.Teacher);

        var totalClasses = await _context.SchoolClasses.CountAsync();
        var totalDepartments = await _context.Departments.CountAsync();
        var totalSubjects = await _context.Subjects.CountAsync();
        var totalSchedules = await _context.Schedules.CountAsync(s => s.IsActive);
        var totalEvents = await _context.AcademicEvents.CountAsync(e => e.IsActive);

        var totalMaterials = await _context.LessonMaterials.CountAsync(m => !m.IsDeleted);
        var totalAssignments = await _context.Assignments.CountAsync(a => !a.IsDeleted);
        var totalSubmissions = await _context.Submissions.CountAsync();
        var totalAssessments = await _context.Assessments.CountAsync();

        var allStudentGrades = await _context.StudentGrades.AsNoTracking().Where(g => g.IsPublished).ToListAsync();
        decimal schoolAvg = allStudentGrades.Any() ? Math.Round(allStudentGrades.Average(g => g.FinalScore), 2) : 0m;

        int passedGrades = allStudentGrades.Count(g => g.FinalScore >= 60.0m);
        double passRate = allStudentGrades.Any() ? Math.Round((double)passedGrades / allStudentGrades.Count * 100.0, 1) : 100.0;

        var classScores = await _context.StudentGrades
            .AsNoTracking()
            .Where(g => g.IsPublished)
            .Include(g => g.Assessment)
                .ThenInclude(a => a.ClassSubject)
                    .ThenInclude(cs => cs.Class)
            .GroupBy(g => g.Assessment.ClassSubject.Class.Name)
            .Select(group => new { ClassName = group.Key, Avg = group.Average(g => g.FinalScore) })
            .ToListAsync();

        string topClass = classScores.Any() ? classScores.OrderByDescending(c => c.Avg).First().ClassName : "N/A";
        string lowestClass = classScores.Any() ? classScores.OrderBy(c => c.Avg).First().ClassName : "N/A";

        var todayAttendanceCount = await _context.Attendances
            .CountAsync(a => a.AttendanceDate == today && a.Status == AttendanceStatus.Present);

        var announcementsEntities = await _context.Announcements
            .AsNoTracking()
            .Include(a => a.CreatedByUser)
            .OrderByDescending(a => a.CreatedAt)
            .Take(5)
            .ToListAsync();

        var announcements = announcementsEntities.Select(a => new AnnouncementResponse
        {
            Id = a.Id,
            Title = a.Title,
            Content = a.Content,
            Category = a.Category,
            IsPinned = a.IsPinned,
            CreatedAt = a.CreatedAt
        }).ToList();

        var totalDiscussionCount = await _context.DiscussionThreads.CountAsync(t => t.DeletedAt == null);
        var totalChatCount = await _context.Conversations.CountAsync(c => c.DeletedAt == null);
        var activeUsersTodayCount = await _context.Messages.Where(m => m.CreatedAt >= today).Select(m => m.SenderId).Distinct().CountAsync();

        var totalFacilitiesCount = await _context.Facilities.CountAsync(f => f.IsActive && !f.IsDeleted);
        var totalExtracurricularsCount = await _context.Extracurriculars.CountAsync(e => e.IsActive);
        var totalProposalsCount = await _context.Proposals.CountAsync();
        var pendingProposalsCount = await _context.Proposals.CountAsync(p => p.Status == ProposalStatus.Pending);

        return new AdminDashboardResponse
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            TotalClasses = totalClasses,
            TotalDepartments = totalDepartments,
            TotalSubjects = totalSubjects,
            TotalSchedules = totalSchedules,
            TotalAcademicEvents = totalEvents,
            TotalMaterials = totalMaterials,
            TotalAssignments = totalAssignments,
            TotalSubmissions = totalSubmissions,
            TotalAssessments = totalAssessments,
            SchoolAverageScore = schoolAvg,
            PassRatePercentage = passRate,
            TopPerformingClassName = topClass,
            LowestPerformingClassName = lowestClass,
            TodayAttendanceCount = todayAttendanceCount,
            TotalDiscussionCount = totalDiscussionCount,
            TotalChatCount = totalChatCount,
            ActiveUsersTodayCount = activeUsersTodayCount,
            TotalFacilitiesCount = totalFacilitiesCount,
            TotalExtracurricularsCount = totalExtracurricularsCount,
            TotalProposalsCount = totalProposalsCount,
            PendingProposalsCount = pendingProposalsCount,
            LatestAnnouncements = announcements
        };
    }

    public async Task<TeacherDashboardResponse> GetTeacherDashboardAsync(Guid teacherId)
    {
        var teacher = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == teacherId);

        var assignedClassesCount = await _context.ClassSubjects
            .Where(cs => cs.TeacherSubject.TeacherId == teacherId)
            .Select(cs => cs.ClassId)
            .Distinct()
            .CountAsync();

        var assignedSubjectsCount = await _context.TeacherSubjects
            .Where(ts => ts.TeacherId == teacherId)
            .CountAsync();

        var todaySchedules = await _scheduleService.GetTodaySchedulesForTeacherAsync(teacherId);

        var today = DateTime.UtcNow.Date;
        var todayScheduleIds = todaySchedules.Select(s => s.Id).ToList();

        var openedSessionScheduleIds = await _context.AttendanceSessions
            .Where(s => s.Date == today && todayScheduleIds.Contains(s.ScheduleId))
            .Select(s => s.ScheduleId)
            .ToListAsync();

        var unopenedSessions = todaySchedules.Where(s => !openedSessionScheduleIds.Contains(s.Id)).ToList();

        var pendingGradingAssignments = await _assignmentService.GetTeacherAssignmentsAsync(teacherId);
        var pendingGradingCount = pendingGradingAssignments.Sum(a => a.SubmissionCount - a.GradedCount);

        var teacherAssessments = await _context.Assessments
            .AsNoTracking()
            .Where(a => a.TeacherId == teacherId || a.ClassSubject.TeacherSubject.TeacherId == teacherId)
            .Include(a => a.StudentGrades)
            .ToListAsync();

        int ungradedAssessmentsCount = teacherAssessments.Count(a => !a.StudentGrades.Any());

        var teacherGrades = teacherAssessments.SelectMany(a => a.StudentGrades).ToList();
        decimal classAvg = teacherGrades.Any() ? Math.Round(teacherGrades.Average(g => g.FinalScore), 2) : 0m;
        decimal classHigh = teacherGrades.Any() ? teacherGrades.Max(g => g.RawScore) : 0m;
        decimal classLow = teacherGrades.Any() ? teacherGrades.Min(g => g.RawScore) : 0m;

        var recentMaterials = await _materialService.GetTeacherMaterialsAsync(teacherId);

        var unreadQuestions = await _context.DiscussionThreads
            .CountAsync(t => t.DeletedAt == null && t.ClassSubject.TeacherSubject.TeacherId == teacherId && t.ReplyCount == 0);
        var latestDiscussions = await _context.DiscussionThreads
            .CountAsync(t => t.DeletedAt == null && t.ClassSubject.TeacherSubject.TeacherId == teacherId);
        var pendingReplies = await _context.DiscussionThreads
            .CountAsync(t => t.DeletedAt == null && t.ClassSubject.TeacherSubject.TeacherId == teacherId && t.LastReplyAt != null);

        // ── Advising / Supervision data ────────────────────────────────────────
        // Collect all supervised ekskul IDs (SupervisorTeacherId + ExtracurricularAdvisors)
        var supervisedIds = await _context.Extracurriculars
            .AsNoTracking()
            .Where(e => e.SupervisorTeacherId == teacherId && e.IsActive)
            .Select(e => e.Id)
            .ToListAsync();

        var advisorIds = await _context.ExtracurricularAdvisors
            .AsNoTracking()
            .Where(a => a.TeacherId == teacherId && a.Extracurricular.IsActive)
            .Select(a => a.ExtracurricularId)
            .ToListAsync();

        var allSupervisedIds = supervisedIds.Concat(advisorIds).Distinct().ToList();
        var allSupervisedEkskuls = allSupervisedIds.Any()
            ? await _context.Extracurriculars.AsNoTracking().Where(e => allSupervisedIds.Contains(e.Id)).ToListAsync()
            : new List<Domain.Entities.Extracurricular>();

        var allSupervisedNames = allSupervisedEkskuls.Select(e => e.Name.ToLower()).ToList();

        // Pending proposals scoped to supervised ekskul names
        var pendingProposalsCount = allSupervisedNames.Any()
            ? await _context.Proposals.CountAsync(p =>
                p.Status == ProposalStatus.Pending &&
                p.Category != null &&
                allSupervisedNames.Any(name => p.Category.ToLower() == name || p.Category.ToLower().Contains(name)))
            : 0;

        // Member count scoped to supervised (via SupervisorTeacherId only — no ManagedByUserId confusion)
        var extracurricularMembersCount = allSupervisedIds.Any()
            ? await _context.ExtracurricularMembers.CountAsync(m =>
                allSupervisedIds.Contains(m.ExtracurricularId) && m.Status != "Removed")
            : 0;

        // CompletedVerificationCount = proposals reviewed by this teacher (proxy for approval history)
        var completedVerificationCount = await _context.Proposals
            .CountAsync(p => p.ReviewedByUserId == teacherId && p.Status != ProposalStatus.Pending);

        // Build per-ekskul summaries for AdvisingExtracurriculars
        List<SupervisedExtracurricularSummary> advisingList = new();
        if (allSupervisedEkskuls.Any())
        {
            var memberCounts = await _context.ExtracurricularMembers
                .AsNoTracking()
                .Where(m => allSupervisedIds.Contains(m.ExtracurricularId) && m.Status != "Removed")
                .GroupBy(m => m.ExtracurricularId)
                .Select(g => new { ExtracurricularId = g.Key, Count = g.Count() })
                .ToListAsync();
            var memberCountDict = memberCounts.ToDictionary(x => x.ExtracurricularId, x => x.Count);

            var pendingProposalsRaw = await _context.Proposals.AsNoTracking()
                .Where(p => p.Status == ProposalStatus.Pending && p.Category != null)
                .Select(p => new { p.Id, Category = p.Category!.ToLower() })
                .ToListAsync();

            var reviewedRaw = await _context.Proposals.AsNoTracking()
                .Where(p => p.ReviewedByUserId == teacherId && p.Category != null)
                .Select(p => new { p.Id, Category = p.Category!.ToLower() })
                .ToListAsync();

            advisingList = allSupervisedEkskuls.Select(e =>
            {
                var nameLow = e.Name.ToLower();
                return new SupervisedExtracurricularSummary
                {
                    Id = e.Id,
                    Name = e.Name,
                    Description = e.Description,
                    ImageUrl = e.ImageUrl,
                    Category = e.Category,
                    IsActive = e.IsActive,
                    ScheduleDay = e.ScheduleDay,
                    ScheduleTime = e.ScheduleTime,
                    Location = e.Location,
                    MemberCount = memberCountDict.TryGetValue(e.Id, out var mc) ? mc : 0,
                    PendingProposalsCount = pendingProposalsRaw.Count(p => p.Category == nameLow || p.Category.Contains(nameLow)),
                    CompletedReviewCount = reviewedRaw.Count(p => p.Category == nameLow || p.Category.Contains(nameLow))
                };
            }).OrderBy(e => e.Name).ToList();
        }

        return new TeacherDashboardResponse
        {
            TeacherId = teacherId,
            TeacherName = teacher?.FullName ?? string.Empty,
            AssignedClassesCount = assignedClassesCount,
            AssignedSubjectsCount = assignedSubjectsCount,
            UnopenedAttendanceSessionsCount = unopenedSessions.Count,
            AssignmentsNeedGradingCount = pendingGradingCount,
            UngradedAssessmentsCount = ungradedAssessmentsCount,
            ClassAverageScore = classAvg,
            HighestScore = classHigh,
            LowestScore = classLow,
            RecentMaterialsCount = recentMaterials.Count,
            UnreadStudentQuestionsCount = unreadQuestions,
            LatestDiscussionsCount = latestDiscussions,
            PendingRepliesCount = pendingReplies,
            PendingProposalsCount = pendingProposalsCount,
            ExtracurricularMembersCount = extracurricularMembersCount,
            AdvisingExtracurricularCount = allSupervisedIds.Count,
            CompletedVerificationCount = completedVerificationCount,
            AdvisingExtracurriculars = advisingList,
            TodayTeachingSchedule = todaySchedules,
            PendingGradingAssignments = pendingGradingAssignments.Where(a => a.SubmissionCount > a.GradedCount).Take(5).ToList()
        };
    }


    public async Task<StudentDashboardResponse> GetStudentDashboardAsync(Guid studentId)
    {
        var student = await _context.Users
            .AsNoTracking()
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == studentId);

        var todaySchedules = await _scheduleService.GetTodaySchedulesForStudentAsync(studentId);

        var today = DateTime.UtcNow.Date;
        var rawAttendances = await _context.Attendances
            .AsNoTracking()
            .Where(a => a.StudentId == studentId && a.AttendanceDate == today)
            .ToListAsync();

        var studentName = student?.FullName ?? string.Empty;
        var studentNis = student?.NIS ?? string.Empty;

        var todayAttendances = rawAttendances.Select(a => new AttendanceRecordResponse
        {
            Id = a.Id,
            AttendanceSessionId = a.AttendanceSessionId ?? Guid.Empty,
            StudentId = a.StudentId,
            StudentName = studentName,
            StudentNis = studentNis,
            Status = a.Status.ToString(),
            CheckInTime = a.CheckInTime,
            Notes = a.Notes
        }).ToList();

        var totalPresent = await _context.Attendances
            .CountAsync(a => a.StudentId == studentId && (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late));

        var totalAbsentOrAlpha = await _context.Attendances
            .CountAsync(a => a.StudentId == studentId && (a.Status == AttendanceStatus.Alpha || a.Status == AttendanceStatus.Absent));

        var totalAttendanceRecords = await _context.Attendances
            .CountAsync(a => a.StudentId == studentId && a.Status != AttendanceStatus.NotMarked);

        var attendancePercentage = totalAttendanceRecords > 0
            ? Math.Round((double)totalPresent / totalAttendanceRecords * 100.0, 1)
            : 100.0;

        var studentGrades = await _context.StudentGrades
            .AsNoTracking()
            .Where(g => g.StudentId == studentId && g.IsPublished)
            .ToListAsync();

        decimal gradeAvg = studentGrades.Any() ? Math.Round(studentGrades.Average(g => g.FinalScore), 2) : 0m;
        decimal currentGpa = gradeAvg >= 90m ? 4.0m : (gradeAvg >= 80m ? 3.5m : (gradeAvg >= 70m ? 3.0m : (gradeAvg >= 60m ? 2.0m : 1.0m)));

        var materials = await _materialService.GetStudentMaterialsAsync(studentId);
        var assignments = await _assignmentService.GetStudentAssignmentsAsync(studentId);
        var upcomingEvents = await _academicEventService.GetUpcomingEventsAsync(5);

        int recentDiscussionsCount = student?.ClassId != null
            ? await _context.DiscussionThreads.CountAsync(t => t.DeletedAt == null && t.ClassSubject.ClassId == student.ClassId)
            : 0;

        int unreadChatCount = await _context.ConversationMembers
            .AsNoTracking()
            .Where(cm => cm.UserId == studentId && cm.Conversation.DeletedAt == null)
            .SelectMany(cm => _context.Messages.Where(m => m.ConversationId == cm.ConversationId && m.SenderId != studentId && m.DeletedAt == null && (cm.LastReadAt == null || m.CreatedAt > cm.LastReadAt.Value)))
            .CountAsync();

        var latestProposal = await _context.Proposals
            .AsNoTracking()
            .Where(p => p.SubmittedByUserId == studentId)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        int myExtracurricularsCount = await _context.ExtracurricularMembers
            .CountAsync(m => m.StudentId == studentId && m.Status != "Removed");

        var todayDayName = DateTime.UtcNow.ToString("dddd");
        var todayEksculEntities = await _context.ExtracurricularMembers
            .AsNoTracking()
            .Where(m => m.StudentId == studentId && m.Status != "Removed")
            .Select(m => m.Extracurricular)
            .Where(e => e.IsActive && e.ScheduleDay != null && e.ScheduleDay.ToLower().Contains(todayDayName.ToLower()))
            .ToListAsync();

        var todayEksculList = todayEksculEntities.Select(e => new ExtracurricularResponse
        {
            Id = e.Id,
            Name = e.Name,
            Description = e.Description,
            ImageUrl = e.ImageUrl,
            Category = e.Category,
            MaxMembers = e.MaxMembers,
            ScheduleDay = e.ScheduleDay,
            ScheduleTime = e.ScheduleTime,
            Location = e.Location,
            AdvisorName = e.AdvisorName,
            AdvisorWhatsapp = e.AdvisorWhatsapp,
            IsActive = e.IsActive,
            ManagedByUserId = e.ManagedByUserId,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt
        }).ToList();

        return new StudentDashboardResponse
        {
            StudentId = studentId,
            StudentName = studentName,
            ClassName = student?.Class?.Name,
            AttendancePercentage = attendancePercentage,
            TotalPresent = totalPresent,
            TotalAbsentOrAlpha = totalAbsentOrAlpha,
            CurrentGpa = currentGpa,
            GradeAverageScore = gradeAvg,
            CompletedAssessmentsCount = studentGrades.Count,
            RecentDiscussionsCount = recentDiscussionsCount,
            UnreadChatCount = unreadChatCount,
            LatestProposalStatus = latestProposal?.Status.ToString(),
            MyExtracurricularsCount = myExtracurricularsCount,
            TodayExtracurricularSchedule = todayEksculList,
            TodaySchedule = todaySchedules,
            TodayAttendance = todayAttendances,
            LatestMaterials = materials.Take(5).ToList(),
            AssignmentsNearDeadline = assignments.Where(a => a.DueDate >= DateTime.UtcNow).OrderBy(a => a.DueDate).Take(5).ToList(),
            UpcomingAcademicEvents = upcomingEvents
        };
    }
}
