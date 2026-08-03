---
tags:
  - feature
aliases:
  - Feature - Attendance
---

# Feature - Attendance

Complete attendance management system for tracking student presence, absences, and tardiness.

## Status

**Implemented** (Phase 021)

## Overview

Comprehensive attendance tracking module that allows teachers and administrators to record and manage student attendance. Provides multiple query endpoints for retrieving attendance by student, date, or globally. Forms the foundation for analytics, reports, and future notifications.

## Features

- Record attendance for students with multiple status types
- Edit attendance records (Teacher own, Admin all)
- Delete attendance records (Teacher own, Admin all)
- Query attendance globally with pagination
- Query attendance by specific student with history
- Query attendance by date with all students
- Prevent duplicate attendance entries (one per student per date)
- Validate date constraints (not more than 30 days in future)
- Add optional notes to attendance records
- Track who recorded each attendance
- Track creation and update timestamps

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | Authenticated | List all attendance (paginated) |
| GET | `/api/attendance/{id}` | Authenticated | Get specific attendance record |
| GET | `/api/attendance/student/{studentId}` | Authenticated | Get student's attendance history (paginated) |
| GET | `/api/attendance/date/{date}` | Authenticated | Get attendance for specific date (all students, paginated) |
| POST | `/api/attendance` | Teacher, Admin | Record new attendance |
| PUT | `/api/attendance/{id}` | Teacher, Admin | Update attendance record |
| DELETE | `/api/attendance/{id}` | Teacher, Admin | Delete attendance record |

## DTOs

### CreateAttendanceRequest
```
- StudentId: Guid (required)
- AttendanceDate: DateTime (required)
- Status: AttendanceStatus (required)
- Notes: string? (optional, max 1000)
```

### UpdateAttendanceRequest
```
- Status: AttendanceStatus (required)
- Notes: string? (optional, max 1000)
```

### AttendanceResponse
```
- Id: Guid
- StudentId: Guid
- StudentName: string
- AttendanceDate: DateTime
- Status: AttendanceStatus
- Notes: string?
- RecordedByUserId: Guid
- RecordedByUserName: string
- CreatedAt: DateTime
- UpdatedAt: DateTime
```

## Business Rules

1. **One per Day**: Only one attendance record allowed per student per date (unique constraint)
2. **Date Limit**: Attendance date cannot be more than 30 days in future
3. **Recording**: Only Teachers and Admins can record attendance
4. **Editing**: 
   - Teachers can edit only attendance they recorded
   - Admins can edit any attendance
5. **Deletion**:
   - Teachers can delete only attendance they recorded
   - Admins can delete any attendance
6. **Reading**: All authenticated users can read attendance
7. **Duplicate Prevention**: System throws `InvalidOperationException` if attempting to create duplicate

## Authorization Matrix

| Operation | Student | Teacher | Admin | OSIS |
|-----------|---------|---------|-------|------|
| List All | ✓ | ✓ | ✓ | ✓ |
| Get By ID | ✓ | ✓ | ✓ | ✓ |
| Get By Student | ✓ | ✓ | ✓ | ✓ |
| Get By Date | ✓ | ✓ | ✓ | ✓ |
| Create | ✗ | ✓ | ✓ | ✗ |
| Update | ✗ | ✓ (own) | ✓ | ✗ |
| Delete | ✗ | ✓ (own) | ✓ | ✗ |

## Status Types

| Status | Value | Meaning |
|--------|-------|---------|
| Present | 0 | Student was present |
| Late | 1 | Student was late |
| Absent | 2 | Student was absent |
| Permission | 3 | Approved absence with permission |
| Sick | 4 | Absence due to illness |

## Implementation Notes

- Service layer enforces ownership checks before mutations
- `AsNoTracking()` used for all read queries (GET endpoints)
- Foreign keys use `DeleteBehavior.Restrict` to prevent orphaning
- Composite unique index on (StudentId, AttendanceDate)
- Indexes on StudentId, AttendanceDate, Status, RecordedByUserId for query optimization
- Validation attributes on DTOs for input sanitization
- Exception handling for business rule violations (returns 422 Unprocessable Entity)
- All dates stored as UTC in database
- Date-only comparison (ignores time component)

## Future Enhancements

- Attendance statistics dashboard
- Daily/weekly/monthly absence reports
- Parent notifications for absences
- Bulk attendance recording
- Attendance export to CSV/Excel
- Integration with report cards
- Automated notifications on excessive absences
- Attendance trends analytics
- Class-wide attendance summaries

## Related

- [[Entity - Attendance]]
- [[User Roles]]
- [[API Contract]]
- [[Feature - Authentication]]
- [[Database Schema]]
- [[MOC - Features]]
