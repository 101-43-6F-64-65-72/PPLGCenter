---
tags:
  - entity
  - backend
  - database
aliases:
  - Entity - User
  - User Entity
---

# Entity - User

The `User` entity represents all system users across all [[User Roles]].

## Definition

**Project**: `StudentCenter.Domain/Entities/User.cs`

| Property | Type | Description |
|----------|------|-------------|
| Id | `Guid` | Primary key (auto-generated UUID) |
| FullName | `string` | User's full name (max 200) |
| Email | `string` | Unique email (max 256) |
| PasswordHash | `string` | Hashed password (max 500) |
| Role | `UserRole` | Enum: Admin=0, Teacher=1, Student=2, OSIS=3 |
| IsActive | `bool` | Account active status (default: true) |
| CreatedAt | `DateTime` | Creation timestamp |
| UpdatedAt | `DateTime` | Last update timestamp |

## Database Configuration

Configured in `UserConfiguration.cs` (Fluent API):

- Table: `Users`
- `Id` default: `gen_random_uuid()`
- `Email` has unique index
- `IsActive` defaults to `true`
- Timestamps default to `now()`

## Relationships

- **Announcement** → One User can create many [[Entity - Announcement|Announcements]] (via `CreatedByUserId`)

## DTOs

| DTO | Usage |
|-----|-------|
| `LoginRequest` | Login input (email + password) |
| `LoginResponse` | Login output (token + user info) |
| `CurrentUserResponse` | `/api/auth/me` response |

## Related

- [[User Roles]]
- [[Authentication]]
- [[Database Schema]]
- [[MOC - Backend]]
