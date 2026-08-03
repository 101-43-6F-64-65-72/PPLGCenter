---
tags:
  - feature
aliases:
  - Feature - Extracurricular
---

# Feature - Extracurricular

Complete extracurricular activity management and student membership system.

## Status

**Implemented** (Phase 018)

## Overview

Extracurricular management allows teachers and admins to create and manage student clubs and activities. Students can discover, join, and leave extracurriculars based on availability and capacity constraints.

## Features

- Create extracurricular activities with name, description, category, and capacity
- View extracurricular listings with filtering by category and active status
- Join extracurriculars with duplicate and capacity validation
- Leave extracurriculars (memberships can be removed)
- List members of specific extracurriculars
- Edit extracurricular details (manager/admin only)
- Delete extracurriculars (manager/admin only)
- Pagination on all list endpoints
- Ownership validation in service layer
- Business rule enforcement (inactive, full, duplicate prevention)

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/extracurriculars` | Authenticated | List all extracurriculars (paginated, filterable) |
| GET | `/api/extracurriculars/{id}` | Authenticated | Get extracurricular detail with member count |
| POST | `/api/extracurriculars` | Admin, Teacher | Create new extracurricular |
| PUT | `/api/extracurriculars/{id}` | Admin, Teacher own | Update extracurricular details |
| DELETE | `/api/extracurriculars/{id}` | Admin, Teacher own | Delete extracurricular |
| POST | `/api/extracurriculars/{id}/join` | Student | Join extracurricular (if eligible) |
| DELETE | `/api/extracurriculars/{id}/leave` | Student | Leave extracurricular |
| GET | `/api/extracurriculars/{id}/members` | Authenticated | List members (paginated) |

## DTOs

### CreateExtracurricularRequest
```
- Name: string (required, 3-200 chars)
- Description: string (required, 10-1000 chars)
- ImageUrl: string? (optional, max 500 chars)
- Category: string (required, 3-100 chars)
- MaxMembers: int (required, 1-1000)
```

### UpdateExtracurricularRequest
```
- Name: string (required, 3-200 chars)
- Description: string (required, 10-1000 chars)
- ImageUrl: string? (optional, max 500 chars)
- Category: string (required, 3-100 chars)
- MaxMembers: int (required, 1-1000)
- IsActive: bool (required)
```

### ExtracurricularResponse
```
- Id: Guid
- Name: string
- Description: string
- ImageUrl: string?
- Category: string
- MaxMembers: int
- CurrentMembers: int (calculated from Members collection)
- IsActive: bool
- ManagedByUserId: Guid
- ManagedByUserName: string
- CreatedAt: DateTime
- UpdatedAt: DateTime
```

### ExtracurricularMemberResponse
```
- Id: Guid
- ExtracurricularId: Guid
- StudentId: Guid
- StudentName: string
- StudentEmail: string
- JoinedAt: DateTime
```

## Business Rules

1. **Creation**: Only Admin and Teacher can create extracurriculars
2. **Management**: Only manager or Admin can update/delete
3. **Join Eligibility**: 
   - Only students can join
   - Cannot join inactive extracurriculars
   - Cannot join if at capacity (Members == MaxMembers)
   - Cannot join twice (duplicate prevention via unique constraint)
4. **Membership**: Each student can join only once per extracurricular
5. **Leave**: Students can leave anytime

## Authorization Matrix

| Operation | Student | Teacher | Admin | OSIS |
|-----------|---------|---------|-------|------|
| List | ✓ | ✓ | ✓ | ✓ |
| View | ✓ | ✓ | ✓ | ✓ |
| Create | ✗ | ✓ | ✓ | ✗ |
| Update | ✗ | ✓ (own) | ✓ | ✗ |
| Delete | ✗ | ✓ (own) | ✓ | ✗ |
| Join | ✓ | ✗ | ✗ | ✗ |
| Leave | ✓ | ✗ | ✗ | ✗ |
| View Members | ✓ | ✓ | ✓ | ✓ |

## Implementation Notes

- Service layer enforces ownership and role checks before data mutations
- `AsNoTracking()` used for all read queries (GET endpoints)
- Foreign keys use `DeleteBehavior.Restrict` for Users to prevent orphaning
- Foreign keys use `DeleteBehavior.Cascade` for Extracurricular to ExtracurricularMembers (cleanup on delete)
- Unique index on `(ExtracurricularId, StudentId)` prevents duplicate memberships
- Pagination on lists: default 10, max 100 items per page
- Response DTOs include calculated field `CurrentMembers` (count of members)
- Validation attributes on DTOs for input sanitization
- Exception handling for business rule violations (returns 422 Unprocessable Entity)

## Related

- [[Entity - Extracurricular]]
- [[Entity - Extracurricular Member]]
- [[User Roles]]
- [[API Contract]]
- [[Feature - Authentication]]
- [[Database Schema]]
- [[MOC - Features]]
