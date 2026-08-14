---
tags:
  - entity
  - domain
  - assignments
aliases:
  - Entity - Assignment
---

# Entity - Assignment

Domain entity representing a task assigned by a teacher to students.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| Title | `string` | Required, max 200 |
| Description | `string?` | Optional, max 2000 |
| Subject | `string` | Required, max 100 |
| Grade | `string` | Required, max 50 |
| DueDate | `DateTime` | Required, UTC |
| MaxScore | `int` | Required |
| CreatedAt | `DateTime` | Required, default `now()`, UTC |
| UpdatedAt | `DateTime` | Required, default `now()`, UTC |
| CreatedByUserId | `Guid` | FK → [[Entity - User]] |
| CreatedByUser | `User` | Navigation property |
| Submissions | `ICollection<Submission>` | Navigation collection |

## Location

`StudentCenter.Domain/Entities/Assignment.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/AssignmentConfiguration.cs`

## Indexes

- `IX_Assignments_Subject`
- `IX_Assignments_Grade`
- `IX_Assignments_DueDate`
- `IX_Assignments_CreatedByUserId`

## Relationships

- **Many-to-One** with [[Entity - User]] via `CreatedByUserId` (RESTRICT delete)
- **One-to-Many** with [[Entity - Submission]] via `Submissions` (RESTRICT delete)

## Related

- [[Entity - Submission]]
- [[Feature - Assignment]]
- [[Database Schema]]
- [[MOC - Backend]]
- [[Home]]
