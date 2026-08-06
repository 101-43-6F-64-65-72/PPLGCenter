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
  CONSTRAINT Users_pkey PRIMARY KEY (Id)
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
  Subject character varying NOT NULL,
  Grade character varying NOT NULL,
  DueDate timestamp with time zone NOT NULL,
  MaxScore integer NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CreatedByUserId uuid NOT NULL,
  CONSTRAINT Assignments_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Assignments_Users_CreatedByUserId FOREIGN KEY (CreatedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.Submissions (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  FileUrl character varying NOT NULL,
  Notes character varying,
  Score integer,
  Feedback character varying,
  SubmittedAt timestamp with time zone NOT NULL DEFAULT now(),
  GradedAt timestamp with time zone,
  AssignmentId uuid NOT NULL,
  StudentId uuid NOT NULL,
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
  CONSTRAINT AnnouncementComments_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_AnnouncementComments_Announcements_AnnouncementId FOREIGN KEY (AnnouncementId) REFERENCES public.Announcements(Id),
  CONSTRAINT FK_AnnouncementComments_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.AnnouncementReactions (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  Type character varying NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  AnnouncementId uuid NOT NULL,
  UserId uuid NOT NULL,
  CONSTRAINT AnnouncementReactions_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_AnnouncementReactions_Users_UserId FOREIGN KEY (UserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_AnnouncementReactions_Announcements_AnnouncementId FOREIGN KEY (AnnouncementId) REFERENCES public.Announcements(Id)
);
CREATE TABLE public.Notifications (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  UserId uuid NOT NULL,
  Title character varying NOT NULL,
  Message character varying NOT NULL,
  Type integer NOT NULL,
  ReferenceId character varying,
  ReferenceType character varying,
  IsRead boolean NOT NULL DEFAULT false,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
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
  CONSTRAINT Facilities_pkey PRIMARY KEY (Id)
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
  CONSTRAINT Proposals_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Proposals_Users_ReviewedByUserId FOREIGN KEY (ReviewedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Proposals_Users_SubmittedByUserId FOREIGN KEY (SubmittedByUserId) REFERENCES public.Users(Id)
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
  CONSTRAINT Extracurriculars_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Extracurriculars_Users_ManagedByUserId FOREIGN KEY (ManagedByUserId) REFERENCES public.Users(Id)
);
CREATE TABLE public.ExtracurricularMembers (
  Id uuid NOT NULL DEFAULT gen_random_uuid(),
  ExtracurricularId uuid NOT NULL,
  StudentId uuid NOT NULL,
  JoinedAt timestamp with time zone NOT NULL DEFAULT now(),
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
  RecordedByUserId uuid NOT NULL,
  CreatedAt timestamp with time zone NOT NULL DEFAULT now(),
  UpdatedAt timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT Attendances_pkey PRIMARY KEY (Id),
  CONSTRAINT FK_Attendances_Users_RecordedByUserId FOREIGN KEY (RecordedByUserId) REFERENCES public.Users(Id),
  CONSTRAINT FK_Attendances_Users_StudentId FOREIGN KEY (StudentId) REFERENCES public.Users(Id)
);