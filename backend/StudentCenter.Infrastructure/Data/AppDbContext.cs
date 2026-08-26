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
    public DbSet<ShowcaseBanner> ShowcaseBanners => Set<ShowcaseBanner>();
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

    // Password Reset Approval System
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();

    // ── PPLG Center Domain Foundation (Phase 4A) ─────────────────────────────
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
    public DbSet<StudentProject> StudentProjects => Set<StudentProject>();
    public DbSet<ClassLeadership> ClassLeadership => Set<ClassLeadership>();
    public DbSet<ClassDivision> ClassDivisions => Set<ClassDivision>();
    public DbSet<ScheduleRotationConfig> ScheduleRotationConfigs => Set<ScheduleRotationConfig>();
    public DbSet<FacilityManager> FacilityManagers => Set<FacilityManager>();
    public DbSet<Book> Books => Set<Book>();
    public DbSet<BookManager> BookManagers => Set<BookManager>();
    public DbSet<BookBorrowRequest> BookBorrowRequests => Set<BookBorrowRequest>();
    public DbSet<LibraryFolder> LibraryFolders => Set<LibraryFolder>();
    public DbSet<CommunityGroup> CommunityGroups => Set<CommunityGroup>();
    public DbSet<CommunityGroupMember> CommunityGroupMembers => Set<CommunityGroupMember>();
    public DbSet<GroupMessage> GroupMessages => Set<GroupMessage>();
    public DbSet<GroupMessageRecipientEnvelope> GroupMessageRecipientEnvelopes => Set<GroupMessageRecipientEnvelope>();
    public DbSet<GroupMessageReaction> GroupMessageReactions => Set<GroupMessageReaction>();
    public DbSet<GroupMessageDeletedUser> GroupMessageDeletedUsers => Set<GroupMessageDeletedUser>();


    // CCTV Subsystem (Phase 22)
    public DbSet<CctvCamera> CctvCameras => Set<CctvCamera>();

    // Email Notification & Logs (Phase 23)
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<EmailVerificationOtp> EmailVerificationOtps => Set<EmailVerificationOtp>();

    // Feedback Subsystem
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
