using Microsoft.EntityFrameworkCore;
using StudentCenter.Domain.Entities;

namespace StudentCenter.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Core identity
    public DbSet<User> Users => Set<User>();

    // Academic structure (Phase 13)
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<SchoolClass> SchoolClasses => Set<SchoolClass>();

    // School Operation Foundation (Phase 16)
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherSubject> TeacherSubjects => Set<TeacherSubject>();
    public DbSet<ClassSubject> ClassSubjects => Set<ClassSubject>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<AcademicEvent> AcademicEvents => Set<AcademicEvent>();

    // Content & activity
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<AnnouncementComment> AnnouncementComments => Set<AnnouncementComment>();
    public DbSet<AnnouncementReaction> AnnouncementReactions => Set<AnnouncementReaction>();
    public DbSet<Material> Materials => Set<Material>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<Notification> Notifications => Set<Notification>();

    // Facility
    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<FacilityBooking> FacilityBookings => Set<FacilityBooking>();

    // Proposal
    public DbSet<Proposal> Proposals => Set<Proposal>();

    // Extracurricular
    public DbSet<Extracurricular> Extracurriculars => Set<Extracurricular>();
    public DbSet<ExtracurricularMember> ExtracurricularMembers => Set<ExtracurricularMember>();
    public DbSet<ExtracurricularAdvisor> ExtracurricularAdvisors => Set<ExtracurricularAdvisor>();

    // Attendance & LMS Foundation (Phase 17)
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LessonMaterial> LessonMaterials => Set<LessonMaterial>();
    public DbSet<SubmissionRevision> SubmissionRevisions => Set<SubmissionRevision>();

    // Assessment & Gradebook Foundation (Phase 18)
    public DbSet<GradeCategory> GradeCategories => Set<GradeCategory>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<StudentGrade> StudentGrades => Set<StudentGrade>();
    public DbSet<GradeScale> GradeScales => Set<GradeScale>();

    // Communication & Discussion Foundation (Phase 19)
    public DbSet<DiscussionThread> DiscussionThreads => Set<DiscussionThread>();
    public DbSet<DiscussionReply> DiscussionReplies => Set<DiscussionReply>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationMember> ConversationMembers => Set<ConversationMember>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageAttachment> MessageAttachments => Set<MessageAttachment>();

    // Phase 22 OSIS Election
    public DbSet<Election> Elections => Set<Election>();
    public DbSet<ElectionCandidate> ElectionCandidates => Set<ElectionCandidate>();
    public DbSet<Vote> Votes => Set<Vote>();

    // Phase 6 Dedicated Pemilos Pair & OSIS Recruitment
    public DbSet<CandidatePair> CandidatePairs => Set<CandidatePair>();
    public DbSet<CandidatePairVote> CandidatePairVotes => Set<CandidatePairVote>();
    public DbSet<OsisPosition> OsisPositions => Set<OsisPosition>();
    public DbSet<OsisApplication> OsisApplications => Set<OsisApplication>();
    public DbSet<OsisCabinetHistory> OsisCabinetHistories => Set<OsisCabinetHistory>();

    // Password Reset Approval System
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
