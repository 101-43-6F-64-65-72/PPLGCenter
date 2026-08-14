---
tags:
  - frontend
aliases:
  - Frontend Project Context
---

# Frontend Project Context

Complete project context for the StudentCenter frontend.

**Source**: `frontend/docs/project-context.md`

## Overview

StudentCenter is a web-based student information system that helps students, OSIS, extracurricular clubs, teachers, and the vice principal of student affairs operate within a single platform.

## Target Users

1. **Student** — Regular students
2. **OSIS** — Student council
3. **Extracurricular Administrator** — Club managers
4. **Teacher** — Faculty
5. **Admin** — Vice Principal of Student Affairs

Each role has a different [[Feature - Dashboard|dashboard]] view.

## Main Modules

| Module | Key Features | Status |
|--------|-------------|--------|
| [[Feature - Authentication]] | Login, Forgot Password, Change Password | Backend done |
| [[Feature - Dashboard]] | Role-specific dashboards | Planned |
| [[Feature - Digital Bulletin Board]] | Announcement list, detail, search, filter | Backend done |
| [[Feature - School Calendar]] | Monthly calendar, events | Planned |
| [[Feature - Extracurricular]] | Club list, registration, attendance | Planned |
| [[Feature - Facility Booking]] | Facility list, booking, approval | Planned |
| [[Feature - Proposals]] | Upload, status tracking, approval timeline | Planned |
| [[Feature - Profile]] | Personal info, avatar, class, major | Planned |

## UI Guidelines

- Modern, minimal, clean, professional, student-friendly design
- Card-based layouts
- Consistent button variants: Primary, Secondary, Outline, Ghost, Danger
- Tables with sorting, pagination, empty state, loading, search
- Forms with label, placeholder, validation, error message, loading state
- Skeleton loading on every page
- Informative empty states with illustrations
- User-friendly error messages (no stack traces)
- Semantic HTML, keyboard accessible, alt text on images

## Related

- [[Frontend Overview]]
- [[Frontend Architecture Rules]]
- [[API Contract]]
- [[User Roles]]
- [[MOC - Frontend]]
