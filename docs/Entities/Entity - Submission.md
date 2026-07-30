---
tags:
  - entity
  - domain
  - submissions
aliases:
  - Entity - Submission
---

# Entity - Submission

Domain entity representing a student's submitted work for an assignment.

---

## Properties

| Property | Type | Constraints |
|----------|------|-------------|
| Id | `Guid` | PK, default `gen_random_uuid()` |
| FileUrl | `string` | Required, max 500 |
| Notes | `string?` | Optional, max 1000 |
| Score | `int?` | Nullable (set when graded) |
| Feedback | `string?` | Optional, max 2000 |
| SubmittedAt | `DateTime` | Required, default `now()`, UTC |
| GradedAt | `DateTime?` | Nullable (set when graded) |
| AssignmentId | `Guid` | FK → [[Entity - Assignment]] |
| Assignment | `Assignment` | Navigation property |
| StudentId | `Guid` | FK → [[Entity - User]] |
| Student | `User` | Navigation property |

## Location

`StudentCenter.Domain/Entities/Submission.cs`

## Configuration

`StudentCenter.Infrastructure/Data/Configurations/SubmissionConfiguration.cs`

## Indexes

- `IX_Submissions_AssignmentId`
- `IX_Submissions_StudentId`
- `IX_Submissions_AssignmentId_StudentId` (unique — one submission per student per assignment)

## Relationships

- **Many-to-One** with [[Entity - Assignment]] via `AssignmentId` (RESTRICT delete)
- **Many-to-One** with [[Entity - User]] via `StudentId` (RESTRICT delete)

## Related

- [[Entity - Assignment]]
- [[Feature - Assignment]]
- [[Database Schema]]
- [[MOC - Backend]]
- [[Home]]
