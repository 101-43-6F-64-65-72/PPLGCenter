CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727054409_InitialCreate') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727054409_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727054409_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260727054409_InitialCreate', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727072656_AddAnnouncementEntity') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727072656_AddAnnouncementEntity') THEN
    CREATE INDEX "IX_Announcements_Category" ON "Announcements" ("Category");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727072656_AddAnnouncementEntity') THEN
    CREATE INDEX "IX_Announcements_CreatedAt" ON "Announcements" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727072656_AddAnnouncementEntity') THEN
    CREATE INDEX "IX_Announcements_CreatedByUserId" ON "Announcements" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727072656_AddAnnouncementEntity') THEN
    CREATE INDEX "IX_Announcements_IsPinned" ON "Announcements" ("IsPinned");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260727072656_AddAnnouncementEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260727072656_AddAnnouncementEntity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729012414_AddMaterialEntity') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729012414_AddMaterialEntity') THEN
    CREATE INDEX "IX_Materials_Grade" ON "Materials" ("Grade");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729012414_AddMaterialEntity') THEN
    CREATE INDEX "IX_Materials_Subject" ON "Materials" ("Subject");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729012414_AddMaterialEntity') THEN
    CREATE INDEX "IX_Materials_UploadedAt" ON "Materials" ("UploadedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729012414_AddMaterialEntity') THEN
    CREATE INDEX "IX_Materials_UploadedByUserId" ON "Materials" ("UploadedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729012414_AddMaterialEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260729012414_AddMaterialEntity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE INDEX "IX_Assignments_CreatedByUserId" ON "Assignments" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE INDEX "IX_Assignments_DueDate" ON "Assignments" ("DueDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE INDEX "IX_Assignments_Grade" ON "Assignments" ("Grade");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE INDEX "IX_Assignments_Subject" ON "Assignments" ("Subject");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE INDEX "IX_Submissions_AssignmentId" ON "Submissions" ("AssignmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE UNIQUE INDEX "IX_Submissions_AssignmentId_StudentId" ON "Submissions" ("AssignmentId", "StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    CREATE INDEX "IX_Submissions_StudentId" ON "Submissions" ("StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729021106_AddAssignmentAndSubmissionEntities') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260729021106_AddAssignmentAndSubmissionEntities', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729025637_AddCalendarEventEntity') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729025637_AddCalendarEventEntity') THEN
    CREATE INDEX "IX_CalendarEvents_Category" ON "CalendarEvents" ("Category");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729025637_AddCalendarEventEntity') THEN
    CREATE INDEX "IX_CalendarEvents_CreatedByUserId" ON "CalendarEvents" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729025637_AddCalendarEventEntity') THEN
    CREATE INDEX "IX_CalendarEvents_EndDate" ON "CalendarEvents" ("EndDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729025637_AddCalendarEventEntity') THEN
    CREATE INDEX "IX_CalendarEvents_StartDate" ON "CalendarEvents" ("StartDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729025637_AddCalendarEventEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260729025637_AddCalendarEventEntity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    CREATE INDEX "IX_AnnouncementComments_AnnouncementId" ON "AnnouncementComments" ("AnnouncementId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    CREATE INDEX "IX_AnnouncementComments_CreatedAt" ON "AnnouncementComments" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    CREATE INDEX "IX_AnnouncementComments_UserId" ON "AnnouncementComments" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    CREATE INDEX "IX_AnnouncementReactions_AnnouncementId" ON "AnnouncementReactions" ("AnnouncementId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    CREATE UNIQUE INDEX "IX_AnnouncementReactions_AnnouncementId_UserId" ON "AnnouncementReactions" ("AnnouncementId", "UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    CREATE INDEX "IX_AnnouncementReactions_UserId" ON "AnnouncementReactions" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729064020_AddAnnouncementInteractionEntities') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260729064020_AddAnnouncementInteractionEntities', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729105633_AddNotificationEntity') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729105633_AddNotificationEntity') THEN
    CREATE INDEX "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729105633_AddNotificationEntity') THEN
    CREATE INDEX "IX_Notifications_IsRead" ON "Notifications" ("IsRead");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729105633_AddNotificationEntity') THEN
    CREATE INDEX "IX_Notifications_Type" ON "Notifications" ("Type");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729105633_AddNotificationEntity') THEN
    CREATE INDEX "IX_Notifications_UserId" ON "Notifications" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729105633_AddNotificationEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260729105633_AddNotificationEntity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE TABLE "Facilities" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "Name" character varying(100) NOT NULL,
        "Description" character varying(1000),
        "Location" character varying(200) NOT NULL,
        "Capacity" integer NOT NULL,
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_Facilities" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_Facilities_IsActive" ON "Facilities" ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_Facilities_Name" ON "Facilities" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_FacilityBookings_ApprovedOrRejectedByUserId" ON "FacilityBookings" ("ApprovedOrRejectedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_FacilityBookings_BookedByUserId" ON "FacilityBookings" ("BookedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_FacilityBookings_EndTime" ON "FacilityBookings" ("EndTime");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_FacilityBookings_FacilityId" ON "FacilityBookings" ("FacilityId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_FacilityBookings_StartTime" ON "FacilityBookings" ("StartTime");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    CREATE INDEX "IX_FacilityBookings_Status" ON "FacilityBookings" ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260729183958_AddFacilityBookingEntities') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260729183958_AddFacilityBookingEntities', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730044227_AddProposalEntity') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730044227_AddProposalEntity') THEN
    CREATE INDEX "IX_Proposals_CreatedAt" ON "Proposals" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730044227_AddProposalEntity') THEN
    CREATE INDEX "IX_Proposals_ReviewedByUserId" ON "Proposals" ("ReviewedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730044227_AddProposalEntity') THEN
    CREATE INDEX "IX_Proposals_Status" ON "Proposals" ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730044227_AddProposalEntity') THEN
    CREATE INDEX "IX_Proposals_SubmittedByUserId" ON "Proposals" ("SubmittedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730044227_AddProposalEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260730044227_AddProposalEntity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE TABLE "ExtracurricularMembers" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "ExtracurricularId" uuid NOT NULL,
        "StudentId" uuid NOT NULL,
        "JoinedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_ExtracurricularMembers" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ExtracurricularMembers_Extracurriculars_ExtracurricularId" FOREIGN KEY ("ExtracurricularId") REFERENCES "Extracurriculars" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ExtracurricularMembers_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_ExtracurricularMembers_ExtracurricularId" ON "ExtracurricularMembers" ("ExtracurricularId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE UNIQUE INDEX "IX_ExtracurricularMembers_ExtracurricularId_StudentId" ON "ExtracurricularMembers" ("ExtracurricularId", "StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_ExtracurricularMembers_JoinedAt" ON "ExtracurricularMembers" ("JoinedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_ExtracurricularMembers_StudentId" ON "ExtracurricularMembers" ("StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_Extracurriculars_Category" ON "Extracurriculars" ("Category");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_Extracurriculars_CreatedAt" ON "Extracurriculars" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_Extracurriculars_IsActive" ON "Extracurriculars" ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_Extracurriculars_ManagedByUserId" ON "Extracurriculars" ("ManagedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    CREATE INDEX "IX_Extracurriculars_Name" ON "Extracurriculars" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730055028_AddExtracurricularEntities') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260730055028_AddExtracurricularEntities', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
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
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
    CREATE INDEX "IX_Attendances_AttendanceDate" ON "Attendances" ("AttendanceDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
    CREATE INDEX "IX_Attendances_RecordedByUserId" ON "Attendances" ("RecordedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
    CREATE INDEX "IX_Attendances_Status" ON "Attendances" ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
    CREATE INDEX "IX_Attendances_StudentId" ON "Attendances" ("StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
    CREATE UNIQUE INDEX "IX_Attendances_StudentId_AttendanceDate" ON "Attendances" ("StudentId", "AttendanceDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260730081029_AddAttendanceEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260730081029_AddAttendanceEntity', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260803150856_FixSubmissionCascade') THEN
    ALTER TABLE "Submissions" DROP CONSTRAINT "FK_Submissions_Assignments_AssignmentId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260803150856_FixSubmissionCascade') THEN
    ALTER TABLE "Submissions" ADD CONSTRAINT "FK_Submissions_Assignments_AssignmentId" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260803150856_FixSubmissionCascade') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260803150856_FixSubmissionCascade', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Users" ADD "NIM" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Users" ADD "NIS" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Users" ADD "NISN" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Users" ADD "PhoneNumber" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Users" ADD "PhotoUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Users" ADD "Username" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Facilities" ADD "Category" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Facilities" ADD "ImageUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Extracurriculars" ADD "AdvisorName" character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Extracurriculars" ADD "AdvisorWhatsapp" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Extracurriculars" ADD "Location" character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Extracurriculars" ADD "ScheduleDay" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    ALTER TABLE "Extracurriculars" ADD "ScheduleTime" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    CREATE INDEX "IX_Users_NIM" ON "Users" ("NIM");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    CREATE INDEX "IX_Users_NIS" ON "Users" ("NIS");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    CREATE INDEX "IX_Users_NISN" ON "Users" ("NISN");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    CREATE UNIQUE INDEX "IX_Users_Username" ON "Users" ("Username") WHERE "Username" IS NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806101650_AddUserPhoneAndPhoto') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260806101650_AddUserPhoneAndPhoto', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    ALTER TABLE "Users" RENAME COLUMN "NIM" TO "NIP";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    ALTER INDEX "IX_Users_NIM" RENAME TO "IX_Users_NIP";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    ALTER TABLE "ExtracurricularMembers" ADD "JoinDate" timestamp with time zone NOT NULL DEFAULT (now());
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    ALTER TABLE "ExtracurricularMembers" ADD "Position" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    ALTER TABLE "ExtracurricularMembers" ADD "Status" character varying(50) NOT NULL DEFAULT 'Active';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    CREATE TABLE "ExtracurricularAdvisors" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "TeacherId" uuid NOT NULL,
        "ExtracurricularId" uuid NOT NULL,
        "AssignedDate" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ExtracurricularAdvisors" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ExtracurricularAdvisors_Extracurriculars_ExtracurricularId" FOREIGN KEY ("ExtracurricularId") REFERENCES "Extracurriculars" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ExtracurricularAdvisors_Users_TeacherId" FOREIGN KEY ("TeacherId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    CREATE INDEX "IX_ExtracurricularAdvisors_ExtracurricularId" ON "ExtracurricularAdvisors" ("ExtracurricularId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    CREATE UNIQUE INDEX "IX_ExtracurricularAdvisors_TeacherId_ExtracurricularId" ON "ExtracurricularAdvisors" ("TeacherId", "ExtracurricularId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806111854_ClientRequirementRefactor') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260806111854_ClientRequirementRefactor', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD "Address" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD "BirthDate" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD "ClassId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD "Gender" character varying(10);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD "Position" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD "StudentNumber" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE TABLE "AcademicYears" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "Name" character varying(20) NOT NULL,
        "StartDate" timestamp with time zone NOT NULL,
        "EndDate" timestamp with time zone NOT NULL,
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_AcademicYears" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE TABLE "Departments" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "Code" character varying(20) NOT NULL,
        "Name" character varying(200) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_Departments" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE TABLE "Semesters" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "AcademicYearId" uuid NOT NULL,
        "Name" character varying(20) NOT NULL,
        "Order" integer NOT NULL,
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_Semesters" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Semesters_AcademicYears_AcademicYearId" FOREIGN KEY ("AcademicYearId") REFERENCES "AcademicYears" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE TABLE "SchoolClasses" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "DepartmentId" uuid NOT NULL,
        "AcademicYearId" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Grade" character varying(10) NOT NULL,
        "Capacity" integer NOT NULL DEFAULT 36,
        "HomeroomTeacherId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_SchoolClasses" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_SchoolClasses_AcademicYears_AcademicYearId" FOREIGN KEY ("AcademicYearId") REFERENCES "AcademicYears" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_SchoolClasses_Departments_DepartmentId" FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_SchoolClasses_Users_HomeroomTeacherId" FOREIGN KEY ("HomeroomTeacherId") REFERENCES "Users" ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE INDEX "IX_Users_ClassId" ON "Users" ("ClassId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE UNIQUE INDEX "IX_AcademicYears_Name" ON "AcademicYears" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE UNIQUE INDEX "IX_Departments_Code" ON "Departments" ("Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE UNIQUE INDEX "IX_SchoolClasses_AcademicYearId_Name" ON "SchoolClasses" ("AcademicYearId", "Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE INDEX "IX_SchoolClasses_DepartmentId" ON "SchoolClasses" ("DepartmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE INDEX "IX_SchoolClasses_HomeroomTeacherId" ON "SchoolClasses" ("HomeroomTeacherId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    CREATE UNIQUE INDEX "IX_Semesters_AcademicYearId_Name" ON "Semesters" ("AcademicYearId", "Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    ALTER TABLE "Users" ADD CONSTRAINT "FK_Users_SchoolClasses_ClassId" FOREIGN KEY ("ClassId") REFERENCES "SchoolClasses" ("Id") ON DELETE SET NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806121120_MasterAcademicStructure') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260806121120_MasterAcademicStructure', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE TABLE "AcademicEvents" (
        "Id" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "Type" character varying(50) NOT NULL,
        "TargetType" character varying(50) NOT NULL,
        "TargetClassId" uuid,
        "StartDate" timestamp with time zone NOT NULL,
        "EndDate" timestamp with time zone NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_AcademicEvents" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_AcademicEvents_SchoolClasses_TargetClassId" FOREIGN KEY ("TargetClassId") REFERENCES "SchoolClasses" ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE TABLE "Subjects" (
        "Id" uuid NOT NULL,
        "Code" character varying(20) NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" character varying(500),
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Subjects" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE TABLE "TeacherSubjects" (
        "Id" uuid NOT NULL,
        "TeacherId" uuid NOT NULL,
        "SubjectId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_TeacherSubjects" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_TeacherSubjects_Subjects_SubjectId" FOREIGN KEY ("SubjectId") REFERENCES "Subjects" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_TeacherSubjects_Users_TeacherId" FOREIGN KEY ("TeacherId") REFERENCES "Users" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE TABLE "ClassSubjects" (
        "Id" uuid NOT NULL,
        "ClassId" uuid NOT NULL,
        "TeacherSubjectId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ClassSubjects" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ClassSubjects_SchoolClasses_ClassId" FOREIGN KEY ("ClassId") REFERENCES "SchoolClasses" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ClassSubjects_TeacherSubjects_TeacherSubjectId" FOREIGN KEY ("TeacherSubjectId") REFERENCES "TeacherSubjects" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE TABLE "Schedules" (
        "Id" uuid NOT NULL,
        "ClassSubjectId" uuid NOT NULL,
        "SemesterId" uuid NOT NULL,
        "DayOfWeek" integer NOT NULL,
        "StartTime" interval NOT NULL,
        "EndTime" interval NOT NULL,
        "Room" character varying(100) NOT NULL,
        "Color" character varying(20),
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Schedules" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Schedules_ClassSubjects_ClassSubjectId" FOREIGN KEY ("ClassSubjectId") REFERENCES "ClassSubjects" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_Schedules_Semesters_SemesterId" FOREIGN KEY ("SemesterId") REFERENCES "Semesters" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE INDEX "IX_AcademicEvents_TargetClassId" ON "AcademicEvents" ("TargetClassId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE UNIQUE INDEX "IX_ClassSubjects_ClassId_TeacherSubjectId" ON "ClassSubjects" ("ClassId", "TeacherSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE INDEX "IX_ClassSubjects_TeacherSubjectId" ON "ClassSubjects" ("TeacherSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE INDEX "IX_Schedules_ClassSubjectId" ON "Schedules" ("ClassSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE INDEX "IX_Schedules_SemesterId" ON "Schedules" ("SemesterId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE UNIQUE INDEX "IX_Subjects_Code" ON "Subjects" ("Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE INDEX "IX_TeacherSubjects_SubjectId" ON "TeacherSubjects" ("SubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    CREATE UNIQUE INDEX "IX_TeacherSubjects_TeacherId_SubjectId" ON "TeacherSubjects" ("TeacherId", "SubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260806130741_SchoolOperationFoundation') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260806130741_SchoolOperationFoundation', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" DROP CONSTRAINT "FK_Assignments_Users_CreatedByUserId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Submissions" DROP CONSTRAINT "FK_Submissions_Assignments_AssignmentId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    DROP INDEX "IX_Attendances_StudentId_AttendanceDate";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    DROP INDEX "IX_Assignments_Grade";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    DROP INDEX "IX_Assignments_Subject";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" RENAME COLUMN "Message" TO "Body";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Submissions" ALTER COLUMN "Score" TYPE double precision;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Submissions" ADD "CreatedAt" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Submissions" ADD "LatestVersion" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Submissions" ADD "UpdatedAt" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    UPDATE "Notifications" SET "ReferenceType" = '' WHERE "ReferenceType" IS NULL;
    ALTER TABLE "Notifications" ALTER COLUMN "ReferenceType" SET NOT NULL;
    ALTER TABLE "Notifications" ALTER COLUMN "ReferenceType" SET DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "ActionUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "Color" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "Icon" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "IsDeleted" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "Metadata" jsonb;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "Priority" integer NOT NULL DEFAULT 1;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "ReadAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Notifications" ADD "UpdatedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Attendances" ALTER COLUMN "UpdatedAt" DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Attendances" ALTER COLUMN "RecordedByUserId" DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Attendances" ALTER COLUMN "CreatedAt" DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Attendances" ADD "AttendanceSessionId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Attendances" ADD "CheckInTime" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ALTER COLUMN "UpdatedAt" DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ALTER COLUMN "Subject" TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ALTER COLUMN "MaxScore" TYPE double precision;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ALTER COLUMN "Grade" TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ALTER COLUMN "CreatedAt" DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "AllowLateSubmission" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "Attachment" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "ClassSubjectId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "CreatedBy" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "DeletedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "IsDeleted" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "LatePenaltyPercent" double precision NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "PublishAt" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "ScheduleId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "TeacherId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "UpdatedBy" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD "Version" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "AttendanceSessions" (
        "Id" uuid NOT NULL,
        "ScheduleId" uuid NOT NULL,
        "ClassSubjectId" uuid NOT NULL,
        "TeacherId" uuid NOT NULL,
        "SemesterId" uuid NOT NULL,
        "SessionNumber" integer NOT NULL,
        "Date" timestamp with time zone NOT NULL,
        "OpenedAt" timestamp with time zone,
        "ClosedAt" timestamp with time zone,
        "Status" character varying(20) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_AttendanceSessions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_AttendanceSessions_ClassSubjects_ClassSubjectId" FOREIGN KEY ("ClassSubjectId") REFERENCES "ClassSubjects" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_AttendanceSessions_Schedules_ScheduleId" FOREIGN KEY ("ScheduleId") REFERENCES "Schedules" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_AttendanceSessions_Semesters_SemesterId" FOREIGN KEY ("SemesterId") REFERENCES "Semesters" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_AttendanceSessions_Users_TeacherId" FOREIGN KEY ("TeacherId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "GradeCategories" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "Name" character varying(100) NOT NULL,
        "Description" character varying(500),
        "Weight" numeric(5,2) NOT NULL,
        "Type" integer NOT NULL,
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_GradeCategories" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "GradeScales" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "Minimum" numeric(5,2) NOT NULL,
        "Maximum" numeric(5,2) NOT NULL,
        "Letter" character varying(10) NOT NULL,
        "Predicate" character varying(100) NOT NULL,
        "Description" character varying(250),
        "IsActive" boolean NOT NULL DEFAULT TRUE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_GradeScales" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "LessonMaterials" (
        "Id" uuid NOT NULL,
        "ClassSubjectId" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "FileUrl" text,
        "YoutubeUrl" text,
        "Order" integer NOT NULL,
        "Visibility" character varying(20) NOT NULL,
        "IsDeleted" boolean NOT NULL,
        "DeletedAt" timestamp with time zone,
        "Version" integer NOT NULL,
        "CreatedBy" uuid NOT NULL,
        "UpdatedBy" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_LessonMaterials" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_LessonMaterials_ClassSubjects_ClassSubjectId" FOREIGN KEY ("ClassSubjectId") REFERENCES "ClassSubjects" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "SubmissionRevisions" (
        "Id" uuid NOT NULL,
        "SubmissionId" uuid NOT NULL,
        "Version" integer NOT NULL,
        "SubmissionType" character varying(20) NOT NULL,
        "TextAnswer" text,
        "FileUrl" text,
        "LinkUrl" text,
        "Comment" character varying(1000),
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_SubmissionRevisions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_SubmissionRevisions_Submissions_SubmissionId" FOREIGN KEY ("SubmissionId") REFERENCES "Submissions" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "Assessments" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "ClassSubjectId" uuid NOT NULL,
        "GradeCategoryId" uuid NOT NULL,
        "TeacherId" uuid NOT NULL,
        "AssignmentId" uuid,
        "Title" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "AssessmentType" integer NOT NULL,
        "MaxScore" numeric(5,2) NOT NULL DEFAULT 100.0,
        "WeightOverride" numeric(5,2),
        "PublishAt" timestamp with time zone NOT NULL,
        "DueDate" timestamp with time zone NOT NULL,
        "IsPublished" boolean NOT NULL DEFAULT FALSE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_Assessments" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Assessments_Assignments_AssignmentId" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments" ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_Assessments_ClassSubjects_ClassSubjectId" FOREIGN KEY ("ClassSubjectId") REFERENCES "ClassSubjects" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_Assessments_GradeCategories_GradeCategoryId" FOREIGN KEY ("GradeCategoryId") REFERENCES "GradeCategories" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_Assessments_Users_TeacherId" FOREIGN KEY ("TeacherId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE TABLE "StudentGrades" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "AssessmentId" uuid NOT NULL,
        "StudentId" uuid NOT NULL,
        "RawScore" numeric(5,2) NOT NULL,
        "FinalScore" numeric(5,2) NOT NULL,
        "LetterGrade" character varying(10) NOT NULL,
        "Predicate" character varying(100) NOT NULL,
        "Remarks" character varying(500),
        "GradedBy" uuid NOT NULL,
        "GradedAt" timestamp with time zone NOT NULL,
        "PublishedAt" timestamp with time zone,
        "IsPublished" boolean NOT NULL DEFAULT FALSE,
        "CreatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        "UpdatedAt" timestamp with time zone NOT NULL DEFAULT (now()),
        CONSTRAINT "PK_StudentGrades" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_StudentGrades_Assessments_AssessmentId" FOREIGN KEY ("AssessmentId") REFERENCES "Assessments" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_StudentGrades_Users_GradedBy" FOREIGN KEY ("GradedBy") REFERENCES "Users" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_StudentGrades_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Notifications_IsDeleted" ON "Notifications" ("IsDeleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Notifications_Priority" ON "Notifications" ("Priority");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE UNIQUE INDEX "IX_Attendances_AttendanceSessionId_StudentId" ON "Attendances" ("AttendanceSessionId", "StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assignments_ClassSubjectId" ON "Assignments" ("ClassSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assignments_ScheduleId" ON "Assignments" ("ScheduleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assignments_TeacherId" ON "Assignments" ("TeacherId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assessments_AssignmentId" ON "Assessments" ("AssignmentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assessments_ClassSubjectId" ON "Assessments" ("ClassSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assessments_GradeCategoryId" ON "Assessments" ("GradeCategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assessments_IsPublished" ON "Assessments" ("IsPublished");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_Assessments_TeacherId" ON "Assessments" ("TeacherId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_AttendanceSessions_ClassSubjectId" ON "AttendanceSessions" ("ClassSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE UNIQUE INDEX "IX_AttendanceSessions_ScheduleId_Date" ON "AttendanceSessions" ("ScheduleId", "Date");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_AttendanceSessions_SemesterId" ON "AttendanceSessions" ("SemesterId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_AttendanceSessions_TeacherId" ON "AttendanceSessions" ("TeacherId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE UNIQUE INDEX "IX_GradeCategories_Name" ON "GradeCategories" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_GradeScales_Letter" ON "GradeScales" ("Letter");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_LessonMaterials_ClassSubjectId" ON "LessonMaterials" ("ClassSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE UNIQUE INDEX "IX_StudentGrades_AssessmentId_StudentId" ON "StudentGrades" ("AssessmentId", "StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_StudentGrades_GradedBy" ON "StudentGrades" ("GradedBy");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_StudentGrades_IsPublished" ON "StudentGrades" ("IsPublished");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_StudentGrades_StudentId" ON "StudentGrades" ("StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    CREATE INDEX "IX_SubmissionRevisions_SubmissionId" ON "SubmissionRevisions" ("SubmissionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_ClassSubjects_ClassSubjectId" FOREIGN KEY ("ClassSubjectId") REFERENCES "ClassSubjects" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_Schedules_ScheduleId" FOREIGN KEY ("ScheduleId") REFERENCES "Schedules" ("Id") ON DELETE SET NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_Users_TeacherId" FOREIGN KEY ("TeacherId") REFERENCES "Users" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Attendances" ADD CONSTRAINT "FK_Attendances_AttendanceSessions_AttendanceSessionId" FOREIGN KEY ("AttendanceSessionId") REFERENCES "AttendanceSessions" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    ALTER TABLE "Submissions" ADD CONSTRAINT "FK_Submissions_Assignments_AssignmentId" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807013755_AddAssessmentGradebookFoundation') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260807013755_AddAssessmentGradebookFoundation', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "Announcements" ADD "IsCommentsLocked" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "AnnouncementComments" ADD "DeletedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "AnnouncementComments" ADD "DeletedByUserId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "AnnouncementComments" ADD "ParentCommentId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "AnnouncementComments" ADD "UpdatedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "AnnouncementComments" ADD "UpdatedByUserId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE TABLE "DiscussionThreads" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "ClassSubjectId" uuid NOT NULL,
        "Title" character varying(250) NOT NULL,
        "Body" text NOT NULL,
        "IsPinned" boolean NOT NULL,
        "IsLocked" boolean NOT NULL,
        "ReplyCount" integer NOT NULL,
        "LastReplyAt" timestamp with time zone,
        "CreatedByUserId" uuid NOT NULL,
        "UpdatedByUserId" uuid,
        "DeletedByUserId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "RowVersion" bytea NOT NULL,
        CONSTRAINT "PK_DiscussionThreads" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DiscussionThreads_ClassSubjects_ClassSubjectId" FOREIGN KEY ("ClassSubjectId") REFERENCES "ClassSubjects" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_DiscussionThreads_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE TABLE "DiscussionReplies" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "ThreadId" uuid NOT NULL,
        "ParentReplyId" uuid,
        "Body" text NOT NULL,
        "AttachmentUrl" text,
        "AttachmentFileName" text,
        "AttachmentContentType" text,
        "AttachmentFileSize" bigint,
        "StorageProvider" text,
        "CreatedByUserId" uuid NOT NULL,
        "UpdatedByUserId" uuid,
        "DeletedByUserId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "RowVersion" bytea NOT NULL,
        CONSTRAINT "PK_DiscussionReplies" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_DiscussionReplies_DiscussionReplies_ParentReplyId" FOREIGN KEY ("ParentReplyId") REFERENCES "DiscussionReplies" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_DiscussionReplies_DiscussionThreads_ThreadId" FOREIGN KEY ("ThreadId") REFERENCES "DiscussionThreads" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_DiscussionReplies_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE TABLE "ConversationMembers" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "ConversationId" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "JoinedAt" timestamp with time zone NOT NULL,
        "LastReadAt" timestamp with time zone,
        "CreatedByUserId" uuid NOT NULL,
        "UpdatedByUserId" uuid,
        "DeletedByUserId" uuid,
        CONSTRAINT "PK_ConversationMembers" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ConversationMembers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE TABLE "Conversations" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "Title" character varying(200),
        "Type" integer NOT NULL,
        "LastMessageId" uuid,
        "LastActivityAt" timestamp with time zone NOT NULL,
        "CreatedByUserId" uuid NOT NULL,
        "UpdatedByUserId" uuid,
        "DeletedByUserId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "RowVersion" bytea NOT NULL,
        CONSTRAINT "PK_Conversations" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Conversations_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE TABLE "Messages" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "ConversationId" uuid NOT NULL,
        "SenderId" uuid NOT NULL,
        "MessageType" integer NOT NULL,
        "Text" text,
        "ReadAt" timestamp with time zone,
        "EditedAt" timestamp with time zone,
        "CreatedByUserId" uuid NOT NULL,
        "UpdatedByUserId" uuid,
        "DeletedByUserId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        "RowVersion" bytea NOT NULL,
        CONSTRAINT "PK_Messages" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Messages_Conversations_ConversationId" FOREIGN KEY ("ConversationId") REFERENCES "Conversations" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_Messages_Users_SenderId" FOREIGN KEY ("SenderId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE TABLE "MessageAttachments" (
        "Id" uuid NOT NULL DEFAULT (gen_random_uuid()),
        "MessageId" uuid NOT NULL,
        "FileName" character varying(250) NOT NULL,
        "ContentType" character varying(100) NOT NULL,
        "FileSize" bigint NOT NULL,
        "StorageProvider" text NOT NULL,
        "Url" character varying(1000) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_MessageAttachments" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_MessageAttachments_Messages_MessageId" FOREIGN KEY ("MessageId") REFERENCES "Messages" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_AnnouncementComments_ParentCommentId" ON "AnnouncementComments" ("ParentCommentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE UNIQUE INDEX "IX_ConversationMembers_ConversationId_UserId" ON "ConversationMembers" ("ConversationId", "UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_ConversationMembers_UserId" ON "ConversationMembers" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_Conversations_CreatedByUserId" ON "Conversations" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_Conversations_LastActivityAt" ON "Conversations" ("LastActivityAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_Conversations_LastMessageId" ON "Conversations" ("LastMessageId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionReplies_CreatedAt" ON "DiscussionReplies" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionReplies_CreatedByUserId" ON "DiscussionReplies" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionReplies_ParentReplyId" ON "DiscussionReplies" ("ParentReplyId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionReplies_ThreadId" ON "DiscussionReplies" ("ThreadId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionThreads_ClassSubjectId" ON "DiscussionThreads" ("ClassSubjectId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionThreads_CreatedAt" ON "DiscussionThreads" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionThreads_CreatedByUserId" ON "DiscussionThreads" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_DiscussionThreads_IsPinned" ON "DiscussionThreads" ("IsPinned");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_MessageAttachments_MessageId" ON "MessageAttachments" ("MessageId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_Messages_ConversationId" ON "Messages" ("ConversationId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_Messages_CreatedAt" ON "Messages" ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    CREATE INDEX "IX_Messages_SenderId" ON "Messages" ("SenderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "AnnouncementComments" ADD CONSTRAINT "FK_AnnouncementComments_AnnouncementComments_ParentCommentId" FOREIGN KEY ("ParentCommentId") REFERENCES "AnnouncementComments" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "ConversationMembers" ADD CONSTRAINT "FK_ConversationMembers_Conversations_ConversationId" FOREIGN KEY ("ConversationId") REFERENCES "Conversations" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    ALTER TABLE "Conversations" ADD CONSTRAINT "FK_Conversations_Messages_LastMessageId" FOREIGN KEY ("LastMessageId") REFERENCES "Messages" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807021826_AddCommunicationDiscussionFoundation') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260807021826_AddCommunicationDiscussionFoundation', '10.0.10');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Proposals" ADD "AdminComment" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Proposals" ADD "AttachmentUrl" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Proposals" ADD "Category" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Proposals" ADD "StudentId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Proposals" ADD "SubmittedAt" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Proposals" ADD "TeacherComment" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Facilities" ADD "IsDeleted" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "CoachName" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "CoachPhoneNumber" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "Day" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "EndTime" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "MaximumMembers" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "RegistrationOpen" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "Extracurriculars" ADD "StartTime" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "CalendarEvents" ADD "Color" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "CalendarEvents" ADD "DeletedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "CalendarEvents" ADD "EndTime" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "CalendarEvents" ADD "EventDate" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "CalendarEvents" ADD "StartTime" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    ALTER TABLE "CalendarEvents" ADD "Visibility" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE TABLE "Elections" (
        "Id" uuid NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Description" character varying(2000) NOT NULL,
        "StartDate" timestamp with time zone NOT NULL,
        "EndDate" timestamp with time zone NOT NULL,
        "Status" integer NOT NULL,
        "CreatedByUserId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone NOT NULL,
        "DeletedAt" timestamp with time zone,
        CONSTRAINT "PK_Elections" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Elections_Users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE TABLE "ElectionCandidates" (
        "Id" uuid NOT NULL,
        "ElectionId" uuid NOT NULL,
        "StudentId" uuid NOT NULL,
        "Vision" character varying(2000) NOT NULL,
        "Mission" character varying(4000) NOT NULL,
        "PhotoUrl" text,
        "CandidateNumber" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_ElectionCandidates" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ElectionCandidates_Elections_ElectionId" FOREIGN KEY ("ElectionId") REFERENCES "Elections" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_ElectionCandidates_Users_StudentId" FOREIGN KEY ("StudentId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE TABLE "Votes" (
        "Id" uuid NOT NULL,
        "ElectionId" uuid NOT NULL,
        "CandidateId" uuid NOT NULL,
        "VoterUserId" uuid NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Votes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Votes_ElectionCandidates_CandidateId" FOREIGN KEY ("CandidateId") REFERENCES "ElectionCandidates" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_Votes_Elections_ElectionId" FOREIGN KEY ("ElectionId") REFERENCES "Elections" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_Votes_Users_VoterUserId" FOREIGN KEY ("VoterUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE INDEX "IX_ElectionCandidates_ElectionId" ON "ElectionCandidates" ("ElectionId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE INDEX "IX_ElectionCandidates_StudentId" ON "ElectionCandidates" ("StudentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE INDEX "IX_Elections_CreatedByUserId" ON "Elections" ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE INDEX "IX_Votes_CandidateId" ON "Votes" ("CandidateId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE UNIQUE INDEX "IX_Votes_ElectionId_VoterUserId" ON "Votes" ("ElectionId", "VoterUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    CREATE INDEX "IX_Votes_VoterUserId" ON "Votes" ("VoterUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807024849_AddCalendarEvents') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260807024849_AddCalendarEvents', '10.0.10');
    END IF;
END $EF$;
COMMIT;

