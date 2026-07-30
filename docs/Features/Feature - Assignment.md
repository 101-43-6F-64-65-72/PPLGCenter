---
tags:
  - feature
  - backend
  - assignments
aliases:
  - Feature - Assignment
---

# Feature - Assignment

Assignment Management module for StudentCenter. Teachers create assignments, students submit work, and teachers grade submissions with feedback.

---

## Overview

An Assignment represents a task assigned by a teacher to students. Students submit their work, and teachers can grade submissions with scores and feedback. Each student can submit only once per assignment (enforced by unique constraint).

## Entities

- [[Entity - Assignment]]
- [[Entity - Submission]]

## Endpoints

### Assignments

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/assignments` | All authenticated | List assignments (paginated, filterable) |
| GET | `/api/assignments/{id}` | All authenticated | Get assignment by ID |
| POST | `/api/assignments` | Admin, Teacher | Create assignment |
| PUT | `/api/assignments/{id}` | Admin, Teacher (own) | Update assignment |
| DELETE | `/api/assignments/{id}` | Admin, Teacher (own) | Delete assignment |

### Submissions

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/assignments/{id}/submit` | Student | Submit assignment |
| GET | `/api/assignments/{id}/submissions` | Admin, Teacher | List submissions for assignment |
| GET | `/api/submissions/{id}` | All authenticated | Get submission by ID |
| PUT | `/api/submissions/{id}/grade` | Admin, Teacher (own assignment) | Grade submission |

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |
| `subject` | string | null | Filter by subject |
| `grade` | string | null | Filter by grade |

## Authorization Matrix

| Action | Admin | Teacher | Student | OSIS |
|--------|-------|---------|---------|------|
| List assignments | Yes | Yes | Yes | Yes |
| View assignment | Yes | Yes | Yes | Yes |
| Create assignment | Yes | Yes | No | No |
| Update assignment | Any | Own only | No | No |
| Delete assignment | Any | Own only | No | No |
| Submit assignment | No | No | Yes | No |
| View submissions | Yes | Yes | No | No |
| Grade submission | Any | Own assignment | No | No |

## Ownership Rules

- Teachers can only update and delete assignments they created (`CreatedByUserId` must match).
- Teachers can only grade submissions for their own assignments.
- Admin bypasses all ownership checks.
- Students can submit only once per assignment (unique constraint on `AssignmentId + StudentId`).

## Implementation

| Layer | File | Description |
|-------|------|-------------|
| Domain | `Assignment.cs` | Entity with Title, Description, Subject, Grade, DueDate, MaxScore |
| Domain | `Submission.cs` | Entity with FileUrl, Notes, Score, Feedback, GradedAt |
| Application | `CreateAssignmentRequest.cs` | Request DTO with validation |
| Application | `UpdateAssignmentRequest.cs` | Request DTO with validation |
| Application | `AssignmentResponse.cs` | Response DTO with SubmissionCount |
| Application | `SubmitAssignmentRequest.cs` | Request DTO with validation |
| Application | `SubmissionResponse.cs` | Response DTO |
| Application | `GradeSubmissionRequest.cs` | Request DTO with validation |
| Application | `IAssignmentService.cs` | Service interface |
| Application | `ISubmissionService.cs` | Service interface |
| Infrastructure | `AssignmentService.cs` | Service implementation |
| Infrastructure | `SubmissionService.cs` | Service implementation |
| Infrastructure | `AssignmentConfiguration.cs` | EF Core Fluent API configuration |
| Infrastructure | `SubmissionConfiguration.cs` | EF Core Fluent API configuration |
| Api | `AssignmentsController.cs` | REST controller (assignments + submissions) |

## Database

- Table: `Assignments` — Indexes: `Subject`, `Grade`, `DueDate`, `CreatedByUserId`
- Table: `Submissions` — Indexes: `AssignmentId`, `StudentId`, unique(`AssignmentId`, `StudentId`)
- FK: `Assignments.CreatedByUserId` → `Users.Id` (RESTRICT)
- FK: `Submissions.AssignmentId` → `Assignments.Id` (RESTRICT)
- FK: `Submissions.StudentId` → `Users.Id` (RESTRICT)
- Migration: `AddAssignmentAndSubmissionEntities`

## Related

- [[Entity - Assignment]]
- [[Entity - Submission]]
- [[API Contract]]
- [[Database Schema]]
- [[MOC - Features]]
- [[Home]]
