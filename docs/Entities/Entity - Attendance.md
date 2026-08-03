---
tags:
  - entity
  - domain
  - attendance
aliases:
  - Entity - Attendance
---

# Entity - Attendance

Domain entity representing a student's attendance record for a specific date.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| StudentId | `Guid` | FK → [[Entity - User]] |
| Student | `User` | Navigation property |
| AttendanceDate | `DateTime` | Required, UTC, date only |
| Status | `AttendanceStatus` | Required, integer enum |
| Notes | `string?` | Optional, max 1000 |
| RecordedByUserId | `Guid` | FK → [[Entity - User]] |
| RecordedByUser | `User` | Navigation property (teacher/admin) |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |

## Location

`StudentCenter.Domain/Entities/Attendance.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/AttendanceConfiguration.cs`

## Indexes

- `IX_Attendances_StudentId`
- `IX_Attendances_AttendanceDate`
- `IX_Attendances_Status`
- `IX_Attendances_RecordedByUserId`
- `IX_Attendances_StudentId_AttendanceDate` (unique)

## Relationships

- **Many-to-One** with [[Entity - User]] via `StudentId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `RecordedByUserId` (RESTRICT delete)

## Status Enum

`AttendanceStatus` values:
- `Present = 0`
- `Late = 1`
- `Absent = 2`
- `Permission = 3`
- `Sick = 4`

## Constraints

- **Unique Constraint**: (StudentId, AttendanceDate) ensures one attendance per student per day
- **Date Validation**: AttendanceDate cannot be more than 30 days in future
- **Foreign Keys**: RESTRICT delete behavior on both user relationships

## Business Rules

- Only one attendance record per student per date (enforced by unique constraint)
- Only Teachers and Admins can record/edit attendance
- Teachers can only edit attendance they recorded (ownership validation)
- Admins can edit all attendance records
- Students can view attendance (read-only)
- Notes are optional and limited to 1000 characters

## Related

- [[Entity - User]]
- [[Feature - Attendance]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
