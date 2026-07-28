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
| POST | `/api/v1/announcements` | Create announcement |
| GET | `/api/v1/events` | List events |
| GET | `/api/v1/clubs` | List clubs |
| POST | `/api/v1/bookings` | Create booking |
| GET | `/api/v1/facilities` | List facilities |
| POST | `/api/v1/proposals` | Submit proposal |
| GET | `/api/v1/elections` | List elections |

## Resource Naming

All endpoints use **plural** nouns: `/users`, `/announcements`, `/events`, `/clubs`, `/facilities`, `/bookings`, `/proposals`, `/elections`.

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
- [[User Roles]]
- [[MOC - Backend]]
- [[MOC - Frontend]]
