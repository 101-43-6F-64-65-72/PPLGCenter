# 09 — Entity Catalog

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [How to Read This Catalog](#1-how-to-read-this-catalog)
2. [Enums](#2-enums)
3. [User](#3-user)
4. [Announcement / Comment / Reaction](#4-announcement--comment--reaction)
5. [Assignment / Submission](#5-assignment--submission)
6. [Material](#6-material)
7. [CalendarEvent](#7-calendarevent)
8. [Notification](#8-notification)
9. [Facility / FacilityBooking](#9-facility--facilitybooking)
10. [Proposal](#10-proposal)
11. [Extracurricular / Member](#11-extracurricular--member)
12. [Attendance](#12-attendance)
13. [Cross-Reference](#13-cross-reference)

---

## 1. How to Read This Catalog

Each entity lists the **verified** properties observed in code/configs/snapshot. Where a property's constraint is not confirmed from source, it is marked **(verify)**. Use [10_Database_ERD](10_Database_ERD.md) for relationships.

---

## 2. Enums

All in `StudentCenter.Domain/Enums` (int-based):

| Enum | Values |
|---|---|
| `UserRole` | `Admin=0`, `Teacher=1`, `Student=2`, `OSIS=3` |
| `BookingStatus` | `Pending=0`, `Approved=1`, `Rejected=2` |
| `ProposalStatus` | `Pending=0`, `Approved=1`, `Rejected=2` |
| `AttendanceStatus` | `Present=0`, `Late=1`, `Absent=2`, `Permission=3`, `Sick=4` |
| `NotificationType` | `Assignment=0`, `Announcement=1`, `Calendar=2`, `Proposal=3`, `Booking=4`, `Grade=5`, `System=6`, `Other=7` |

---

## 3. User

| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK, `uuid_generate_v4()` |
| FullName | string | required |
| Email | string | required, **unique**, ≤256 |
| PasswordHash | string | required (BCrypt) |
| Role | UserRole | default `Student`? (verify) |
| CreatedAt | DateTime | default UTC (verify) |
| UpdatedAt | DateTime | (verify) |

> ⚠️ No NIS/NISN/NIP, no class/major/phone columns — roadmap items for profile self-service.

---

## 4. Announcement / Comment / Reaction

**Announcement**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Title | string | required, max len (verify) |
| Content | string | required |
| AuthorUserId | Guid | FK → Users (Restrict) |
| CreatedAt | DateTime | index (verify) |

**AnnouncementComment**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| AnnouncementId | Guid | FK → Announcements |
| AuthorUserId | Guid | FK → Users |
| Content | string | required |

**AnnouncementReaction**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| AnnouncementId | Guid | FK |
| UserId | Guid | FK |
| Emoji | string | (verify) |

Unique index on `(AnnouncementId, UserId)` → one reaction per user.

---

## 5. Assignment / Submission

**Assignment**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Title | string | required |
| Description | string | (verify) |
| TeacherUserId | Guid | FK → Users |
| Class | string | target class (verify) |
| Subject | string | (verify) |
| DueDate | DateTime | used for past-due rejection |
| CreatedAt | DateTime | |

**Submission**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| AssignmentId | Guid | FK |
| StudentUserId | Guid | FK |
| Content / FileUrl | string | (verify) |
| Grade | string/number | (verify) |
| Feedback | string | (verify) |
| SubmittedAt | DateTime | |

Unique index on `(AssignmentId, StudentUserId)` → one submission per student per assignment.

---

## 6. Material

| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Title | string | required |
| Content | string | (verify) |
| Subject | string | filter value (verify) |
| Grade | string | filter value (verify) |
| FileUrl | string | (verify) |
| TeacherUserId | Guid | FK → Users |
| CreatedAt | DateTime | |

---

## 7. CalendarEvent

| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Title | string | required |
| Description | string | (verify) |
| StartTime | DateTime | used for upcoming queries (verify) |
| EndTime | DateTime | (verify) |
| CreatorUserId | Guid | FK → Users (owner) |
| Location | string | (verify) |

---

## 8. Notification

| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| UserId | Guid | FK → Users (recipient) |
| Type | NotificationType | enum |
| Title | string | required |
| Message | string | (verify) |
| IsRead | bool | default false |
| ReferenceId | Guid? | optional link (Proposal/Booking/etc.) |
| ReferenceType | string? | (verify) |
| CreatedAt | DateTime | |

Index on `(UserId, IsRead)` for unread-count queries (verify).

---

## 9. Facility / FacilityBooking

**Facility**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Name | string | required |
| Description | string | (verify) |
| Capacity | int | (verify) |
| IsAvailable | bool | (verify) |

**FacilityBooking**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| FacilityId | Guid | FK |
| UserId | Guid | FK (booker) |
| StartTime | DateTime | |
| EndTime | DateTime | conflict check on `(FacilityId, StartTime, EndTime)` |
| Status | BookingStatus | `Pending=0` default |
| Notes | string | (verify) |

---

## 10. Proposal

| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Title | string | 5–300 (DTO rule) |
| Description | string | 10–2000 (DTO rule) |
| FileUrl | string | ≤500, required (DTO rule) |
| Status | ProposalStatus | `Pending=0` default |
| RejectionReason | string | ≤1000 (verify) |
| SubmitterUserId | Guid | FK → Users |
| CreatedAt | DateTime | |

---

## 11. Extracurricular / Member

**Extracurricular**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| Name | string | required |
| Description | string | (verify) |
| LogoUrl | string | (verify) |
| ManagedByUserId | Guid | FK → Users (advisor "Pembina Ekskul") |
| MaxMembers | int? | (verify) |

**ExtracurricularMember**
| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| ExtracurricularId | Guid | FK |
| StudentUserId | Guid | FK |
| JoinedAt | DateTime | |

Unique index on `(ExtracurricularId, StudentUserId)`.

---

## 12. Attendance

| Property | Type | Constraints |
|---|---|---|
| Id | Guid | PK |
| StudentUserId | Guid | FK → Users (role Student) |
| AttendanceDate | DateOnly/DateTime | |
| Status | AttendanceStatus | `Present=0` default |
| Notes | string | (verify) |
| RecordedByUserId | Guid | FK → Users (teacher/admin) |

Unique index on `(StudentUserId, AttendanceDate)` → one record per student per day.

---

## 13. Cross-Reference

| For visuals | → [10_Database_ERD](10_Database_ERD.md) |
|---|---|
| For DB config details | → [05_Database_Architecture](05_Database_Architecture.md) |
| For original entity docs | → `docs/Entities/*` |

---

*Cross-references: [05_Database_Architecture](05_Database_Architecture.md) · [10_Database_ERD](10_Database_ERD.md) · [docs/Entities/*](../Entities/)*
