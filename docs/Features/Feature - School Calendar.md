---
tags:
  - feature
  - backend
  - calendar
aliases:
  - Feature - School Calendar
---

# Feature - School Calendar

School Calendar module for StudentCenter. Allows admins and teachers to schedule school events, exams, holidays, and extracurricular schedules.

---

## Overview

A Calendar Event represents a scheduled item on the school calendar.

## Entity

See [[Entity - Calendar Event]].

## Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/calendar` | All authenticated | List events (paginated, sorted by StartDate) |
| GET | `/api/calendar/upcoming` | All authenticated | List upcoming future events |
| GET | `/api/calendar/{id}` | All authenticated | Get calendar event by ID |
| POST | `/api/calendar` | Admin, Teacher | Create calendar event |
| PUT | `/api/calendar/{id}` | Admin, Teacher (own) | Update calendar event |
| DELETE | `/api/calendar/{id}` | Admin, Teacher (own) | Delete calendar event |

## Query Parameters

### GET `/api/calendar`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `pageSize` | int | 10 | Items per page (max 100) |
| `category` | string | null | Filter by category |

### GET `/api/calendar/upcoming`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | int | 5 | Max number of upcoming events (max 50) |

## Authorization Matrix

| Action | Admin | Teacher | Student | OSIS |
|--------|-------|---------|---------|------|
| List events | Yes | Yes | Yes | Yes |
| View event | Yes | Yes | Yes | Yes |
| Create event | Yes | Yes | No | No |
| Update event | Any | Own only | No | No |
| Delete event | Any | Own only | No | No |

## Ownership and Business Rules

- Teachers can only update and delete calendar events they created (`CreatedByUserId` must match).
- Admin bypasses ownership checks and has full access.
- Students have read-only access.
- `EndDate` must be greater than or equal to `StartDate` (enforced via request validation).
- Upcoming events query returns future events where `StartDate` is greater than or equal to current UTC time.

## Implementation

| Layer | File | Description |
|-------|------|-------------|
| Domain | `CalendarEvent.cs` | Entity with Title, StartDate, EndDate, Category, etc. |
| Application | `CreateCalendarEventRequest.cs` | Request DTO with dynamic validation for date range |
| Application | `UpdateCalendarEventRequest.cs` | Request DTO with dynamic validation for date range |
| Application | `CalendarEventResponse.cs` | Response DTO |
| Application | `ICalendarService.cs` | Service interface |
| Infrastructure | `CalendarService.cs` | Service implementation |
| Infrastructure | `CalendarEventConfiguration.cs` | EF Core Fluent API configuration |
| Api | `CalendarController.cs` | REST controller |

## Database

- Table: `CalendarEvents`
- Indexes: `StartDate`, `EndDate`, `Category`, `CreatedByUserId`
- FK: `CreatedByUserId` → `Users.Id` (RESTRICT)
- Migration: `AddCalendarEventEntity`

## Related

- [[Entity - Calendar Event]]
- [[API Contract]]
- [[Database Schema]]
- [[MOC - Features]]
- [[Home]]
