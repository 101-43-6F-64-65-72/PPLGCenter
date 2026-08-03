---
tags:
  - entity
  - domain
  - extracurricular-member
aliases:
  - Entity - Extracurricular Member
---

# Entity - Extracurricular Member

Domain entity representing a student's membership in an extracurricular activity.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| ExtracurricularId | `Guid` | FK → [[Entity - Extracurricular]] |
| Extracurricular | `Extracurricular` | Navigation property |
| StudentId | `Guid` | FK → [[Entity - User]] |
| Student | `User` | Navigation property |
| JoinedAt | `DateTime` | Required, default `now()`, UTC |

## Location

`StudentCenter.Domain/Entities/ExtracurricularMember.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/ExtracurricularMemberConfiguration.cs`

## Indexes

- `IX_ExtracurricularMembers_ExtracurricularId`
- `IX_ExtracurricularMembers_StudentId`
- `IX_ExtracurricularMembers_ExtracurricularId_StudentId` (unique)
- `IX_ExtracurricularMembers_JoinedAt`

## Relationships

- **Many-to-One** with [[Entity - Extracurricular]] via `ExtracurricularId` (CASCADE delete)
- **Many-to-One** with [[Entity - User]] via `StudentId` (RESTRICT delete)

## Constraints

- Unique constraint on `(ExtracurricularId, StudentId)` prevents duplicate memberships
- CASCADE delete on extracurricular deletion
- RESTRICT delete on user deletion (preserves history)

## Business Rules

- Only students can be members
- Each student can join an extracurricular only once
- Membership records track join date for auditing

## Related

- [[Entity - Extracurricular]]
- [[Entity - User]]
- [[Feature - Extracurricular]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
