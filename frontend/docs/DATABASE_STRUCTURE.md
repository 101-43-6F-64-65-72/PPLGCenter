-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.__EFMigrationsHistory (
  MigrationId character varying NOT NULL,
  ProductVersion character varying NOT NULL,
  CONSTRAINT __EFMigrationsHistory_pkey PRIMARY KEY (MigrationId)
);
CREATE TABLE public.Users (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  FullName character varying NOT NULL,
  Email character varying NOT NULL,
  PasswordHash character varying NOT NULL,
  Role integer NOT NULL,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  NIP character varying,
  NIS character varying,
  NISN character varying,
  PhoneNumber character varying,
  PhotoUrl character varying,
  Username character varying,
  Address character varying,
  BirthDate timestamp with time zone,
  ClassId uuid,
  Gender character varying,
  Position character varying,
  StudentNumber integer,
  CONSTRAINT Users_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Users_SchoolClasses_ClassId FOREIGN KEY (ClassId) REFERENCES public.SchoolClasses(Id)
);
CREATE TABLE public.Announcements (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying NOT NULL,
  Content text NOT NULL,
  Category character varying NOT NULL,
  CoverImageUrl character varying,
  IsPinned boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CreatedByUserId uuid NOT NULL,
  IsCommentsLocked boolean NOT NULL DEFAULT false,
  TargetClasses text,
  PublishStart timestamp with time zone,
  PublishEnd timestamp with time zone,
  CONSTRAINT Announcements_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Announcements_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Materials (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying NOT NULL,
  Description character varying,
  FileUrl character varying NOT NULL,
  Subject character varying NOT NULL,
  Grade character varying NOT NULL,
  UploadedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UploadedByUserId uuid NOT NULL,
  CONSTRAINT Materials_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Materials_Users_UploadedByUserId FOREIGN KEY (UploadedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Assignments (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying NOT NULL,
  Description character varying,
  Subject text NOT NULL,
  Grade text NOT NULL,
  DueDate timestamp with time zone NOT NULL,
  MaxScore double precision NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CreatedByUserId uuid NOT NULL,
  AllowLateSubmission boolean NOT NULL DEFAULT false,
  Attachment text,
  ClassSubjectId uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  CreatedBy uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  DeletedAt timestamp with time zone,
  IsDeleted boolean NOT NULL DEFAULT false,
  LatePenaltyPercent double precision NOT NULL DEFAULT 0.0,
  PublishAt timestamp with time zone NOT NULL DEFAULT now(),
  ScheduleId uuid,
  TeacherId uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  UpdatedBy uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  Version integer NOT NULL DEFAULT 0,
  CONSTRAINT Assignments_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Assignments_ClassSubjects_ClassSubjectId FOREIGN KEY (ClassSubjectId) REFERENCES public.ClassSubjects(Id),
  CONSTRAINT FK_Assignments_Schedules_ScheduleId FOREIGN KEY (ScheduleId) REFERENCES public.Schedules(Id),
  CONSTRAINT FK_Assignments_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Assignments_Users_TeacherId FOREIGN KEY (TeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Submissions (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  FileUrl character varying NOT NULL,
  Notes character varying,
  Score double precision,
  Feedback character varying,
  SubmittedAt timestamp with time zone NOT NULL DEFAULT now(),
  GradedAt timestamp with time zone,
  AssignmentId uuid NOT NULL,
  StudentId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  LatestVersion integer NOT NULL DEFAULT 0,
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT Submissions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Submissions_Users_StudentId FOREIGN KEY (StudentId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Submissions_Assignments_AssignmentId FOREIGN KEY (AssignmentId) REFERENCES public.Assignments(Id)
);
CREATE TABLE public.CalendarEvents (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying NOT NULL,
  Description character varying,
  StartDate timestamp with time zone NOT NULL,
  EndDate timestamp with time zone NOT NULL,
  Location character varying,
  Category character varying NOT NULL,
  IsAllDay boolean NOT NULL DEFAULT false,
  CreatedByUserId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CalendarEvents_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_CalendarEvents_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.AnnouncementComments (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Content character varying NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  AnnouncementId uuid NOT NULL,
  UserId uuid NOT NULL,
  DeletedAt timestamp with time zone,
  DeletedByUserId uuid,
  ParentCommentId uuid,
  UpdatedAt timestamp with time zone,
  UpdatedByUserId uuid,
  CONSTRAINT AnnouncementComments_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_AnnouncementComments_Announcements_AnnouncementId FOREIGN KEY (AnnouncementId) REFERENCES public.Announcements(Id),
  CONSTRAINT FK_AnnouncementComments_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_AnnouncementComments_AnnouncementComments_ParentCommentId FOREIGN KEY (ParentCommentId) REFERENCES public.AnnouncementComments(Id)
);
CREATE TABLE public.AnnouncementReactions (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Type character varying NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  AnnouncementId uuid NOT NULL,
  UserId uuid NOT NULL,
  CONSTRAINT AnnouncementReactions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_AnnouncementReactions_Announcements_AnnouncementId FOREIGN KEY (AnnouncementId) REFERENCES public.Announcements(Id),
  CONSTRAINT FK_AnnouncementReactions_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Notifications (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  UserId uuid NOT NULL,
  Title character varying NOT NULL,
  Body character varying NOT NULL,
  Type integer NOT NULL,
  ReferenceId character varying,
  ReferenceType character varying DEFAULT ''::character varying,
  IsRead boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  ActionUrl character varying,
  Color character varying,
  Icon character varying,
  IsDeleted boolean NOT NULL DEFAULT false,
  Metadata jsonb,
  Priority integer NOT NULL DEFAULT 1,
  ReadAt timestamp with time zone,
  UpdatedAt timestamp with time zone,
  CONSTRAINT Notifications_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Notifications_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Facilities (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Name character varying NOT NULL,
  Description character varying,
  Location character varying NOT NULL,
  Capacity integer NOT NULL,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  Category character varying,
  ImageUrl character varying,
  ManagerTeacherId uuid,
  CONSTRAINT Facilities_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Facilities_Users_ManagerTeacherId FOREIGN KEY (ManagerTeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.FacilityBookings (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  FacilityId uuid NOT NULL,
  BookedByUserId uuid NOT NULL,
  Purpose character varying NOT NULL,
  StartTime timestamp with time zone NOT NULL,
  EndTime timestamp with time zone NOT NULL,
  Status integer NOT NULL,
  RejectionReason character varying,
  ApprovedOrRejectedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT FacilityBookings_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_FacilityBookings_Facilities_FacilityId FOREIGN KEY (FacilityId) REFERENCES public.Facilities(Id),
  CONSTRAINT FK_FacilityBookings_Users_ApprovedOrRejectedByUserId FOREIGN KEY (ApprovedOrRejectedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_FacilityBookings_Users_BookedByUserId FOREIGN KEY (BookedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Proposals (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying NOT NULL,
  Description character varying NOT NULL,
  FileUrl character varying NOT NULL,
  Status integer NOT NULL,
  RejectionReason character varying,
  SubmittedByUserId uuid NOT NULL,
  ReviewedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  ReviewedAt timestamp with time zone,
  AdminComment text,
  AttachmentUrl text NOT NULL DEFAULT ''::text,
  Category text,
  StudentId uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  SubmittedAt timestamp with time zone NOT NULL DEFAULT now(),
  ExtracurricularId uuid,
  CONSTRAINT Proposals_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Proposals_Users_ReviewedByUserId FOREIGN KEY (ReviewedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Proposals_Users_SubmittedByUserId FOREIGN KEY (SubmittedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Proposals_Extracurriculars_ExtracurricularId FOREIGN KEY (ExtracurricularId) REFERENCES public.Extracurriculars(Id)
);
CREATE TABLE public.Extracurriculars (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Name character varying NOT NULL,
  Description character varying NOT NULL,
  ImageUrl character varying,
  Category character varying NOT NULL,
  MaxMembers integer NOT NULL,
  IsActive boolean NOT NULL DEFAULT true,
  ManagedByUserId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  AdvisorName character varying,
  AdvisorWhatsapp character varying,
  Location character varying,
  ScheduleDay character varying,
  ScheduleTime character varying,
  SupervisorTeacherId uuid,
  CONSTRAINT Extracurriculars_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Extracurriculars_Users_ManagedByUserId FOREIGN KEY (ManagedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Extracurriculars_Users_SupervisorTeacherId FOREIGN KEY (SupervisorTeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.ExtracurricularMembers (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ExtracurricularId uuid NOT NULL,
  StudentId uuid NOT NULL,
  JoinedAt timestamp with time zone NOT NULL DEFAULT now(),
  JoinDate timestamp with time zone NOT NULL DEFAULT now(),
  Position integer NOT NULL DEFAULT 0,
  Status character varying NOT NULL DEFAULT 'Active'::character varying,
  CONSTRAINT ExtracurricularMembers_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ExtracurricularMembers_Extracurriculars_ExtracurricularId FOREIGN KEY (ExtracurricularId) REFERENCES public.Extracurriculars(Id),
  CONSTRAINT FK_ExtracurricularMembers_Users_StudentId FOREIGN KEY (StudentId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Attendances (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  StudentId uuid NOT NULL,
  AttendanceDate timestamp with time zone NOT NULL,
  Status integer NOT NULL,
  Notes character varying,
  RecordedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  AttendanceSessionId uuid,
  CheckInTime timestamp with time zone,
  CONSTRAINT Attendances_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Attendances_Users_RecordedByUserId FOREIGN KEY (RecordedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Attendances_Users_StudentId FOREIGN KEY (StudentId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Attendances_AttendanceSessions_AttendanceSessionId FOREIGN KEY (AttendanceSessionId) REFERENCES public.AttendanceSessions(Id)
);
CREATE TABLE public.ExtracurricularAdvisors (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  TeacherId uuid NOT NULL,
  ExtracurricularId uuid NOT NULL,
  AssignedDate timestamp with time zone NOT NULL,
  CONSTRAINT ExtracurricularAdvisors_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ExtracurricularAdvisors_Extracurriculars_ExtracurricularId FOREIGN KEY (ExtracurricularId) REFERENCES public.Extracurriculars(Id),
  CONSTRAINT FK_ExtracurricularAdvisors_Users_TeacherId FOREIGN KEY (TeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.AcademicYears (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Name character varying NOT NULL,
  StartDate timestamp with time zone NOT NULL,
  EndDate timestamp with time zone NOT NULL,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT AcademicYears_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.Departments (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Code character varying NOT NULL,
  Name character varying NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT Departments_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.Semesters (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  AcademicYearId uuid NOT NULL,
  Name character varying NOT NULL,
  Order integer NOT NULL,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT Semesters_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Semesters_AcademicYears_AcademicYearId FOREIGN KEY (AcademicYearId) REFERENCES public.AcademicYears(Id)
);
CREATE TABLE public.SchoolClasses (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  DepartmentId uuid NOT NULL,
  AcademicYearId uuid NOT NULL,
  Name character varying NOT NULL,
  Grade character varying NOT NULL,
  Capacity integer NOT NULL DEFAULT 36,
  HomeroomTeacherId uuid,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT SchoolClasses_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_SchoolClasses_AcademicYears_AcademicYearId FOREIGN KEY (AcademicYearId) REFERENCES public.AcademicYears(Id),
  CONSTRAINT FK_SchoolClasses_Departments_DepartmentId FOREIGN KEY (DepartmentId) REFERENCES public.Departments(Id),
  CONSTRAINT FK_SchoolClasses_Users_HomeroomTeacherId FOREIGN KEY (HomeroomTeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.AcademicEvents (
  Id uuid NOT NULL,
  Title character varying NOT NULL,
  Description character varying,
  Type character varying NOT NULL,
  TargetType character varying NOT NULL,
  TargetClassId uuid,
  StartDate timestamp with time zone NOT NULL,
  EndDate timestamp with time zone NOT NULL,
  IsActive boolean NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT AcademicEvents_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_AcademicEvents_SchoolClasses_TargetClassId FOREIGN KEY (TargetClassId) REFERENCES public.SchoolClasses(Id)
);
CREATE TABLE public.Subjects (
  Id uuid NOT NULL,
  Code character varying NOT NULL,
  Name character varying NOT NULL,
  Description character varying,
  IsActive boolean NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT Subjects_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.TeacherSubjects (
  Id uuid NOT NULL,
  TeacherId uuid NOT NULL,
  SubjectId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT TeacherSubjects_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_TeacherSubjects_Subjects_SubjectId FOREIGN KEY (SubjectId) REFERENCES public.Subjects(Id),
  CONSTRAINT FK_TeacherSubjects_Users_TeacherId FOREIGN KEY (TeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.ClassSubjects (
  Id uuid NOT NULL,
  ClassId uuid NOT NULL,
  TeacherSubjectId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT ClassSubjects_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ClassSubjects_SchoolClasses_ClassId FOREIGN KEY (ClassId) REFERENCES public.SchoolClasses(Id),
  CONSTRAINT FK_ClassSubjects_TeacherSubjects_TeacherSubjectId FOREIGN KEY (TeacherSubjectId) REFERENCES public.TeacherSubjects(Id)
);
CREATE TABLE public.Schedules (
  Id uuid NOT NULL,
  ClassSubjectId uuid NOT NULL,
  SemesterId uuid NOT NULL,
  DayOfWeek integer NOT NULL,
  StartTime interval NOT NULL,
  EndTime interval NOT NULL,
  Room character varying NOT NULL,
  Color character varying,
  IsActive boolean NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT Schedules_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Schedules_ClassSubjects_ClassSubjectId FOREIGN KEY (ClassSubjectId) REFERENCES public.ClassSubjects(Id),
  CONSTRAINT FK_Schedules_Semesters_SemesterId FOREIGN KEY (SemesterId) REFERENCES public.Semesters(Id)
);
CREATE TABLE public.AttendanceSessions (
  Id uuid NOT NULL,
  ScheduleId uuid NOT NULL,
  ClassSubjectId uuid NOT NULL,
  TeacherId uuid NOT NULL,
  SemesterId uuid NOT NULL,
  SessionNumber integer NOT NULL,
  Date timestamp with time zone NOT NULL,
  OpenedAt timestamp with time zone,
  ClosedAt timestamp with time zone,
  Status character varying NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT AttendanceSessions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_AttendanceSessions_ClassSubjects_ClassSubjectId FOREIGN KEY (ClassSubjectId) REFERENCES public.ClassSubjects(Id),
  CONSTRAINT FK_AttendanceSessions_Schedules_ScheduleId FOREIGN KEY (ScheduleId) REFERENCES public.Schedules(Id),
  CONSTRAINT FK_AttendanceSessions_Semesters_SemesterId FOREIGN KEY (SemesterId) REFERENCES public.Semesters(Id),
  CONSTRAINT FK_AttendanceSessions_Users_TeacherId FOREIGN KEY (TeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.GradeCategories (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Name character varying NOT NULL,
  Description character varying,
  Weight numeric NOT NULL,
  Type integer NOT NULL,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT GradeCategories_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.GradeScales (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Minimum numeric NOT NULL,
  Maximum numeric NOT NULL,
  Letter character varying NOT NULL,
  Predicate character varying NOT NULL,
  Description character varying,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT GradeScales_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.LessonMaterials (
  Id uuid NOT NULL,
  ClassSubjectId uuid NOT NULL,
  Title character varying NOT NULL,
  Description character varying,
  FileUrl text,
  YoutubeUrl text,
  Order integer NOT NULL,
  Visibility character varying NOT NULL,
  IsDeleted boolean NOT NULL,
  DeletedAt timestamp with time zone,
  Version integer NOT NULL,
  CreatedBy uuid NOT NULL,
  UpdatedBy uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT LessonMaterials_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_LessonMaterials_ClassSubjects_ClassSubjectId FOREIGN KEY (ClassSubjectId) REFERENCES public.ClassSubjects(Id)
);
CREATE TABLE public.SubmissionRevisions (
  Id uuid NOT NULL,
  SubmissionId uuid NOT NULL,
  Version integer NOT NULL,
  SubmissionType character varying NOT NULL,
  TextAnswer text,
  FileUrl text,
  LinkUrl text,
  Comment character varying,
  CreatedAt timestamp with time zone NOT NULL,
  CONSTRAINT SubmissionRevisions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_SubmissionRevisions_Submissions_SubmissionId FOREIGN KEY (SubmissionId) REFERENCES public.Submissions(Id)
);
CREATE TABLE public.Assessments (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ClassSubjectId uuid NOT NULL,
  GradeCategoryId uuid NOT NULL,
  TeacherId uuid NOT NULL,
  AssignmentId uuid,
  Title character varying NOT NULL,
  Description character varying,
  AssessmentType integer NOT NULL,
  MaxScore numeric NOT NULL DEFAULT 100.0,
  WeightOverride numeric,
  PublishAt timestamp with time zone NOT NULL,
  DueDate timestamp with time zone NOT NULL,
  IsPublished boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT Assessments_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Assessments_Assignments_AssignmentId FOREIGN KEY (AssignmentId) REFERENCES public.Assignments(Id),
  CONSTRAINT FK_Assessments_ClassSubjects_ClassSubjectId FOREIGN KEY (ClassSubjectId) REFERENCES public.ClassSubjects(Id),
  CONSTRAINT FK_Assessments_GradeCategories_GradeCategoryId FOREIGN KEY (GradeCategoryId) REFERENCES public.GradeCategories(Id),
  CONSTRAINT FK_Assessments_Users_TeacherId FOREIGN KEY (TeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.StudentGrades (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  AssessmentId uuid NOT NULL,
  StudentId uuid NOT NULL,
  RawScore numeric NOT NULL,
  FinalScore numeric NOT NULL,
  LetterGrade character varying NOT NULL,
  Predicate character varying NOT NULL,
  Remarks character varying,
  GradedBy uuid NOT NULL,
  GradedAt timestamp with time zone NOT NULL,
  PublishedAt timestamp with time zone,
  IsPublished boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT StudentGrades_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_StudentGrades_Assessments_AssessmentId FOREIGN KEY (AssessmentId) REFERENCES public.Assessments(Id),
  CONSTRAINT FK_StudentGrades_Users_GradedBy FOREIGN KEY (GradedBy) REFERENCES public.Users(Id),
  CONSTRAINT FK_StudentGrades_Users_StudentId FOREIGN KEY (StudentId) REFERENCES public.Users(Id)
);
CREATE TABLE public.DiscussionThreads (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ClassSubjectId uuid NOT NULL,
  Title character varying NOT NULL,
  Body text NOT NULL,
  IsPinned boolean NOT NULL,
  IsLocked boolean NOT NULL,
  ReplyCount integer NOT NULL,
  LastReplyAt timestamp with time zone,
  CreatedByUserId uuid NOT NULL,
  UpdatedByUserId uuid,
  DeletedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  DeletedAt timestamp with time zone,
  RowVersion bytea NOT NULL,
  CONSTRAINT DiscussionThreads_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_DiscussionThreads_ClassSubjects_ClassSubjectId FOREIGN KEY (ClassSubjectId) REFERENCES public.ClassSubjects(Id),
  CONSTRAINT FK_DiscussionThreads_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.DiscussionReplies (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ThreadId uuid NOT NULL,
  ParentReplyId uuid,
  Body text NOT NULL,
  AttachmentUrl text,
  AttachmentFileName text,
  AttachmentContentType text,
  AttachmentFileSize bigint,
  StorageProvider text,
  CreatedByUserId uuid NOT NULL,
  UpdatedByUserId uuid,
  DeletedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  DeletedAt timestamp with time zone,
  RowVersion bytea NOT NULL,
  CONSTRAINT DiscussionReplies_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_DiscussionReplies_DiscussionReplies_ParentReplyId FOREIGN KEY (ParentReplyId) REFERENCES public.DiscussionReplies(Id),
  CONSTRAINT FK_DiscussionReplies_DiscussionThreads_ThreadId FOREIGN KEY (ThreadId) REFERENCES public.DiscussionThreads(Id),
  CONSTRAINT FK_DiscussionReplies_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Conversations (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying,
  Type integer NOT NULL,
  LastMessageId uuid,
  LastActivityAt timestamp with time zone NOT NULL,
  CreatedByUserId uuid NOT NULL,
  UpdatedByUserId uuid,
  DeletedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  DeletedAt timestamp with time zone,
  RowVersion bytea NOT NULL,
  CONSTRAINT Conversations_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Conversations_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Conversations_Messages_LastMessageId FOREIGN KEY (LastMessageId) REFERENCES public.Messages(Id)
);
CREATE TABLE public.ConversationMembers (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ConversationId uuid NOT NULL,
  UserId uuid NOT NULL,
  JoinedAt timestamp with time zone NOT NULL,
  LastReadAt timestamp with time zone,
  CreatedByUserId uuid NOT NULL,
  UpdatedByUserId uuid,
  DeletedByUserId uuid,
  CONSTRAINT ConversationMembers_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ConversationMembers_Conversations_ConversationId FOREIGN KEY (ConversationId) REFERENCES public.Conversations(Id),
  CONSTRAINT FK_ConversationMembers_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Messages (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ConversationId uuid NOT NULL,
  SenderId uuid NOT NULL,
  MessageType integer NOT NULL,
  Text text,
  ReadAt timestamp with time zone,
  EditedAt timestamp with time zone,
  CreatedByUserId uuid NOT NULL,
  UpdatedByUserId uuid,
  DeletedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL,
  DeletedAt timestamp with time zone,
  RowVersion bytea NOT NULL,
  CONSTRAINT Messages_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Messages_Conversations_ConversationId FOREIGN KEY (ConversationId) REFERENCES public.Conversations(Id),
  CONSTRAINT FK_Messages_Users_SenderId FOREIGN KEY (SenderId) REFERENCES public.Users(Id)
);
CREATE TABLE public.MessageAttachments (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  MessageId uuid NOT NULL,
  FileName character varying NOT NULL,
  ContentType character varying NOT NULL,
  FileSize bigint NOT NULL,
  StorageProvider text NOT NULL,
  Url character varying NOT NULL,
  CreatedAt timestamp with time zone NOT NULL,
  CONSTRAINT MessageAttachments_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_MessageAttachments_Messages_MessageId FOREIGN KEY (MessageId) REFERENCES public.Messages(Id)
);
CREATE TABLE public.PasswordResetRequests (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  UserId uuid NOT NULL,
  TokenHash character varying NOT NULL,
  ExpiresAt timestamp with time zone NOT NULL,
  IsUsed boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT PasswordResetRequests_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_PasswordResetRequests_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.BookManagers (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  BookCategory text,
  ManagerUserId uuid NOT NULL,
  AssignedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT BookManagers_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_BookManagers_Users_ManagerUserId FOREIGN KEY (ManagerUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Books (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Title character varying NOT NULL,
  Author character varying NOT NULL,
  ISBN text,
  Category text NOT NULL,
  TotalCopies integer NOT NULL DEFAULT 1,
  AvailableCopies integer NOT NULL DEFAULT 1 CHECK ("AvailableCopies" >= 0),
  CoverImageUrl text,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  FolderId uuid,
  LocationType text NOT NULL DEFAULT 'Offline'::text,
  LocationDetails text,
  Publisher text,
  PublicationYear integer,
  Synopsis text,
  CreatedByUserId uuid,
  CONSTRAINT Books_pkey PRIMARY KEY (Id),
  CONSTRAINT Books_FolderId_fkey FOREIGN KEY (FolderId) REFERENCES public.LibraryFolders(Id),
  CONSTRAINT Books_CreatedByUserId_fkey FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.ClassDivisions (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  SchoolClassId uuid NOT NULL,
  ParentDivisionId uuid,
  Name character varying NOT NULL,
  Description text,
  LeaderStudentId uuid,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ClassDivisions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ClassDivisions_ClassDivisions_ParentDivisionId FOREIGN KEY (ParentDivisionId) REFERENCES public.ClassDivisions(Id),
  CONSTRAINT FK_ClassDivisions_SchoolClasses_SchoolClassId FOREIGN KEY (SchoolClassId) REFERENCES public.SchoolClasses(Id),
  CONSTRAINT FK_ClassDivisions_Users_LeaderStudentId FOREIGN KEY (LeaderStudentId) REFERENCES public.Users(Id)
);
CREATE TABLE public.ClassLeadership (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  SchoolClassId uuid NOT NULL,
  HomeroomTeacherId uuid NOT NULL,
  ClassLeaderStudentId uuid NOT NULL,
  AcademicYearId uuid NOT NULL,
  AppointedByUserId uuid NOT NULL,
  AppointedAt timestamp with time zone NOT NULL DEFAULT now(),
  IsActive boolean NOT NULL DEFAULT true,
  EffectiveDate timestamp with time zone NOT NULL DEFAULT now(),
  EndDate timestamp with time zone,
  CONSTRAINT ClassLeadership_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ClassLeadership_AcademicYears_AcademicYearId FOREIGN KEY (AcademicYearId) REFERENCES public.AcademicYears(Id),
  CONSTRAINT FK_ClassLeadership_SchoolClasses_SchoolClassId FOREIGN KEY (SchoolClassId) REFERENCES public.SchoolClasses(Id),
  CONSTRAINT FK_ClassLeadership_Users_ClassLeaderStudentId FOREIGN KEY (ClassLeaderStudentId) REFERENCES public.Users(Id),
  CONSTRAINT FK_ClassLeadership_Users_HomeroomTeacherId FOREIGN KEY (HomeroomTeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.CommunityGroups (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Name text NOT NULL,
  Description text,
  AvatarUrl text,
  CreatedByUserId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CommunityGroups_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_CommunityGroups_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.FacilityManagers (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  FacilityId uuid NOT NULL,
  ManagerUserId uuid NOT NULL,
  AssignedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT FacilityManagers_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_FacilityManagers_Facilities_FacilityId FOREIGN KEY (FacilityId) REFERENCES public.Facilities(Id),
  CONSTRAINT FK_FacilityManagers_Users_ManagerUserId FOREIGN KEY (ManagerUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.ScheduleRotationConfigs (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  SchoolClassId uuid NOT NULL,
  AnchorStartDate timestamp with time zone NOT NULL,
  InitialCategory integer NOT NULL DEFAULT 0,
  CycleWeeks integer NOT NULL DEFAULT 2,
  IsActive boolean NOT NULL DEFAULT true,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ScheduleRotationConfigs_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_ScheduleRotationConfigs_SchoolClasses_SchoolClassId FOREIGN KEY (SchoolClassId) REFERENCES public.SchoolClasses(Id)
);
CREATE TABLE public.StudentProfiles (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  UserId uuid NOT NULL,
  Bio character varying,
  SkillsJson text,
  TechStackJson text,
  SocialLinksJson text,
  Visibility integer NOT NULL DEFAULT 0,
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT StudentProfiles_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_StudentProfiles_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.UserPermissions (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  UserId uuid NOT NULL,
  Capability text NOT NULL,
  GrantedAt timestamp with time zone NOT NULL DEFAULT now(),
  GrantedByUserId uuid NOT NULL,
  CONSTRAINT UserPermissions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_UserPermissions_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.BookBorrowRequests (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  BookId uuid NOT NULL,
  BorrowerStudentId uuid NOT NULL,
  BorrowDate timestamp with time zone NOT NULL,
  DueDate timestamp with time zone NOT NULL,
  ReturnDate timestamp with time zone,
  Status integer NOT NULL DEFAULT 0,
  RejectionReason text,
  ApprovedByUserId uuid,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  TargetTeacherId uuid,
  BorrowNotes text,
  CONSTRAINT BookBorrowRequests_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_BookBorrowRequests_Books_BookId FOREIGN KEY (BookId) REFERENCES public.Books(Id),
  CONSTRAINT FK_BookBorrowRequests_Users_ApprovedByUserId FOREIGN KEY (ApprovedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_BookBorrowRequests_Users_BorrowerStudentId FOREIGN KEY (BorrowerStudentId) REFERENCES public.Users(Id),
  CONSTRAINT BookBorrowRequests_TargetTeacherId_fkey FOREIGN KEY (TargetTeacherId) REFERENCES public.Users(Id)
);
CREATE TABLE public.CommunityGroupMembers (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  GroupId uuid NOT NULL,
  UserId uuid NOT NULL,
  Role integer NOT NULL DEFAULT 0,
  Status integer NOT NULL DEFAULT 0,
  JoinedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CommunityGroupMembers_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_CommunityGroupMembers_CommunityGroups_GroupId FOREIGN KEY (GroupId) REFERENCES public.CommunityGroups(Id),
  CONSTRAINT FK_CommunityGroupMembers_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.GroupMessages (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  GroupId uuid NOT NULL,
  SenderUserId uuid NOT NULL,
  EncryptedPayloadBase64 text NOT NULL,
  Nonce text NOT NULL,
  SentAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT GroupMessages_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_GroupMessages_CommunityGroups_GroupId FOREIGN KEY (GroupId) REFERENCES public.CommunityGroups(Id),
  CONSTRAINT FK_GroupMessages_Users_SenderUserId FOREIGN KEY (SenderUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.StudentProjects (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  StudentProfileId uuid NOT NULL,
  Title character varying NOT NULL,
  Description character varying NOT NULL,
  TechStackJson text,
  GithubUrl text,
  DemoUrl text,
  ImageUrl text,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT StudentProjects_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_StudentProjects_StudentProfiles_StudentProfileId FOREIGN KEY (StudentProfileId) REFERENCES public.StudentProfiles(Id)
);
CREATE TABLE public.GroupMessageRecipientEnvelopes (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  MessageId uuid NOT NULL,
  RecipientUserId uuid NOT NULL,
  EncryptedKeyPackage text NOT NULL,
  CONSTRAINT GroupMessageRecipientEnvelopes_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_GroupMessageRecipientEnvelopes_GroupMessages_MessageId FOREIGN KEY (MessageId) REFERENCES public.GroupMessages(Id),
  CONSTRAINT FK_GroupMessageRecipientEnvelopes_Users_RecipientUserId FOREIGN KEY (RecipientUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.CctvCameras (
  Id uuid NOT NULL,
  Name text NOT NULL,
  Location text NOT NULL,
  Description text,
  IsEnabled boolean NOT NULL,
  Host text NOT NULL,
  Port integer NOT NULL,
  StreamPath text NOT NULL,
  EncryptedUsername text NOT NULL,
  EncryptedPassword text NOT NULL,
  EncryptionIV text NOT NULL,
  Status integer NOT NULL,
  LastSeenAt timestamp with time zone,
  CreatedAt timestamp with time zone NOT NULL,
  UpdatedAt timestamp with time zone NOT NULL,
  CONSTRAINT CctvCameras_pkey PRIMARY KEY (Id)
);
CREATE TABLE public.LibraryFolders (
  Id uuid NOT NULL,
  Name text NOT NULL,
  Description text,
  ParentFolderId uuid,
  VisibilityType text NOT NULL DEFAULT 'Public'::text,
  AllowedClassIdsJson text,
  CreatedByUserId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT LibraryFolders_pkey PRIMARY KEY (Id),
  CONSTRAINT LibraryFolders_ParentFolderId_fkey FOREIGN KEY (ParentFolderId) REFERENCES public.LibraryFolders(Id),
  CONSTRAINT LibraryFolders_CreatedByUserId_fkey FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);