---
tags:
  - entity
  - domain
  - extracurricular
aliases:
  - Entity - Extracurricular
---

# Entity - Extracurricular

Domain entity representing an extracurricular activity managed by teachers or admin.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Name | `string` | Required, max 200 |
| Description | `string` | Required, max 1000 |
| ImageUrl | `string?` | Optional, max 500 |
| Category | `string` | Required, max 100 |
| MaxMembers | `int` | Required, 1-1000 |
| IsActive | `bool` | Required, default `true` |
| ManagedByUserId | `Guid` | FK → [[Entity - User]] |
| ManagedByUser | `User` | Navigation property |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |
| Members | `ICollection<ExtracurricularMember>` | Navigation collection |

## Location

`StudentCenter.Domain/Entities/Extracurricular.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/ExtracurricularConfiguration.cs`

## Indexes

- `IX_Extracurriculars_Name`
- `IX_Extracurriculars_Category`
- `IX_Extracurriculars_IsActive`
- `IX_Extracurriculars_ManagedByUserId`
- `IX_Extracurriculars_CreatedAt`

## Relationships

- **Many-to-One** with [[Entity - User]] via `ManagedByUserId` (RESTRICT delete)
- **One-to-Many** with [[Entity - Extracurricular Member]] (CASCADE delete on extracurricular)

## Business Rules

- Only Admin and Teacher can create/update/delete extracurriculars
- Students can join/leave extracurriculars
- Cannot join inactive extracurriculars
- Cannot join when MaxMembers capacity reached
- Each student can join only once per extracurricular
- Membership is enforced with unique constraint (StudentId, ExtracurricularId)

## Related

- [[Entity - User]]
- [[Entity - Extracurricular Member]]
- [[Feature - Extracurricular]]
- [[Database Schema]]
- [[MOC - Database]]
- [[Home]]
