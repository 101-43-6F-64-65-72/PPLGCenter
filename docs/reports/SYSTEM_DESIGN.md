# StudentCenter — System Design

## Data Flow

```
Browser → Nginx (443) → Next.js (3000) → /api/* Rewrite → ASP.NET Core (5051) → PostgreSQL
```

## Database Design

### Core Tables

| Table | Description |
|---|---|
| `Users` | User accounts with roles |
| `Extracurriculars` | Extracurricular activity definitions |
| `ExtracurricularMembers` | User ↔ Extracurricular membership |
| `Facilities` | Bookable facilities and equipment |
| `Bookings` | Facility booking requests |
| `Proposals` | Activity proposals with approval workflow |
| `Announcements` | Mading (school bulletin board) posts |
| `Assignments` | Teacher assignments to extracurriculars |
| `Attendance` | Member attendance records |
| `Materials` | Learning materials per extracurricular |
| `Notifications` | In-app notification events |
| `Calendars` | Scheduled activity calendar entries |

## Approval Workflow

```
Siswa submits Proposal
  → OSIS verifies
    → Guru approves/rejects
      → Admin finalizes
```

## Security Design

| Layer | Mechanism |
|---|---|
| Transport | HTTPS/TLS (Let's Encrypt), HSTS |
| Authentication | JWT HS256, 60min expiry |
| Authorization | ASP.NET Role-based guards |
| Input Validation | FluentValidation / model binding |
| Rate Limiting | ASP.NET RateLimiter middleware |
| SQL Injection | EF Core parameterized queries |
| XSS | Content-Security-Policy header |
| CSRF | SameSite cookie + CORS policy |
| File Upload | MIME validation, 25MB Nginx limit |

## Caching Strategy

| Layer | Strategy |
|---|---|
| Next.js | `fetch` cache + ISR for static pages |
| API | Response Caching middleware (GET endpoints) |
| Browser | Cache-Control headers via Nginx |

## Monitoring Stack

```
Backend (/metrics) → Prometheus (scrape 15s) → Grafana Dashboard
Alert Rules → Alertmanager → Email Notification
```
