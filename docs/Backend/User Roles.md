---
tags:
  - backend
  - authentication
  - api
aliases:
  - User Roles
  - Roles
---

# User Roles

StudentCenter uses four roles to control access throughout the system.

## Role Definitions

| Role | Enum Value | Description |
|------|-----------|-------------|
| Admin | 0 | Vice Principal of Student Affairs. Full system access. |
| Teacher | 1 | Faculty members. Can approve proposals and bookings. |
| Student | 2 | Regular students. Can view content and submit requests. |
| OSIS | 3 | Student council members. Can manage announcements and events. |

## Enum Definition

**File**: `StudentCenter.Domain/Enums/UserRole.cs`

```csharp
public enum UserRole
{
    Admin = 0,
    Teacher = 1,
    Student = 2,
    OSIS = 3
}
```

## Role Permissions (Current)

| Action | Admin | OSIS | Teacher | Student |
|--------|-------|------|---------|---------|
| Login | Yes | Yes | Yes | Yes |
| View announcements | Yes | Yes | Yes | Yes |
| Create/Edit/Delete announcements | Yes | Yes | No | No |
| View current user (me) | Yes | Yes | Yes | Yes |

## Dashboard Views (Planned)

| Role | Dashboard Contents |
|------|-------------------|
| Student | Latest announcements, upcoming events, joined clubs, booking status, proposal status |
| OSIS | Announcement management, event management, proposals, bookings |
| Teacher | Proposal approval, booking approval, event monitoring |
| Admin | User stats, announcement stats, club stats, proposal stats, facility stats |

## Notes

- Teachers who are extracurricular advisors do **not** get a separate role
- The advisor relationship is determined through database relations
- Login identifier varies: NIS/NISN (Student), NIP (Teacher/Admin)

## Related

- [[Authentication]]
- [[Entity - User]]
- [[API Contract]]
- [[Feature - Dashboard]]
