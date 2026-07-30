---
tags:
  - database
  - backend
aliases:
  - Database
  - Database Schema
---

# Database Schema

StudentCenter uses **Supabase PostgreSQL** accessed via Entity Framework Core with Npgsql.

## Connection

- **Provider**: Npgsql (PostgreSQL)
- **Host**: `aws-0-ap-southeast-1.pooler.supabase.com`
- **Port**: 6543
- **Database**: postgres
- **ORM**: Entity Framework Core 10.0

## Tables

### Users

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| FullName | varchar(200) | NOT NULL |
| Email | varchar(256) | NOT NULL, UNIQUE |
| PasswordHash | varchar(500) | NOT NULL |
| Role | integer | NOT NULL (enum) |
| IsActive | boolean | NOT NULL, default `true` |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |

**Indexes**: `IX_Users_Email` (unique)

### Announcements

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Title | varchar(200) | NOT NULL |
| Content | text | NOT NULL |
| Category | varchar(100) | NOT NULL |
| CoverImageUrl | varchar(500) | nullable |
| IsPinned | boolean | NOT NULL, default `false` |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |
| CreatedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_Announcements_Category`, `IX_Announcements_CreatedAt`, `IX_Announcements_CreatedByUserId`, `IX_Announcements_IsPinned`

### Materials

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Title | varchar(200) | NOT NULL |
| Description | varchar(1000) | nullable |
| FileUrl | varchar(500) | NOT NULL |
| Subject | varchar(100) | NOT NULL |
| Grade | varchar(50) | NOT NULL |
| UploadedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |
| UploadedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_Materials_UploadedAt`, `IX_Materials_Subject`, `IX_Materials_Grade`, `IX_Materials_UploadedByUserId`

### Assignments

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Title | varchar(200) | NOT NULL |
| Description | varchar(2000) | nullable |
| Subject | varchar(100) | NOT NULL |
| Grade | varchar(50) | NOT NULL |
| DueDate | timestamptz | NOT NULL |
| MaxScore | integer | NOT NULL |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |
| CreatedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_Assignments_Subject`, `IX_Assignments_Grade`, `IX_Assignments_DueDate`, `IX_Assignments_CreatedByUserId`

### Submissions

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| FileUrl | varchar(500) | NOT NULL |
| Notes | varchar(1000) | nullable |
| Score | integer | nullable |
| Feedback | varchar(2000) | nullable |
| SubmittedAt | timestamptz | NOT NULL, default `now()` |
| GradedAt | timestamptz | nullable |
| AssignmentId | uuid | NOT NULL, FK → Assignments.Id (RESTRICT) |
| StudentId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_Submissions_AssignmentId`, `IX_Submissions_StudentId`, `IX_Submissions_AssignmentId_StudentId` (unique)

### CalendarEvents

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Title | varchar(200) | NOT NULL |
| Description | varchar(2000) | nullable |
| StartDate | timestamptz | NOT NULL |
| EndDate | timestamptz | NOT NULL |
| Location | varchar(200) | nullable |
| Category | varchar(100) | NOT NULL |
| IsAllDay | boolean | NOT NULL, default `false` |
| CreatedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |

**Indexes**: `IX_CalendarEvents_StartDate`, `IX_CalendarEvents_EndDate`, `IX_CalendarEvents_Category`, `IX_CalendarEvents_CreatedByUserId`

### AnnouncementComments

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Content | varchar(1000) | NOT NULL |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| AnnouncementId | uuid | NOT NULL, FK → Announcements.Id (RESTRICT) |
| UserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_AnnouncementComments_AnnouncementId`, `IX_AnnouncementComments_UserId`, `IX_AnnouncementComments_CreatedAt`

### AnnouncementReactions

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Type | varchar(50) | NOT NULL |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| AnnouncementId | uuid | NOT NULL, FK → Announcements.Id (RESTRICT) |
| UserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |

**Indexes**: `IX_AnnouncementReactions_AnnouncementId`, `IX_AnnouncementReactions_UserId`, `IX_AnnouncementReactions_AnnouncementId_UserId` (unique)

### Notifications

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| UserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |
| Title | varchar(200) | NOT NULL |
| Message | varchar(1000) | NOT NULL |
| Type | integer | NOT NULL (enum) |
| ReferenceId | varchar(100) | nullable |
| ReferenceType | varchar(100) | nullable |
| IsRead | boolean | NOT NULL, default `false` |
| CreatedAt | timestamptz | NOT NULL, default `now()` |

**Indexes**: `IX_Notifications_UserId`, `IX_Notifications_CreatedAt`, `IX_Notifications_IsRead`, `IX_Notifications_Type`

### Facilities

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Name | varchar(100) | NOT NULL |
| Description | varchar(1000) | nullable |
| Location | varchar(200) | NOT NULL |
| Capacity | integer | NOT NULL |
| IsActive | boolean | NOT NULL, default `true` |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |

**Indexes**: `IX_Facilities_Name`, `IX_Facilities_IsActive`

### FacilityBookings

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| FacilityId | uuid | NOT NULL, FK → Facilities.Id (RESTRICT) |
| BookedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |
| Purpose | varchar(500) | NOT NULL |
| StartTime | timestamptz | NOT NULL |
| EndTime | timestamptz | NOT NULL |
| Status | integer | NOT NULL (enum) |
| RejectionReason | varchar(500) | nullable |
| ApprovedOrRejectedByUserId | uuid | nullable, FK → Users.Id (RESTRICT) |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |

**Indexes**: `IX_FacilityBookings_FacilityId`, `IX_FacilityBookings_BookedByUserId`, `IX_FacilityBookings_StartTime`, `IX_FacilityBookings_EndTime`, `IX_FacilityBookings_Status`

### Proposals

| Column | Type | Constraints |
|--------|------|-------------|
| Id | uuid | PK, default `gen_random_uuid()` |
| Title | varchar(300) | NOT NULL |
| Description | varchar(2000) | NOT NULL |
| FileUrl | varchar(500) | NOT NULL |
| Status | integer | NOT NULL (enum) |
| RejectionReason | varchar(1000) | nullable |
| SubmittedByUserId | uuid | NOT NULL, FK → Users.Id (RESTRICT) |
| ReviewedByUserId | uuid | nullable, FK → Users.Id (RESTRICT) |
| CreatedAt | timestamptz | NOT NULL, default `now()` |
| UpdatedAt | timestamptz | NOT NULL, default `now()` |
| ReviewedAt | timestamptz | nullable |

**Indexes**: `IX_Proposals_SubmittedByUserId`, `IX_Proposals_Status`, `IX_Proposals_CreatedAt`, `IX_Proposals_ReviewedByUserId`

## ERD

See [[Database ERD]] for the visual diagram.

## Configuration

Entity configurations use EF Core Fluent API:

- `UserConfiguration` → [[Entity - User]]
- `AnnouncementConfiguration` → [[Entity - Announcement]]
- `MaterialConfiguration` → [[Entity - Material]]
- `AssignmentConfiguration` → [[Entity - Assignment]]
- `SubmissionConfiguration` → [[Entity - Submission]]
- `CalendarEventConfiguration` → [[Entity - Calendar Event]]
- `AnnouncementCommentConfiguration` → [[Entity - Announcement Comment]]
- `AnnouncementReactionConfiguration` → [[Entity - Announcement Reaction]]
- `NotificationConfiguration` → [[Entity - Notification]]
- `FacilityConfiguration` → [[Entity - Facility]]
- `FacilityBookingConfiguration` → [[Entity - Facility Booking]]
- `ProposalConfiguration` → [[Entity - Proposal]]

## Seeding

`SeedAdminData` creates the default admin user on first run. See [[Authentication]].

## Related

- [[Database ERD]]
- [[Migrations]]
- [[Entity - User]]
- [[Entity - Announcement]]
- [[Entity - Material]]
- [[Entity - Assignment]]
- [[Entity - Submission]]
- [[Entity - Calendar Event]]
- [[Entity - Announcement Comment]]
- [[Entity - Announcement Reaction]]
- [[Entity - Notification]]
- [[Entity - Facility]]
- [[Entity - Facility Booking]]
- [[Entity - Proposal]]
- [[MOC - Database]]
