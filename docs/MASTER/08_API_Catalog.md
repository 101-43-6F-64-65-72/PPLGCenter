# 08 — API Catalog

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Conventions](#1-conventions)
2. [Response Envelope](#2-response-envelope)
3. [Auth Endpoints](#3-auth-endpoints)
4. [User Management](#4-user-management)
5. [Announcements (Mading)](#5-announcements-mading)
6. [Assignments & Submissions](#6-assignments--submissions)
7. [Materials](#7-materials)
8. [Calendar](#8-calendar)
9. [Notifications](#9-notifications)
10. [Dashboard](#10-dashboard)
11. [Facilities & Bookings](#11-facilities--bookings)
12. [Proposals](#12-proposals)
13. [Extracurriculars](#13-extracurriculars)
14. [Attendance](#14-attendance)
15. [Search](#15-search)
16. [Home / Health](#16-home--health)
17. [Frontend Endpoints Expected (not found on backend)](#17-frontend-endpoints-expected-not-found-on-backend)

---

## 1. Conventions

- Base URL: **`/api/...`** (no version segment) — ⚠️ differs from documented `/api/v1`.
- Auth: `Authorization: Bearer <JWT>`.
- Success: HTTP 200 / 201 / 204 with `ApiResponse`.
- Errors: 400/401/404/409/500 with `{ success:false, message }`.
- Paging: `?page=1&pageSize=10` (pageSize clamped 1–100).

**Role tokens used below:** `[Admin]`, `[Teacher]`, `[OSIS]`, `[Student]`, `[Auth]`=any authenticated, `[Public]`=anonymous.

---

## 2. Response Envelope

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

List paging inside `data`:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [ ],
    "page": 1,
    "pageSize": 10,
    "totalCount": 42,
    "totalPages": 5
  }
}
```

---

## 3. Auth Endpoints

| Method | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/login` | Public | `LoginRequest {email, password}` | `LoginResponse {token, fullName, email, role}` |
| GET | `/api/auth/me` | Auth | – | current user |

**LoginRequest** (verified): `email` required+valid ≤256, `password` 6–100.
**LoginResponse** (verified): `token`, `fullName`, `email`, `role`.

⚠️ Frontend posts `{identifier, password}` to `/api/v1/auth/login` → **login broken**. See [06_Authentication](06_Authentication.md).

---

## 4. User Management

| Method | Path | Roles |
|---|---|---|
| GET | `/api/users` | Admin |
| GET | `/api/users/{id}` | Admin |
| POST | `/api/users` | Admin |
| PUT | `/api/users/{id}` | Admin |
| DELETE | `/api/users/{id}` | Admin |

---

## 5. Announcements (Mading)

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/announcements` | Auth (public list?) | paginated feed |
| GET | `/api/announcements/{id}` | Auth | detail incl. comments/reactions |
| POST | `/api/announcements` | Admin/OSIS | create |
| PUT | `/api/announcements/{id}` | Admin/OSIS(own) | update |
| DELETE | `/api/announcements/{id}` | Admin/OSIS(own) | delete |
| POST | `/api/announcements/{id}/comments` | Auth | add comment |
| PUT | `/api/announcements/{id}/comments/{cid}` | author | update comment |
| DELETE | `/api/announcements/{id}/comments/{cid}` | author/Admin | delete comment |
| POST | `/api/announcements/{id}/reactions` | Auth | toggle reaction |

---

## 6. Assignments & Submissions

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/assignments` | Auth | list (filter by class/page?) |
| POST | `/api/assignments` | Teacher | create |
| PUT | `/api/assignments/{id}` | Teacher | update |
| DELETE | `/api/assignments/{id}` | Teacher | delete |
| GET | `/api/assignments/{id}/submissions` | Teacher | list submissions |
| POST | `/api/assignments/{id}/submissions` | Student | submit (past-due & duplicate rejected) |
| GET | `/api/assignments/{id}/submissions/{sid}` | Teacher/owner | view one |
| PUT | `/api/assignments/{id}/submissions/{sid}/grade` | Teacher | set grade/feedback |

---

## 7. Materials

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/materials` | Auth | list, filters `?subject=&page=&grade=` |
| GET | `/api/materials/{id}` | Auth | detail |
| POST | `/api/materials` | Teacher | create |
| PUT | `/api/materials/{id}` | Teacher | update |
| DELETE | `/api/materials/{id}` | Teacher | delete |

---

## 8. Calendar

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/calendar` | Auth | events |
| GET | `/api/calendar/upcoming` | Auth | upcoming events |
| POST | `/api/calendar` | Auth | create (owner) |
| PUT | `/api/calendar/{id}` | owner/Admin | update |
| DELETE | `/api/calendar/{id}` | owner/Admin | delete |

---

## 9. Notifications

| Method | Path | Roles |
|---|---|---|
| GET | `/api/notifications` | Auth |
| GET | `/api/notifications/unread-count` | Auth |
| GET | `/api/notifications/{id}` | Auth |
| PUT | `/api/notifications/{id}/read` | Auth |
| DELETE | `/api/notifications/{id}` | Auth (own) |

---

## 10. Dashboard

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/dashboard` | Admin/OSIS/Teacher | role-specific stats |

Frontend `/admin`, `/guru`, `/osis` dashboards consume this (paths differ → broken).

---

## 11. Facilities & Bookings

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/facilities` | Public/Auth | list + availability |
| GET | `/api/facilities/{id}` | Auth | detail |
| POST | `/api/facilities` | Admin/OSIS | create |
| PUT | `/api/facilities/{id}` | Admin/OSIS | update |
| DELETE | `/api/facilities/{id}` | Admin/OSIS | delete |
| POST | `/api/bookings` | Auth | create with conflict check |
| GET | `/api/bookings` | Auth | list (own/role-scoped) |
| GET | `/api/bookings/{id}` | Auth | detail |
| PUT | `/api/bookings/{id}/status` | Teacher/Admin | approve/reject → 409 on conflict |

⚠️ Frontend uses `PATCH /api/v1/bookings/{id}/status` and `GET /facilities/{id}/slots` → **both 404**.

---

## 12. Proposals

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/api/proposals` | OSIS/Teacher | submit |
| GET | `/api/proposals` | Auth | list (own for students) |
| GET | `/api/proposals/{id}` | Auth | detail |
| PUT | `/api/proposals/{id}/review` | Admin | approve/reject |

**CreateProposalRequest** (verified): `title` 5–300, `description` 10–2000, `fileUrl` ≤500 (all required).
**ReviewProposalRequest** (verified): `status` required, `rejectionReason` ≤1000 optional.

⚠️ Frontend sends `multipart/form-data` (actual file); backend expects JSON `fileUrl`. See [25_Known_Issues](25_Known_Issues.md).

---

## 13. Extracurriculars

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/extracurriculars` | Public | club list |
| GET | `/api/extracurriculars/{id}` | Public | detail |
| POST | `/api/extracurriculars` | Admin/OSIS/Teacher | create |
| PUT | `/api/extracurriculars/{id}` | Admin/OSIS(own) | update |
| DELETE | `/api/extracurriculars/{id}` | Admin/OSIS(own) | delete |
| POST | `/api/extracurriculars/{id}/join` | Auth | student joins |
| POST | `/api/extracurriculars/{id}/leave` | Auth | student leaves |
| GET | `/api/extracurriculars/{id}/members` | Auth | member list |
| DELETE | `/api/extracurriculars/{id}/members/{uid}` | Admin/OSIS | remove member |

⚠️ Frontend calls `/api/v1/clubs` → **404**.

---

## 14. Attendance

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/attendances` | Auth | list (date filters) |
| GET | `/api/attendances/{id}` | Auth | detail |
| POST | `/api/attendances` | Teacher/Admin | record (unique per student/day) |
| PUT | `/api/attendances/{id}` | Teacher/Admin(own) | update |
| DELETE | `/api/attendances/{id}` | Teacher/Admin | delete |

---

## 15. Search

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/api/search?keyword=` | Auth | parallel search across 7 entity types |

---

## 16. Home / Health

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | Public | HomeController probe / welcome |

---

## 17. Frontend Endpoints Expected (not found on backend)

Called by `frontend/src/services/*` but **not implemented** in the backend:

| Endpoint | Frontend service | Backend equivalent |
|---|---|---|
| `GET /api/v1/profile` | `profileService` | none (use `/api/auth/me`) |
| `PUT /api/v1/profile` | `profileService` | none |
| `GET /api/v1/clubs` | `clubService` | `/api/extracurriculars` |
| `GET /api/v1/facilities/{id}/slots` | `facilityService` | none |
| `PATCH /api/v1/bookings/{id}/status` | `facilityService` | `PUT /api/bookings/{id}/status` |
| `POST /api/v1/auth/login` (identifier) | `authService` | `POST /api/auth/login` (email) |

---

*Cross-references: [06_Authentication](06_Authentication.md) · [07_Authorization](07_Authorization.md) · [13_Request_Response_Flow](13_Request_Response_Flow.md) · [docs/API/API Contract.md](../API/API%20Contract.md) · [frontend/docs/api-agreement.md](../frontend/docs/api-agreement.md)*
