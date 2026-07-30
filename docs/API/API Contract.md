---
tags:
  - api
  - backend
  - frontend
aliases:
  - API Contract
  - API Agreement
---

# API Contract

This document defines the agreed API contract between Frontend and Backend teams (V1 - Frozen).

## Base URL

```
/api/v1
```

## Standard Response Format

### Success

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {}
}
```

### List (Paginated)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Validation Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

## HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Business Validation Error |
| 500 | Internal Server Error |

HTTP 422 examples: booking schedule conflicts, full extracurricular quota, proposal business rule violations.

## Authentication

See [[Authentication]] for the full flow.

- **Login**: `POST /api/v1/auth/login` with `{ identifier, password }`
- **Header**: `Authorization: Bearer <access_token>`
- Identifier can be NIS/NISN (Student) or NIP (Teacher/Admin)

## Frozen Payloads (V1)

The following payloads are final:

- Login
- Update Profile
- Announcement
- Event
- Join Club
- Booking
- Proposal

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/profile` | Get profile |
| PATCH | `/api/v1/profile` | Update profile |
| GET | `/api/v1/announcements` | List announcements |
| GET | `/api/announcements/feed` | View announcements feed (authenticated) |
| POST | `/api/announcements` | Create announcement |
| POST | `/api/announcements/{id}/comments` | Add comment to announcement (authenticated) |
| GET | `/api/announcements/{id}/comments` | List comments (authenticated) |
| DELETE | `/api/comments/{id}` | Delete comment (owner, Admin) |
| POST | `/api/announcements/{id}/reactions` | Add/toggle reaction (authenticated) |
| DELETE | `/api/announcements/{id}/reactions` | Remove reaction (authenticated) |
| GET | `/api/v1/events` | List events |
| GET | `/api/calendar` | List calendar events (authenticated) |
| GET | `/api/calendar/upcoming` | List upcoming calendar events (authenticated) |
| GET | `/api/calendar/{id}` | Get calendar event by ID (authenticated) |
| POST | `/api/calendar` | Create calendar event (Admin, Teacher) |
| PUT | `/api/calendar/{id}` | Update calendar event (Admin, Teacher own) |
| DELETE | `/api/calendar/{id}` | Delete calendar event (Admin, Teacher own) |
| GET | `/api/v1/clubs` | List clubs |
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/bookings` | List bookings (authenticated) |
| GET | `/api/bookings/{id}` | Get booking by ID (authenticated) |
| PUT | `/api/bookings/{id}/status` | Approve/reject booking (Admin, Teacher) |
| DELETE | `/api/bookings/{id}` | Cancel booking (owner, Admin) |
| GET | `/api/v1/facilities` | List facilities |
| GET | `/api/facilities/{id}` | Get facility details (authenticated) |
| POST | `/api/facilities` | Create facility (Admin only) |
| PUT | `/api/facilities/{id}` | Update facility (Admin only) |
| DELETE | `/api/facilities/{id}` | Delete facility (Admin only) |
| GET | `/api/proposals` | List proposals (authenticated) |
| GET | `/api/proposals/{id}` | Get proposal by ID (authenticated) |
| POST | `/api/proposals` | Submit proposal (OSIS only) |
| PUT | `/api/proposals/{id}` | Update proposal (OSIS own, pending only) |
| DELETE | `/api/proposals/{id}` | Delete proposal (OSIS own, pending only) |
| PATCH | `/api/proposals/{id}/review` | Review proposal (Admin, Teacher only) |
| GET | `/api/v1/elections` | List elections |
| GET | `/api/dashboard` | Dashboard summary (authenticated) |
| GET | `/api/users` | List users (Admin only) |
| GET | `/api/users/{id}` | Get user by ID (Admin only) |
| POST | `/api/users` | Create user (Admin only) |
| PUT | `/api/users/{id}` | Update user (Admin only) |
| PATCH | `/api/users/{id}/status` | Toggle user status (Admin only) |
| DELETE | `/api/users/{id}` | Delete user (Admin only) |
| GET | `/api/materials` | List materials (authenticated) |
| GET | `/api/materials/{id}` | Get material by ID (authenticated) |
| POST | `/api/materials` | Create material (Admin, Teacher) |
| PUT | `/api/materials/{id}` | Update material (Admin, Teacher own) |
| DELETE | `/api/materials/{id}` | Delete material (Admin, Teacher own) |
| GET | `/api/assignments` | List assignments (authenticated) |
| GET | `/api/assignments/{id}` | Get assignment by ID (authenticated) |
| POST | `/api/assignments` | Create assignment (Admin, Teacher) |
| PUT | `/api/assignments/{id}` | Update assignment (Admin, Teacher own) |
| DELETE | `/api/assignments/{id}` | Delete assignment (Admin, Teacher own) |
| POST | `/api/assignments/{id}/submit` | Submit assignment (Student) |
| GET | `/api/assignments/{id}/submissions` | List submissions (Admin, Teacher) |
| GET | `/api/submissions/{id}` | Get submission by ID (authenticated) |
| PUT | `/api/submissions/{id}/grade` | Grade submission (Admin, Teacher own assignment) |
| GET | `/api/notifications` | List notifications (authenticated) |
| GET | `/api/notifications/unread-count` | Get unread count (authenticated) |
| PATCH | `/api/notifications/{id}/read` | Mark notification as read (authenticated) |
| PATCH | `/api/notifications/read-all` | Mark all read (authenticated) |

## Resource Naming

All endpoints use **plural** nouns: `/users`, `/announcements`, `/events`, `/clubs`, `/facilities`, `/bookings`, `/proposals`, `/elections`, `/materials`, `/assignments`, `/submissions`, `/calendar`, `/notifications`, `/facilities`, `/bookings`.

## File Upload Rules

| Context | Formats | Max Size |
|---------|---------|----------|
| Avatar | JPG, PNG, WEBP | 2 MB |
| Announcement | Cover Image, PDF, DOC, DOCX | - |
| Proposal | PDF | 15 MB |

## API Versioning

Breaking changes require a new version (`/api/v2/`). V1 endpoints remain stable.

## User Roles

See [[User Roles]].

## Development Agreement

- Backend maintains endpoint compatibility during V1
- Frontend treats response structure as single source of truth
- No breaking changes without versioning process
- Changes require agreement from both teams

## Related

- [[Authentication]]
- [[Feature - Announcements]]
- [[Feature - Materials]]
- [[Feature - Assignment]]
- [[Feature - School Calendar]]
- [[Feature - Digital Bulletin Board]]
- [[Feature - Notification]]
- [[Feature - Facility Booking]]
- [[User Roles]]
- [[MOC - Backend]]
- [[MOC - Frontend]]
