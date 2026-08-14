---
tags:
  - planning
aliases:
  - Project Plan
---

# Project Plan

StudentCenter is a web-based student information system for SMA/SMK schools.

## Objective

Build a modern, responsive platform that unifies school activities for students, OSIS, teachers, and administrators.

## Scope (V1)

### Backend Modules
1. [[Feature - Authentication]] — JWT login, current user
2. [[Feature - Announcements]] — CRUD with pagination
3. [[Feature - Profile]] — View/edit profile
4. [[Feature - School Calendar]] — Events
5. [[Feature - Extracurricular]] — Clubs, registration
6. [[Feature - Facility Booking]] — Booking + approval
7. [[Feature - Proposals]] — Submit + approval timeline

### Frontend Modules
1. [[Landing Page]] — Public landing page
2. Login page
3. Role-based [[Feature - Dashboard|dashboards]]
4. [[Feature - Digital Bulletin Board|Bulletin board]] views
5. Calendar views
6. Extracurricular pages
7. Booking/Proposal forms
8. [[Feature - Profile|Profile]] management

## Teams

| Team | Responsibility |
|------|---------------|
| Backend | ASP.NET Core API, database, business logic |
| Frontend | Next.js UI, user experience, API integration |

## Agreements

- [[API Contract]] is frozen for V1
- Both teams develop independently based on the contract
- Breaking changes require versioning (`/api/v2/`)

## Timeline

See [[Roadmap]] for phase-by-phase breakdown.

## Related

- [[Roadmap]]
- [[Architecture]]
- [[API Contract]]
- [[Home]]
