namespace StudentCenter.Application.DTOs;

public class AdminDashboardResponse
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalClasses { get; set; }
    public int TotalDepartments { get; set; }
    public int TotalSubjects { get; set; }
    public int TotalSchedules { get; set; }
    public int TotalAcademicEvents { get; set; }
    public int TotalMaterials { get; set; }
    public int TotalAssignments { get; set; }
    public int TotalSubmissions { get; set; }
    public int TotalAssessments { get; set; }
    public decimal SchoolAverageScore { get; set; }
    public double PassRatePercentage { get; set; }
    public string TopPerformingClassName { get; set; } = string.Empty;
    public string LowestPerformingClassName { get; set; } = string.Empty;
    public int TodayAttendanceCount { get; set; }
    public int TotalDiscussionCount { get; set; }
    public int TotalChatCount { get; set; }
    public int ActiveUsersTodayCount { get; set; }

    // Phase 20 Metrics
    public int TotalFacilitiesCount { get; set; }
    public int TotalExtracurricularsCount { get; set; }
    public int TotalProposalsCount { get; set; }
    public int PendingProposalsCount { get; set; }

    public List<AnnouncementResponse> LatestAnnouncements { get; set; } = new();
}

public class TeacherDashboardResponse
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public int AssignedClassesCount { get; set; }
    public int AssignedSubjectsCount { get; set; }
    public int UnopenedAttendanceSessionsCount { get; set; }
    public int AssignmentsNeedGradingCount { get; set; }
    public int UngradedAssessmentsCount { get; set; }
    public decimal ClassAverageScore { get; set; }
    public decimal HighestScore { get; set; }
    public decimal LowestScore { get; set; }
    public int RecentMaterialsCount { get; set; }
    public int UnreadStudentQuestionsCount { get; set; }
    public int LatestDiscussionsCount { get; set; }
    public int PendingRepliesCount { get; set; }

    // Advising / Supervision KPIs
    public int PendingProposalsCount { get; set; }
    public int ExtracurricularMembersCount { get; set; }
    public int AdvisingExtracurricularCount { get; set; }
    /// <summary>
    /// Proposals reviewed (approved/rejected/revised) by this teacher.
    /// Proxy for "Total Verifikasi Selesai" using ReviewedByUserId.
    /// Not a full audit log — documents actual approval history per teacher.
    /// </summary>
    public int CompletedVerificationCount { get; set; }

    /// <summary>
    /// Full list of supervised extracurriculars with live stats.
    /// Source of truth for "Binaan Saya" section — always fetched fresh from DB.
    /// </summary>
    public List<SupervisedExtracurricularSummary> AdvisingExtracurriculars { get; set; } = new();

    public List<ScheduleResponse> TodayTeachingSchedule { get; set; } = new();
    public List<AttendanceSessionResponse> TodayUnopenedSessions { get; set; } = new();
    public List<AssignmentResponse> PendingGradingAssignments { get; set; } = new();
}

public class StudentDashboardResponse
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public double AttendancePercentage { get; set; }
    public int TotalPresent { get; set; }
    public int TotalAbsentOrAlpha { get; set; }
    public decimal CurrentGpa { get; set; }
    public decimal GradeAverageScore { get; set; }
    public int CompletedAssessmentsCount { get; set; }
    public int RecentDiscussionsCount { get; set; }
    public int UnreadChatCount { get; set; }

    // Phase 20 Metrics
    public string? LatestProposalStatus { get; set; }
    public int MyExtracurricularsCount { get; set; }
    public List<ExtracurricularResponse> TodayExtracurricularSchedule { get; set; } = new();

    public List<ScheduleResponse> TodaySchedule { get; set; } = new();
    public List<AttendanceRecordResponse> TodayAttendance { get; set; } = new();
    public List<LessonMaterialResponse> LatestMaterials { get; set; } = new();
    public List<AssignmentResponse> AssignmentsNearDeadline { get; set; } = new();
    public List<AcademicEventResponse> UpcomingAcademicEvents { get; set; } = new();
}
