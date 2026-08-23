CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Users" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "FullName" character varying(200) NOT NULL,
    "Email" character varying(256) NOT NULL,
    "PasswordHash" character varying(500) NOT NULL,
    "Role" integer NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT TRUE,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260727054409_InitialCreate', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Announcements" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Title" character varying(200) NOT NULL,
    "Content" text NOT NULL,
    "Category" character varying(100) NOT NULL,
    "CoverImageUrl" character varying(500),
    "IsPinned" boolean NOT NULL DEFAULT FALSE,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "CreatedByUserId" uuid NOT NULL,
    CONSTRAINT "PK_Announcements" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Announcements_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Announcements_Category" ON "Announcements" ("Category");

CREATE INDEX "IX_Announcements_CreatedAt" ON "Announcements" ("CreatedAt");

CREATE INDEX "IX_Announcements_CreatedByUserId" ON "Announcements" ("CreatedByUserId");

CREATE INDEX "IX_Announcements_IsPinned" ON "Announcements" ("IsPinned");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260727072656_AddAnnouncementEntity', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Materials" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Title" character varying(200) NOT NULL,
    "Description" character varying(1000),
    "FileUrl" character varying(500) NOT NULL,
    "Subject" character varying(100) NOT NULL,
    "Grade" character varying(50) NOT NULL,
    "UploadedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UploadedByUserId" uuid NOT NULL,
    CONSTRAINT "PK_Materials" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Materials_Users_UploadedByUserId" FOREIGN KEY ("UploadedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Materials_Grade" ON "Materials" ("Grade");

CREATE INDEX "IX_Materials_Subject" ON "Materials" ("Subject");

CREATE INDEX "IX_Materials_UploadedAt" ON "Materials" ("UploadedAt");

CREATE INDEX "IX_Materials_UploadedByUserId" ON "Materials" ("UploadedByUserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729012414_AddMaterialEntity', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Assignments" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Title" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "Subject" character varying(100) NOT NULL,
    "Grade" character varying(50) NOT NULL,
    "DueDate" timestamp with time zone NOT NULL,
    "MaxScore" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "CreatedByUserId" uuid NOT NULL,
    CONSTRAINT "PK_Assignments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Assignments_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Submissions" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "FileUrl" character varying(500) NOT NULL,
    "Notes" character varying(1000),
    "Score" integer,
    "Feedback" character varying(2000),
    "SubmittedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "GradedAt" timestamp with time zone,
    "AssignmentId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    CONSTRAINT "PK_Submissions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Submissions_Assignments_AssignmentId" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Submissions_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Assignments_CreatedByUserId" ON "Assignments" ("CreatedByUserId");

CREATE INDEX "IX_Assignments_DueDate" ON "Assignments" ("DueDate");

CREATE INDEX "IX_Assignments_Grade" ON "Assignments" ("Grade");

CREATE INDEX "IX_Assignments_Subject" ON "Assignments" ("Subject");

CREATE INDEX "IX_Submissions_AssignmentId" ON "Submissions" ("AssignmentId");

CREATE UNIQUE INDEX "IX_Submissions_AssignmentId_StudentId" ON "Submissions" ("AssignmentId", "StudentId");

CREATE INDEX "IX_Submissions_StudentId" ON "Submissions" ("StudentId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729021106_AddAssignmentAndSubmissionEntities', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "CalendarEvents" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Title" character varying(200) NOT NULL,
    "Description" character varying(2000),
    "StartDate" timestamp with time zone NOT NULL,
    "EndDate" timestamp with time zone NOT NULL,
    "Location" character varying(200),
    "Category" character varying(100) NOT NULL,
    "IsAllDay" boolean NOT NULL DEFAULT FALSE,
    "CreatedByUserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_CalendarEvents" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_CalendarEvents_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_CalendarEvents_Category" ON "CalendarEvents" ("Category");

CREATE INDEX "IX_CalendarEvents_CreatedByUserId" ON "CalendarEvents" ("CreatedByUserId");

CREATE INDEX "IX_CalendarEvents_EndDate" ON "CalendarEvents" ("EndDate");

CREATE INDEX "IX_CalendarEvents_StartDate" ON "CalendarEvents" ("StartDate");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729025637_AddCalendarEventEntity', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "AnnouncementComments" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Content" character varying(1000) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "AnnouncementId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    CONSTRAINT "PK_AnnouncementComments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AnnouncementComments_Announcements_AnnouncementId" FOREIGN KEY ("AnnouncementId") REFERENCES "Announcements" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_AnnouncementComments_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AnnouncementReactions" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Type" character varying(50) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "AnnouncementId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    CONSTRAINT "PK_AnnouncementReactions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AnnouncementReactions_Announcements_AnnouncementId" FOREIGN KEY ("AnnouncementId") REFERENCES "Announcements" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_AnnouncementReactions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_AnnouncementComments_AnnouncementId" ON "AnnouncementComments" ("AnnouncementId");

CREATE INDEX "IX_AnnouncementComments_CreatedAt" ON "AnnouncementComments" ("CreatedAt");

CREATE INDEX "IX_AnnouncementComments_UserId" ON "AnnouncementComments" ("UserId");

CREATE INDEX "IX_AnnouncementReactions_AnnouncementId" ON "AnnouncementReactions" ("AnnouncementId");

CREATE UNIQUE INDEX "IX_AnnouncementReactions_AnnouncementId_UserId" ON "AnnouncementReactions" ("AnnouncementId", "UserId");

CREATE INDEX "IX_AnnouncementReactions_UserId" ON "AnnouncementReactions" ("UserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729064020_AddAnnouncementInteractionEntities', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Notifications" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "UserId" uuid NOT NULL,
    "Title" character varying(200) NOT NULL,
    "Message" character varying(1000) NOT NULL,
    "Type" integer NOT NULL,
    "ReferenceId" character varying(100),
    "ReferenceType" character varying(100),
    "IsRead" boolean NOT NULL DEFAULT FALSE,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Notifications_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");

CREATE INDEX "IX_Notifications_IsRead" ON "Notifications" ("IsRead");

CREATE INDEX "IX_Notifications_Type" ON "Notifications" ("Type");

CREATE INDEX "IX_Notifications_UserId" ON "Notifications" ("UserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729105633_AddNotificationEntity', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Facilities" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Name" character varying(100) NOT NULL,
    "Description" character varying(1000),
    "Location" character varying(200) NOT NULL,
    "Capacity" integer NOT NULL,
    "ImageUrl" character varying(500),
    "Model3DUrl" character varying(500),
    "Category" character varying(100),
    "IsActive" boolean NOT NULL DEFAULT TRUE,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_Facilities" PRIMARY KEY ("Id")
);

CREATE TABLE "FacilityBookings" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "FacilityId" uuid NOT NULL,
    "BookedByUserId" uuid NOT NULL,
    "Purpose" character varying(500) NOT NULL,
    "StartTime" timestamp with time zone NOT NULL,
    "EndTime" timestamp with time zone NOT NULL,
    "Status" integer NOT NULL,
    "RejectionReason" character varying(500),
    "ApprovedOrRejectedByUserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_FacilityBookings" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_FacilityBookings_Facilities_FacilityId" FOREIGN KEY ("FacilityId") REFERENCES "Facilities" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_FacilityBookings_Users_ApprovedOrRejectedByUserId" FOREIGN KEY ("ApprovedOrRejectedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_FacilityBookings_Users_BookedByUserId" FOREIGN KEY ("BookedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Facilities_IsActive" ON "Facilities" ("IsActive");

CREATE INDEX "IX_Facilities_Name" ON "Facilities" ("Name");

CREATE INDEX "IX_FacilityBookings_ApprovedOrRejectedByUserId" ON "FacilityBookings" ("ApprovedOrRejectedByUserId");

CREATE INDEX "IX_FacilityBookings_BookedByUserId" ON "FacilityBookings" ("BookedByUserId");

CREATE INDEX "IX_FacilityBookings_EndTime" ON "FacilityBookings" ("EndTime");

CREATE INDEX "IX_FacilityBookings_FacilityId" ON "FacilityBookings" ("FacilityId");

CREATE INDEX "IX_FacilityBookings_StartTime" ON "FacilityBookings" ("StartTime");

CREATE INDEX "IX_FacilityBookings_Status" ON "FacilityBookings" ("Status");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260729183958_AddFacilityBookingEntities', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Proposals" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Title" character varying(300) NOT NULL,
    "Description" character varying(2000) NOT NULL,
    "FileUrl" character varying(500) NOT NULL,
    "Status" integer NOT NULL,
    "RejectionReason" character varying(1000),
    "SubmittedByUserId" uuid NOT NULL,
    "ReviewedByUserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "ReviewedAt" timestamp with time zone,
    CONSTRAINT "PK_Proposals" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Proposals_Users_ReviewedByUserId" FOREIGN KEY ("ReviewedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Proposals_Users_SubmittedByUserId" FOREIGN KEY ("SubmittedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Proposals_CreatedAt" ON "Proposals" ("CreatedAt");

CREATE INDEX "IX_Proposals_ReviewedByUserId" ON "Proposals" ("ReviewedByUserId");

CREATE INDEX "IX_Proposals_Status" ON "Proposals" ("Status");

CREATE INDEX "IX_Proposals_SubmittedByUserId" ON "Proposals" ("SubmittedByUserId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260730044227_AddProposalEntity', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Extracurriculars" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Name" character varying(200) NOT NULL,
    "Description" character varying(1000) NOT NULL,
    "ImageUrl" character varying(500),
    "Category" character varying(100) NOT NULL,
    "MaxMembers" integer NOT NULL,
    "IsActive" boolean NOT NULL DEFAULT TRUE,
    "ManagedByUserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_Extracurriculars" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Extracurriculars_Users_ManagedByUserId" FOREIGN KEY ("ManagedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "ExtracurricularMembers" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "ExtracurricularId" uuid NOT NULL,
    "StudentId" uuid NOT NULL,
    "JoinedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_ExtracurricularMembers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_ExtracurricularMembers_Extracurriculars_ExtracurricularId" FOREIGN KEY ("ExtracurricularId") REFERENCES "Extracurriculars" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ExtracurricularMembers_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_ExtracurricularMembers_ExtracurricularId" ON "ExtracurricularMembers" ("ExtracurricularId");

CREATE UNIQUE INDEX "IX_ExtracurricularMembers_ExtracurricularId_StudentId" ON "ExtracurricularMembers" ("ExtracurricularId", "StudentId");

CREATE INDEX "IX_ExtracurricularMembers_JoinedAt" ON "ExtracurricularMembers" ("JoinedAt");

CREATE INDEX "IX_ExtracurricularMembers_StudentId" ON "ExtracurricularMembers" ("StudentId");

CREATE INDEX "IX_Extracurriculars_Category" ON "Extracurriculars" ("Category");

CREATE INDEX "IX_Extracurriculars_CreatedAt" ON "Extracurriculars" ("CreatedAt");

CREATE INDEX "IX_Extracurriculars_IsActive" ON "Extracurriculars" ("IsActive");

CREATE INDEX "IX_Extracurriculars_ManagedByUserId" ON "Extracurriculars" ("ManagedByUserId");

CREATE INDEX "IX_Extracurriculars_Name" ON "Extracurriculars" ("Name");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260730055028_AddExtracurricularEntities', '10.0.10');

COMMIT;

START TRANSACTION;
CREATE TABLE "Attendances" (
    "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "StudentId" uuid NOT NULL,
    "AttendanceDate" timestamp with time zone NOT NULL,
    "Status" integer NOT NULL,
    "Notes" character varying(1000),
    "RecordedByUserId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
    CONSTRAINT "PK_Attendances" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Attendances_Users_RecordedByUserId" FOREIGN KEY ("RecordedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Attendances_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE INDEX "IX_Attendances_AttendanceDate" ON "Attendances" ("AttendanceDate");

CREATE INDEX "IX_Attendances_RecordedByUserId" ON "Attendances" ("RecordedByUserId");

CREATE INDEX "IX_Attendances_Status" ON "Attendances" ("Status");

CREATE INDEX "IX_Attendances_StudentId" ON "Attendances" ("StudentId");

CREATE UNIQUE INDEX "IX_Attendances_StudentId_AttendanceDate" ON "Attendances" ("StudentId", "AttendanceDate");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260730081029_AddAttendanceEntity', '10.0.10');

COMMIT;

START TRANSACTION;
ALTER TABLE "Submissions" DROP CONSTRAINT "FK_Submissions_Assignments_AssignmentId";

ALTER TABLE "Submissions" ADD CONSTRAINT "FK_Submissions_Assignments_AssignmentId" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments" ("Id") ON DELETE CASCADE;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260803150856_FixSubmissionCascade', '10.0.10');

COMMIT;

