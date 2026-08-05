# StudentCenter — API Reference

**Base URL:** `http://localhost:5051/api` (dev) | `https://studentcenter.smkn2surakarta.sch.id/api` (prod)  
**Auth:** `Authorization: Bearer <JWT>`  
**Format:** JSON  

---

## Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | ❌ | Login, returns JWT |
| POST | `/auth/register` | ❌ | Register new user |
| GET | `/auth/me` | ✅ | Get current user |

## Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| GET | `/users/{id}` | Admin | Get user by ID |
| PUT | `/users/{id}/role` | Admin | Update user role |
| DELETE | `/users/{id}` | Admin | Delete user |

## Announcements (Mading)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/announcements` | ✅ | List announcements (paginated) |
| GET | `/announcements/{id}` | ✅ | Get single announcement |
| POST | `/announcements` | Admin | Create announcement |
| PUT | `/announcements/{id}` | Admin | Update announcement |
| DELETE | `/announcements/{id}` | Admin | Delete announcement |

## Facilities

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/facilities` | ✅ | List facilities |
| GET | `/facilities/{id}` | ✅ | Get facility |
| POST | `/facilities` | Admin | Create facility |
| PUT | `/facilities/{id}` | Admin | Update facility |

## Bookings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/bookings` | ✅ | List bookings |
| POST | `/bookings` | ✅ | Create booking request |
| PUT | `/bookings/{id}/approve` | Guru/Admin | Approve booking |
| PUT | `/bookings/{id}/reject` | Guru/Admin | Reject booking |

## Proposals

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/proposals` | ✅ | List proposals |
| POST | `/proposals` | OSIS | Submit proposal |
| PUT | `/proposals/{id}/verify` | OSIS | OSIS verify |
| PUT | `/proposals/{id}/approve` | Guru | Teacher approve |
| PUT | `/proposals/{id}/finalize` | Admin | Admin finalize |

## Extracurriculars

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/extracurriculars` | ✅ | List extracurriculars |
| GET | `/extracurriculars/{id}` | ✅ | Get extracurricular |
| POST | `/extracurriculars` | Admin | Create |
| PUT | `/extracurriculars/{id}` | Admin | Update |

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | ❌ | Overall health status |
| GET | `/ready` | ❌ | Readiness probe |
| GET | `/live` | ❌ | Liveness probe |
| GET | `/metrics` | ❌ | Prometheus metrics |

## Errors (RFC 7807 ProblemDetails)

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or missing authentication token.",
  "traceId": "00-abc123..."
}
```
