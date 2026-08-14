---
tags:
  - backend
aliases:
  - Backend Overview
---

# Backend Overview

The StudentCenter backend is an ASP.NET Core Web API built with [[Clean Architecture]].

## Project Structure

```
backend/
├── StudentCenter.Api/
│   ├── Controllers/
│   │   ├── HomeController.cs        (Health check)
│   │   ├── AuthController.cs        (Login, Me)
│   │   └── AnnouncementController.cs (CRUD)
│   ├── Models/Responses/
│   │   └── ApiResponse.cs           (Generic wrapper)
│   ├── Properties/launchSettings.json
│   ├── appsettings.json
│   └── Program.cs                   (DI, middleware, startup)
│
├── StudentCenter.Application/
│   ├── DTOs/                        (Request/Response objects)
│   └── Services/                    (Interface definitions)
│
├── StudentCenter.Domain/
│   ├── Entities/                    (User, Announcement)
│   └── Enums/                       (UserRole)
│
└── StudentCenter.Infrastructure/
    ├── Data/
    │   ├── AppDbContext.cs
    │   ├── Configurations/          (EF Fluent API)
    │   └── Seeders/                 (SeedAdminData)
    ├── Migrations/
    └── Services/                    (Service implementations)
```

## Running the Backend

```bash
cd backend/StudentCenter.Api
dotnet run
```

- **HTTP**: `http://localhost:5051`
- **HTTPS**: `https://localhost:7187`

## Implemented Features

1. [[Authentication]] — JWT login + current user endpoint
2. [[Feature - Announcements]] — Full CRUD with pagination
3. [[Feature - Materials]] — Teaching resource management
4. [[Feature - Assignment]] — Assignment creation and grading
5. [[Feature - School Calendar]] — Event scheduling
6. [[Feature - Digital Bulletin Board]] — Announcements with comments/reactions
7. [[Feature - Notification]] — In-app notifications with service layer integration
8. [[Feature - Facility Booking]] — Facility reservation with approval workflow
9. [[Feature - Proposals]] — OSIS proposal submission and review
10. [[Feature - Extracurricular]] — Club/activity management
11. [[Feature - Search]] — Global search with role-based filtering

## Global Search & Pagination (Phase 020)

Centralized search infrastructure using LINQ-based queries across all entities:

### Search Architecture

```
GET /api/search?keyword=...&page=1&pageSize=10
    ↓
SearchController (validates auth)
    ↓
ISearchService.SearchAsync()
    ↓
Parallel Task.WhenAll() for 7 entity types:
  - Announcements (title/content)
  - Materials (title/description)
  - Assignments (title/description)
  - Calendar Events (title/description)
  - Facilities (name/description, active only)
  - Extracurriculars (name/description, active only)
  - Proposals (title/description, role-based filtering)
    ↓
AsNoTracking() queries with projection to DTOs
    ↓
Grouped SearchResponse returned
```

### Pagination Model

- **PagedRequest**: Input model (page, pageSize with normalization)
- **PagedResult<T>**: Output model (items, totalCount, totalPages calculated)
- Default pageSize: 10, Max: 100
- All list endpoints use standardized pagination

### Feature Filtering

Existing services enhanced with SearchAsync methods:

| Service | New Method | Filters |
|---------|-----------|---------|
| AnnouncementService | SearchAsync | keyword, isPinned |
| AssignmentService | SearchAsync | keyword, subject, grade, dueBefore, dueAfter |
| (Future) MaterialService | SearchAsync | keyword, subject, grade |
| (Future) CalendarService | SearchAsync | keyword, category, upcoming |
| (Future) FacilityService | SearchAsync | keyword, isActive |
| (Future) ProposalService | SearchAsync | keyword, status |
| (Future) ExtracurricularService | SearchAsync | keyword, category, isActive |

### Performance Optimizations

- ✓ AsNoTracking() on all read queries
- ✓ Projection to DTOs (no entity exposure)
- ✓ Parallel searches via Task.WhenAll
- ✓ IQueryable filters before pagination
- ✓ OrderBy before Skip/Take
- ✓ No N+1 queries

### Authorization

- All public users: Announcements, Materials, Assignments, Calendar
- Proposals: OSIS (own only), Admin/Teacher (all)
- Facilities/Extracurriculars: Active only
- CurrentUserService used for role-based access

Notifications are triggered from the **Service Layer** (not Controllers) to ensure consistency across workflows:

```
User Action (API Call)
    ↓
Controller → Service Layer
    ↓
Service updates entity (DB save)
    ↓
Service calls INotificationService.NotifyUserAsync/NotifyUsersAsync
    ↓
Notification created and saved to database
    ↓
Client fetches via GET /api/notifications
```

### Integrated Workflows

| Workflow | Trigger | Service | Notification Type |
|----------|---------|---------|-------------------|
| Assignment Creation | POST /api/assignments | AssignmentService.CreateAssignmentAsync | Assignment → All Students |
| Submission Grading | PUT /api/submissions/{id}/grade | SubmissionService.GradeSubmissionAsync | Grade → Student |
| Proposal Approval | PATCH /api/proposals/{id}/review (Approved) | ProposalService.ReviewProposalAsync | Proposal → OSIS member |
| Proposal Rejection | PATCH /api/proposals/{id}/review (Rejected) | ProposalService.ReviewProposalAsync | Proposal → OSIS member |
| Booking Approval | PUT /api/bookings/{id}/status (Approved) | BookingService.UpdateStatusAsync | Booking → Requester |
| Booking Rejection | PUT /api/bookings/{id}/status (Rejected) | BookingService.UpdateStatusAsync | Booking → Requester |
| Announcement Publish | POST /api/announcements | AnnouncementService.CreateAnnouncementAsync | Announcement → All Users |

### Architecture Rules

- ✓ Controllers remain unchanged; no direct NotificationService calls in controllers
- ✓ All notification triggers are in Service Layer (Infrastructure.Services)
- ✓ INotificationService is injected only into required services
- ✓ Notification payloads are consistent: Title, Message, NotificationType, ReferenceId, ReferenceType
- ✓ No duplicate notification logic; reuse INotificationService methods
- ✓ DI registration ensures proper service initialization order

## Key Files

| File | Purpose |
|------|---------|
| `Program.cs` | DI container setup, middleware pipeline, JWT config |
| `AppDbContext.cs` | EF Core DbContext with Users and Announcements |
| `ApiResponse.cs` | Standard API response wrapper |
| `SeedAdminData.cs` | Seeds default admin user on startup |

## Related

- [[Architecture]]
- [[Clean Architecture]]
- [[Tech Stack]]
- [[Request Pipeline]]
- [[MOC - Backend]]
