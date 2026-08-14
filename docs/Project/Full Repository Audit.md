---
tags:
  - QA
  - audit
  - project
aliases:
  - Full Repository Audit
  - Audit 2026-08
---

# Full Repository Audit — Student Center

**Date**: August 3, 2026
**Auditor**: opencode (automated repository audit)
**Scope**: Entire monorepo (backend .NET 10, frontend Next.js 16, CI/CD, tests, docs, config)
**Method**: Read-only source inspection. **Rule applied: "Never assume / Never hallucinate"** — any statement not provable from repository contents is explicitly marked `Cannot verify from repository`.

---

## 1. Project Overview

| Attribute | Value |
|---|---|
| **Repository name** | StudentCenter |
| **Remote** | `https://github.com/102-43-6F-64-65-72/StudentCenter` |
| **Monorepo** | Yes — `backend/`, `frontend/`, `StudentCenter.Tests/`, `docs/`, `.github/` |
| **Backend** | ASP.NET Core Web API, .NET 10, Clean Architecture (Domain / Application / Infrastructure / Api) |
| **Frontend** | Next.js 16.2.12 (App Router), React 19.2.4, Tailwind CSS 4, TanStack Query, Axios, react-hook-form + zod |
| **Database** | PostgreSQL 10.0.10 (Npgsql) via Supabase Pooler (`aws-0-ap-southeast-1.pooler.supabase.com`) |
| **Domain** | "Student Center" information & services portal for **SMK Negeri 2 Surakarta** |
| **Roles** | `Admin`, `Teacher`, `Student`, `OSIS` |
| **Auth** | JWT (HS256), no refresh tokens |
| **Latest build/tests** | Build PASS; 80/80 tests PASS (Phase 021D) |
| **Git history** | 19 commits, mixed English/Indonesian messages |

### What the system is supposed to do (per `docs/` and `frontend/docs/`)
- Mading/pengumuman digital (digital bulletin board)
- Ekstrakurikuler management (clubs + membership)
- Fasilitas/peminjaman (facility booking with conflict detection)
- Pengajuan proposal kegiatan (proposal approval workflow)
- Tugas/materi (assignments, submissions, grading, materials)
- Absensi (attendance)
- Kalender kegiatan (calendar events)
- Notifikasi (notifications)
- Pencarian (search)
- Dashboard
- **Planned (not implemented):** E-voting/OSIS election (`docs/` roadmap), profile editing with class/major/phone/avatar

---

## 2. Repository Structure

```
StudentCenter/
├── .claudian/            # Claude Code tool config (committed to git)
├── .github/workflows/    # deploy-backend.yml, deploy-frontend.yml (scaffolds only)
├── .obsidian/            # Obsidian vault config + many plugins (committed to git)
├── backend/
│   ├── StudentCenter.slnx            # 5-project solution
│   ├── StudentCenter.Api/            # Controllers (17), Middleware, Program.cs, appsettings*.json
│   ├── StudentCenter.Application/    # DTOs (58 files), service interfaces (18)
│   ├── StudentCenter.Domain/         # Entities (15), Enums (5)
│   └── StudentCenter.Infrastructure/ # AppDbContext, 15 EF configurations, 18 services, 12 migrations, seeder
├── frontend/             # Next.js 16 app (App Router)
│   ├── src/app/          # 11 route pages + providers/layout
│   ├── src/components/   # ~40 components (incl. duplicated home/ set)
│   ├── src/features/     # announcement, auth feature modules
│   ├── src/services/     # 6 API service modules
│   ├── src/contexts/, hooks/, lib/, config/, constants/
│   └── docs/             # api-agreement.md, progres-projek.md, etc.
├── StudentCenter.Tests/  # 8 test files, ~80 tests (xUnit + Moq + FluentAssertions + EF InMemory)
├── docs/                 # Extensive Obsidian-style knowledge base (API, Architecture, Entities, Features, ...)
├── README.md             # 15 bytes — effectively empty
├── AGENTS.md             # 0 bytes — empty
├── opencode.jsonc        # opencode config
└── a.txt, b.txt, c.txt, Untitled.base, package-lock.json  # junk files at repo root
```

---

## 3. Build & Test State

**Status (verified in Phase 021C.1 + 021D):**
- `dotnet build backend/StudentCenter.slnx` → **PASS, 0 errors**
- `dotnet test` → **PASS, 80/80 tests**
- 2 NuGet audit warnings: `NU1903` — `Microsoft.OpenApi 2.0.0` has a known **high-severity** vulnerability (`GHSA-v5pm-xwqc-g5wc`), pulled transitively by `Microsoft.AspNetCore.OpenApi` 10.0.10.

**Test coverage by service (8 files):**

| Test file | Approx. tests | Target |
|---|---|---|
| `AnnouncementServiceTests.cs` | 11 | AnnouncementService |
| `AssignmentServiceTests.cs` | 13 | AssignmentService |
| `ProposalServiceTests.cs` | 15 | ProposalService |
| `NotificationServiceTests.cs` | 13 | NotificationService |
| `SearchServiceTests.cs` | 14 | SearchService |
| `MaterialServiceTests.cs` | 9 | MaterialService |
| `UserServiceTests.cs` | ~4 | UserService (login) |
| `BusinessRulesTests.cs` | ~1+ | business rules smoke |

**Untested services (11/18):** `AnnouncementCommentService`, `AnnouncementReactionService`, `AttendanceService`, `BookingService` (partial per phase notes), `CalendarService`, `DashboardService`, `ExtracurricularService`, `FacilityService`, `JwtService`, `SubmissionService`, `CurrentUserService`. No controller/integration tests. No E2E tests.

**Frontend:** `npm run build` / `npm run lint` not executed during this audit — `Cannot verify from repository` (no prior build logs present; CI does build it but has never been reported passing).

---

## 4. Database & Migration State

- Provider: **Npgsql** (PostgreSQL), `UseIdentityByDefaultColumns`, ProductVersion **10.0.10**.
- **12 migrations** from `20260727054409_InitialCreate` → `20260730081029_AddAttendanceEntity`. All migration files + Designer files + `AppDbContextModelSnapshot.cs` present.
- **15 tables** (`Users`, `Announcements`, `AnnouncementComments`, `AnnouncementReactions`, `Assignments`, `Submissions`, `Materials`, `CalendarEvents`, `Notifications`, `Facilities`, `FacilityBookings`, `Proposals`, `Extracurriculars`, `ExtracurricularMembers`, `Attendances`).
- All `Id` = `uuid` default `gen_random_uuid()`. All audit timestamps `timestamptz` default `now()`.
- **Unique indexes:**
  - `Users.Email` (unique)
  - `AnnouncementReactions(AnnouncementId, UserId)` (unique)
  - `Attendances(StudentId, AttendanceDate)` (unique)
  - `ExtracurricularMembers(ExtracurricularId, StudentId)` (unique)
  - `Submissions(AssignmentId, StudentId)` (unique)
- **Delete behavior:** `Restrict` on all FKs except `ExtracurricularMember → Extracurricular` (`Cascade`). Good design — protects against accidental mass deletion.
- **Seeded default admin:** `admin@studentcenter.id` — password from `DEFAULT_ADMIN_PASSWORD` env var (previously hardcoded `Admin123!` in `SeedAdminData.cs`, created via `MigrateAsync()`).
- `SeedAdminData.cs` runs on every startup (`await SeedAdminData.SeedAsync(app.Services)` in `Program.cs`).
- **User table has no NIS/NISN/NIP/Class/Major/Phone/Avatar fields** — profile data required by the API contract and roadmap does not exist.

---

## 5. API Endpoint Inventory (from controllers)

All routes are **`/api/...` (no `v1` prefix)**. Full matrix extracted from controller attributes:

| Method | Route | Roles | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | Anonymous | Body: email+password (not identifier!) |
| GET | `/api/auth/me` | Authenticated | |
| GET | `/api/announcements` | Authenticated | |
| GET | `/api/announcements/{id:guid}` | Authenticated | |
| POST | `/api/announcements` | Admin,OSIS | |
| PUT | `/api/announcements/{id:guid}` | Admin,OSIS | |
| DELETE | `/api/announcements/{id:guid}` | Admin,OSIS | |
| GET | `/api/announcements/feed` | Authenticated | |
| POST | `/api/announcements/{id:guid}/comments` | Authenticated | |
| GET | `/api/announcements/{id:guid}/comments` | Authenticated | |
| DELETE | `/api/comments/{id:guid}` | Authenticated | owner/Admin only (service) |
| POST | `/api/announcements/{id:guid}/reactions` | Authenticated | "set" semantics, not toggle |
| DELETE | `/api/announcements/{id:guid}/reactions` | Authenticated | |
| GET | `/api/assignments` | Authenticated | |
| GET | `/api/assignments/{id:guid}` | Authenticated | |
| POST | `/api/assignments` | Admin,Teacher | |
| PUT | `/api/assignments/{id:guid}` | Admin,Teacher | |
| DELETE | `/api/assignments/{id:guid}` | Admin,Teacher | |
| POST | `/api/assignments/{id:guid}/submit` | Student | |
| GET | `/api/assignments/{id:guid}/submissions` | Admin,Teacher | |
| GET | `/api/submissions/{id:guid}` | Authenticated | **Any authenticated user** |
| PUT | `/api/submissions/{id:guid}/grade` | Admin,Teacher | |
| GET | `/api/attendance` | Authenticated | **all attendance visible** |
| GET | `/api/attendance/{id:guid}` | Authenticated | |
| GET | `/api/attendance/student/{studentId:guid}` | Authenticated | **any student can query any student** |
| GET | `/api/attendance/date/{date:datetime}` | Authenticated | |
| POST | `/api/attendance` | Teacher,Admin | |
| PUT | `/api/attendance/{id:guid}` | Teacher,Admin | |
| DELETE | `/api/attendance/{id:guid}` | Teacher,Admin | |
| GET | `/api/bookings` | Authenticated | **all bookings visible** |
| GET | `/api/bookings/{id:guid}` | Authenticated | |
| POST | `/api/bookings` | Student,Teacher,OSIS | conflict check → 409 |
| PUT | `/api/bookings/{id:guid}/status` | Admin,Teacher | frontend calls PATCH — mismatch |
| DELETE | `/api/bookings/{id:guid}` | Authenticated | owner/Admin (service) |
| GET | `/api/calendar` | Authenticated | |
| GET | `/api/calendar/upcoming` | Authenticated | |
| GET | `/api/calendar/{id:guid}` | Authenticated | |
| POST | `/api/calendar` | Admin,Teacher | |
| PUT | `/api/calendar/{id:guid}` | Admin,Teacher | owner/Admin (service) |
| DELETE | `/api/calendar/{id:guid}` | Admin,Teacher | owner/Admin (service) |
| GET | `/api/dashboard` | Authenticated | |
| GET | `/api/extracurriculars` | Authenticated | |
| GET | `/api/extracurriculars/{id:guid}` | Authenticated | |
| POST | `/api/extracurriculars` | Admin,Teacher | |
| PUT | `/api/extracurriculars/{id:guid}` | Admin,Teacher | manager/Admin (service) |
| DELETE | `/api/extracurriculars/{id:guid}` | Admin,Teacher | manager/Admin (service) |
| POST | `/api/extracurriculars/{id:guid}/join` | Student | capacity check |
| DELETE | `/api/extracurriculars/{id:guid}/leave` | Student | |
| GET | `/api/extracurriculars/{id:guid}/members` | Authenticated | |
| GET | `/api/facilities` | Authenticated | |
| GET | `/api/facilities/{id:guid}` | Authenticated | |
| POST | `/api/facilities` | Admin | |
| PUT | `/api/facilities/{id:guid}` | Admin | |
| DELETE | `/api/facilities/{id:guid}` | Admin | |
| GET | `/api/materials` | Authenticated | |
| GET | `/api/materials/{id:guid}` | Authenticated | |
| POST | `/api/materials` | Admin,Teacher | |
| PUT | `/api/materials/{id:guid}` | Admin,Teacher | |
| DELETE | `/api/materials/{id:guid}` | Admin,Teacher | |
| GET | `/api/notifications` | Authenticated | |
| GET | `/api/notifications/unread-count` | Authenticated | |
| PATCH | `/api/notifications/{id:guid}/read` | Authenticated | |
| PATCH | `/api/notifications/read-all` | Authenticated | |
| GET | `/api/proposals` | Authenticated | |
| GET | `/api/proposals/{id:guid}` | Authenticated | |
| POST | `/api/proposals` | OSIS | |
| PUT | `/api/proposals/{id:guid}` | OSIS | |
| DELETE | `/api/proposals/{id:guid}` | OSIS | |
| PATCH | `/api/proposals/{id:guid}/review` | Admin,Teacher | |
| GET | `/api/search?q=...` | Authenticated | |
| GET | `/api/users` | Admin | |
| GET | `/api/users/{id:guid}` | Admin | |
| POST | `/api/users` | Admin | |
| PUT | `/api/users/{id:guid}` | Admin | |
| PATCH | `/api/users/{id:guid}/status` | Admin | |
| DELETE | `/api/users/{id:guid}` | Admin | |
| GET | `/` and `/api` | Anonymous | HomeController welcome |

**Total: ~75 endpoints.**

---

## 6. Authentication & Authorization

- **Flow:** `POST /api/auth/login` → `UserService.LoginAsync` looks up by **Email**, verifies with `PasswordHasher<User>` (ASP.NET Core Identity hasher, PBKDF2), checks `IsActive`, returns JWT (HS256) signed with secret from `Jwt:SecretKey`. Claims include `sub`, `nameid`, `email`, `role`, `given_name`, `jti`, `nameidentifier`.
- **JWT validation** in `Program.cs`: issuer, audience, lifetime, signing key all validated. Expiry 60 min. No clock-skew or refresh-token mechanism.
- **Roles in policy:** `Authorize(Roles=...)` strings — `Admin`, `Teacher`, `Student`, `OSIS`. No custom authorization policies.
- **Owner checks** are implemented in services (e.g., comments, calendar events, bookings, extracurriculars) via `userRole != "Admin" && entity.UserId != userId` → `UnauthorizedAccessException` → 401.
- **`CurrentUserService`** reads `sub`/`nameid` claims via `IHttpContextAccessor`.

### Contract/real-world mismatches (auth)
1. **Login identifier:** `api-agreement.md` §3 mandates `identifier` = NIS/NISN (Student) or NIP (Teacher/Admin). Backend `LoginRequest` is `Email` + `Password`. No NIS/NIP fields exist anywhere.
2. **Frontend login expects `user` object:** `AuthContext` looks for `res.data?.user`; `LoginResponse` has no `user` field (only `token/fullName/email/role`) → falls through to `fetchProfile()` → which calls **`GET /profile` (non-existent endpoint)** → 404 → token cleared. **End-to-end login is broken.**

---

## 7. Security Audit

### CRITICAL
1. **Production credentials committed to git (REMOVED).** `backend/StudentCenter.Api/appsettings.json` previously contained a live **Supabase** PostgreSQL connection string (`Host=aws-0-ap-southeast-1.pooler.supabase.com;Port=6543;...;Password=<REDACTED>`) and the **JWT signing secret** (`StudentCenter2026SuperSecretKey...` — `<REDACTED>`). Values were scrubbed from `appsettings.json` in the security hardening pass; both must be rotated in the hosting provider and supplied via `DATABASE_URL` / `JWT_SECRET` environment variables. Anyone with prior repo access could forge JWTs and connect to the production database — **rotate immediately** and purge git history.
2. **Hardcoded default admin password `Admin123!` (FIXED).** `SeedAdminData.cs` no longer hardcodes a password; the initial admin is seeded from the `DEFAULT_ADMIN_PASSWORD` environment variable and only when no admin exists. A strong password must be supplied on first startup.
3. **JWT stored in `localStorage` AND mirrored to a non-HttpOnly cookie** (`frontend/src/lib/api.js` `setStoredToken` writes `document.cookie = "auth_token=...; path=/; max-age=86400; SameSite=Strict"`; `Secure` flag added in production). XSS = full account takeover. The `middleware.js` cookie check does not decode/verify the JWT (acknowledged in code comment). Recommended follow-up: HttpOnly-cookie- or `Authorization`-header-only session handling.

### HIGH
4. **Broken access control (IDOR) on read endpoints (FIXED).** Previously any authenticated user could list/view *all* attendance (`GET /api/attendance`, `/student/{id}`, `/date/{date}`), all bookings, and any submission by id (`GET /api/submissions/{id}`) with no ownership filter. Now non-admin/teacher callers are scoped to their own records in `AttendanceService`, `BookingService`, `SubmissionService`, and `ProposalService`, and admin-only list endpoints are locked down with role attributes.
5. **`AuthGuard` bypassed in development** — `frontend/src/components/layout/AuthGuard.jsx:19` returns children immediately when `NODE_ENV === "development"`.
6. **Known high-severity NuGet CVE** — `Microsoft.OpenApi 2.0.0` (`NU1903`, GHSA-v5pm-xwqc-g5wc).

### MEDIUM
7. **Booking conflict detection is check-then-insert with no DB constraint** → TOCTOU race: two concurrent bookings for the same slot can both pass the `AnyAsync` check.
8. **No rate limiting** on login endpoint → brute-force risk (mitigated only by password hashing).
9. **CORS ProductionPolicy** falls back to placeholder `https://studentcenter.example.com` if `AllowedOrigins:Production` is unset → production may silently break or be misconfigured.
10. **No input sanitization needed for EF (parameterized queries — good), but `SearchService`/`AnnouncementService` use `ToLower().Contains()`** — fine, but string filters on indexed columns cannot use indexes (full scan).
11. **`Trust Server Certificate=true`** in the connection string disables certificate validation for the Postgres TLS channel.

---

## 8. Frontend State

**Stack:** Next.js 16.2.12 (App Router, `reactCompiler` experimental), React 19.2.4, Tailwind v4, `@tanstack/react-query`, `axios` (with a `NativeFetchClient` fallback), `react-hook-form` + `zod`, `lucide-react`, `motion`.

**Pages (`src/app/`):** `/`, `/login`, `/profile`, `/admin`, `/guru`, `/osis`, `/mading`, `/mading/[id]`, `/ekstrakurikuler`, `/fasilitas`, `/proposal`.

**Role dashboards:** `admin/`, `guru/`, `osis/` panels with per-role tabs (`AdminAnnouncementsTab`, `AdminProposalTab`, `AdminFacilityTab`, `AdminStatCards`, `Guru*`, `Osis*`).

**Services (6):** `authService`, `announcementService`, `clubService`, `facilityService`, `proposalService`, `profileService` — all call API routes via the shared `lib/api.js` client.

**Key frontend findings:**
1. **API base URL mismatch.** `API_CONFIG.BASE_URL` defaults to `"/api/v1"`. Backend exposes `api/...` (no `v1`). No Next.js `rewrites`/proxy configured in `next.config.mjs` → every request to the default base URL hits the Next server and 404s unless `NEXT_PUBLIC_API_BASE_URL` points at a gateway that rewrites `/v1`.
2. **`/profile` endpoint does not exist** on the backend (`profileService` → `GET /profile`). `GET /api/auth/me` exists but is not wired.
3. **`clubService` → `GET /clubs`** and `/clubs/{id}` — backend route is `/api/extracurriculars`; **no `/clubs` endpoint exists**.
4. **`facilityService.getFacilitySlots` → `GET /facilities/{id}/slots`** — **no such endpoint** on backend.
5. **`facilityService.getFacilities` expects `{ places, items }`** — backend returns a paged `FacilityResponse` list. Shape mismatch.
6. **`updateBookingStatus` uses PATCH `/bookings/{id}/status`** — backend is **PUT** `/api/bookings/{id}/status`.
7. **`proposalService.createProposal` sends `multipart/form-data` with a File** — backend `CreateProposalRequest` is a JSON body with a `FileUrl` string; **no file upload handling exists** on the backend at all (no IFormFile, no storage service).
8. **`apiClient` double-unwrap risk** — axios interceptor returns `response.data`; services then also read `response.data`, creating fragile assumptions about shape.
9. **Duplicated components:** `ExtracurricularCollage.jsx`, `ExtracurricularSection.jsx`, `MadingSection.jsx`, `MadingCollage.jsx` exist both at `src/components/` root and in `src/components/home/`. Dead/redundant copies.
10. **Login redirect loop risk** (see §6 mismatch #2).
11. `next.config.mjs` `images.remotePatterns` only allow `picsum.photos`, `images.unsplash.com`, `placehold.co` — production cover images from other hosts would fail.
12. `src/app/layout.js` and `providers.jsx` set up React Query + AuthContext (read in Phase audit).

**Frontend docs claim 38% frontend progress** (`frontend/docs/progres-projek.md`, dated 31 Jul 2026) — clearly a planning snapshot; the codebase has since grown substantially. That doc's "backend 12%" is now outdated.

---

## 9. Backend Business Logic (Services — 18)

All services are thin wrappers over `AppDbContext` (EF Core), with `AsNoTracking()` on reads, paging clamped to `page>=1`, `1<=pageSize<=100`, and `DataAnnotations` validation on DTOs.

| Service | Purpose | Notes |
|---|---|---|
| `UserService` | login, CRUD users, status toggle | Login by email only; password via Identity `PasswordHasher` |
| `JwtService` | token generation | HS256, claims incl. role; secret from config |
| `AnnouncementService` | madin CRUD + feed | paged, search by category |
| `AnnouncementCommentService` | comments | owner/Admin delete guard |
| `AnnouncementReactionService` | reactions | **"set" not "toggle"** — removes existing then always inserts |
| `NotificationService` | create/read notifications | used by BookingService on approve/reject |
| `FacilityService` | facility CRUD | Admin-only writes (controller) |
| `BookingService` | booking + conflict check + approve/reject | conflict → `InvalidOperationException` → **409** (contract says 422) |
| `MaterialService` | material CRUD | |
| `AssignmentService` | assignment CRUD | |
| `SubmissionService` | submit + grade | unique (assignment,student) |
| `CalendarService` | events CRUD + upcoming | owner/Admin guard |
| `DashboardService` | counts + latest announcements | parallel `Task.WhenAll` |
| `ProposalService` | proposal CRUD + review | status workflow |
| `ExtracurricularService` | club CRUD + join/leave/members | capacity + role checks |
| `SearchService` | global search | announcements/materials/... |
| `AttendanceService` | attendance CRUD | unique (student,date) |
| `CurrentUserService` | claims extraction | |

**Pattern gaps:** no repository layer (services hit DbContext directly — acceptable for this size but noted); no Unit of Work; no MediatR/CQRS (not required); duplicated paging clamp logic across every service (could be a shared helper).

---

## 10. Data Integrity & EF Configuration

- 15 `*Configuration.cs` files map all entities with fluent config (max lengths, defaults, unique indexes).
- Enum columns: `UserRole`, `BookingStatus`, `AttendanceStatus`, `ProposalStatus`, `NotificationType` stored as **`integer`** (not strings).
- `UpdatedAt` default is `now()` but is **always set manually** on writes — fine.
- Notable: `Proposal.ReviewedAt`/`ReviewedByUserId` nullable; `FacilityBooking.ApprovedOrRejectedByUserId` nullable.
- **Missing DB-level constraint for booking overlap** (only app-level check).
- `Submissions.Score` is `int?` unconstrained (negative scores possible); `MaxScore` int unconstrained.

---

## 11. Performance Analysis

- **Good:** `AsNoTracking()` on all reads; paging at DB level; targeted indexes on filter/sort columns; `DashboardService` parallelizes 5 queries via `Task.WhenAll`.
- **Concerns:**
  - `ExtracurricularService` computes `CurrentMembers = e.Members.Count` inside projection → a correlated subquery per row (per-page cost, acceptable but grows).
  - String `Contains` filters (search, user search, category) prevent index usage.
  - `SearchService` may run multiple like-queries across tables (no FTS/trigram).
  - No pagination on dashboard latest announcements (`Take(5)` fixed — fine).
  - No caching layer (Redis/in-memory) anywhere.
  - Connection string sets `Pooling=false` — **each request may open a new connection** (reduces throughput under load; verify intention).
  - Frontend: TanStack Query is configured but **not all data flows through it** (many services use ad-hoc axios calls).

---

## 12. Error Handling

- Global `ExceptionHandlingMiddleware` (registered early, before controllers):
  - `ValidationException` → **400**
  - `UnauthorizedAccessException` → **401**
  - `ArgumentException` → **400**
  - `InvalidOperationException` → **409 Conflict**
  - `KeyNotFoundException` → falls to generic `catch` → **500** ⚠️ (should be 404)
  - status-code passthrough for 401/403/404 produced by auth middleware
  - Generic `Exception` → **500** with sanitized message
- All controllers return `ApiResponse<T>` (`success`, `message`, `data`).
- **Contract gap:** `api-agreement.md` defines **422** for business-rule failures (booking conflict, quota full). Backend returns **409** (InvalidOperationException) — no 422 path exists (`UnprocessableEntity` case in middleware is never triggered).
- **`KeyNotFoundException` is not mapped to 404** — "not found" cases that throw (e.g., `Facility not found`, `Announcement not found`) produce a 500 instead of 404.

---

## 13. Validation

- **Backend:** `DataAnnotations` on request DTOs (`[Required]`, `[EmailAddress]`, `[MaxLength]`, `[MinLength]`) → auto 400. Domain-level checks done in services (`InvalidOperationException`/`ValidationException`).
- **Frontend:** zod schemas + react-hook-form (`features/auth/schemas/loginSchema.js`). `loginSchema` validates identifier/password.
- **Gaps:** No FluentValidation; no model-level validation for score ranges; `UpdateBookingStatusRequest` allows any int cast to enum.

---

## 14. Testing

- 8 files, ~80 tests, all passing. Moq + FluentAssertions + EF InMemory (10.0.10) + `Microsoft.EntityFrameworkCore.Relational` for InMemory + Npgsql compatibility.
- Coverage: 7 of 18 services. **No tests** for: comments, reactions, attendance, calendar, dashboard, extracurricular, facility, bookings, jwt, submissions, controllers, middleware, frontend.
- No `coverlet` coverage report in repo — `Cannot verify` actual coverage percentage.
- No frontend tests (no vitest/jest/playwright in `package.json`).

---

## 15. Technical Debt (prioritized)

| # | Severity | Item |
|---|---|---|
| 1 | CRITICAL | Real DB + JWT secrets committed to git (see §7) |
| 2 | CRITICAL | Frontend↔backend integration is broken on several contracts (§6, §8) — login, `/profile`, `/clubs`, `/facilities/{id}/slots`, PATCH vs PUT, `/api/v1` prefix, multipart proposal upload |
| 3 | HIGH | GitHub Actions builds with **.NET 8.0.x** while projects target **net10.0** → CI build will fail |
| 4 | HIGH | `docs/` plan features (e-voting, profile class/major/phone/avatar, calendar "upcoming", search) partially unimplemented on backend |
| 5 | MEDIUM | Root junk files: `a.txt`, `b.txt`, `c.txt`, `Untitled.base`, stray root `package-lock.json` |
| 6 | MEDIUM | `.claudian/`, `.obsidian/` (with bundled plugins) committed to git |
| 7 | MEDIUM | `README.md` (15 B) and `AGENTS.md` (0 B) empty |
| 8 | MEDIUM | Duplicated frontend components (`components/` vs `components/home/`) |
| 9 | MEDIUM | `KeyNotFoundException` → 500 instead of 404; business errors → 409 instead of 422 |
| 10 | MEDIUM | `ReactionService` "toggle" semantics confusing |
| 11 | MEDIUM | IDOR on attendance/bookings/submissions reads |
| 12 | LOW | Mixed-language commit messages; no conventional commits |
| 13 | LOW | `AuthGuard` dev bypass; `middleware.js` cookie check only |
| 14 | LOW | `NEXT_PUBLIC_*` default base URL `/api/v1` with no dev proxy |

---

## 16. CI/CD

- **`deploy-backend.yml`:** trigger `push` to `main` (paths `backend/**`). Steps: checkout → setup-dotnet **`8.0.x`** → `dotnet restore` → `dotnet build --configuration Release`. **Issues:** (a) .NET version mismatch (net10.0), (b) **no test step**, (c) **no deployment step** (placeholder comment), (d) no secrets wired (DB/JWT would still be read from committed appsettings).
- **`deploy-frontend.yml`:** trigger on `frontend/**`. Steps: checkout → node 20 → `npm ci` → `npm run build` with `NEXT_PUBLIC_API_BASE_URL` secret. **No deploy step**, no lint/test.
- No Dockerfile, docker-compose, or `MONOREPO_DEPLOYMENT_GUIDE.md` compliance verified in code — `Cannot verify` actual deployment; guide doc exists in `docs/` only.

---

## 17. Code Quality & Standards

- Clean Architecture respected: Domain has no references; Application references only Domain; Infrastructure references Domain+Application; Api references all (verified from csproj graph).
- Consistent response wrapper (`ApiResponse<T>`), consistent service naming, consistent DTO naming (`Create*Request`, `Update*Request`, `*Response`).
- English code/comments; Indonesian only in docs/commit messages.
- `#nullable` enabled; navigation properties use `= null!`.
- Async/await used correctly (no sync-over-async in services reviewed).
- Minor: `_logger` injected but barely used; a few unused usings; `userRole` string comparison instead of enum in owner checks.

---

## 18. Dependency Audit

**Backend NuGet (verified from csproj files in Phase 021D):**
- Api: `Swashbuckle.AspNetCore` 6.6.2, `Microsoft.AspNetCore.OpenApi` 10.0.10, `Microsoft.EntityFrameworkCore.Tools` 10.0.10
- Infrastructure: `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3, `Microsoft.EntityFrameworkCore` 10.0.10, `Microsoft.EntityFrameworkCore.Design` 10.0.10, `Microsoft.Extensions.Configuration.Abstractions` 10.0.10, `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.10
- Tests: `Microsoft.EntityFrameworkCore.InMemory` 10.0.10, `Microsoft.EntityFrameworkCore.Relational` 10.0.10, `Moq` 4.20.72, `FluentAssertions` 8.10.0, `xunit` 2.9.3, `xunit.runner.visualstudio` 3.1.4, `coverlet.collector` 6.0.4, `Microsoft.NET.Test.Sdk` 17.14.1
- **2 × NU1903** (Microsoft.OpenApi 2.0.0 — high severity)

**Frontend npm:** `next@16.2.12`, `react@19.2.4`, `axios@1.7.9`, `@tanstack/react-query@5.66.0`, `react-hook-form@7.54.2`, `zod@3.24.2`, `motion@12.4.3`, `lucide-react@0.475.0`; dev: `tailwindcss@4`, `eslint@9`, `eslint-config-next@16.2.12`, `@tailwindcss/postcss@4`, `babel-plugin-react-compiler@1.0.0`.
- Note: `motion` is in `dependencies` but `login/page.js` has a `require("framer-motion")` fallback — `framer-motion` is **not** in `package.json`. `Cannot verify` whether the fallback path is ever taken (motion exists).

---

## 19. Compliance with Project Docs

- **`docs/` knowledge base is rich** (ERD, schema, migrations, feature/entity docs, API contract, deployment guide, glossary, roadmap, daily log) but is **ahead of the code** in several places (e-voting, profile fields, 422 semantics, `/api/v1` prefix).
- **`frontend/docs/api-agreement.md`** (frozen V1): backend violates the `/api/v1/` prefix, `identifier` login, 422 business errors, and "plural resource naming" is mostly OK.
- `frontend/docs/backend-sync-agreement.md`, `component-agent.md`, `frontend-architect.md`, `project-context.md`, `student-center.md` exist but were not fully cross-validated — `Cannot verify` full compliance.

---

## 20. Observations & Risks

- The backend is a solid, buildable Clean-Architecture skeleton with good EF discipline and a real test suite.
- The biggest risk is **integration**: the frontend and backend were evidently built against the *planned* contract, not the *implemented* contract. Several endpoints/payload shapes differ.
- The **secrets exposure is the single most urgent action** (rotate DB password + JWT secret, scrub git history, move to env vars).
- CI currently cannot build the backend as written (net10.0 vs .NET 8.0.x).
- No environment separation for DB (single `postgres` database via Supabase pooler in committed config).

---

## 21. Unknowns (not verifiable from repository)

- Actual deployed environment, live domain, and whether the committed Supabase credentials are still valid.
- Real production data volume; whether `__EFMigrationsHistory` has been applied to the live DB.
- Whether `NEXT_PUBLIC_API_BASE_URL` is configured in the deployed frontend and how `/api/v1` is routed to the backend.
- Whether the frontend has ever been built successfully in CI (`npm run build` result not recorded in repo).
- Actual test coverage percentage (no coverage report artifact).
- Whether `framer-motion` fallback is ever exercised.
- Real intent of the `a.txt`/`b.txt`/`c.txt`/`Untitled.base` files.
- Whether the Obsidian vault / `.claudian` are intentionally shared via git.
- The GitHub Actions run history (secrets, success/failure).

---

# FINAL Executive Summary

**Overall assessment: Backend is Release-Candidate quality in isolation (89/100 health, Phase 021D). The monorepo as an integrated product is NOT deployable as-is.**

| Dimension | Verdict |
|---|---|
| Backend build & tests | ✅ PASS (80/80) |
| Backend architecture | ✅ Strong Clean Architecture, good EF discipline |
| **Security** | ❌ **CRITICAL — live DB credentials + JWT secret committed to git** |
| **Frontend↔Backend integration** | ❌ **Broken on multiple contracts (login, /profile, /clubs, /slots, PATCH/PUT, /api/v1, file upload)** |
| CI/CD | ⚠️ Scaffolds only; backend CI uses wrong .NET version; no deploy steps |
| Documentation | ✅ Extensive (`docs/` knowledge base) but ahead of code |
| Test coverage | ⚠️ 7/18 services; no controller/frontend/E2E tests |

**Top 5 actions, in order:**
1. **Rotate and externalize secrets.** Change the Supabase DB password and JWT secret; move both to environment variables/secrets; remove `appsettings.json` secrets from git history.
2. **Fix the backend↔frontend contract.** Either add `v1` routing (or reverse-proxy rewrite), add `/api/auth/me`→`/profile` wiring, add `/clubs`→`/extracurriculars` alias or update frontend, implement `/facilities/{id}/slots`, align PATCH→PUT for booking status, and implement actual file upload.
3. **Fix CI.** Bump `deploy-backend.yml` to `dotnet-version: '10.0.x'`; add `dotnet test`; implement actual deployment steps for both workflows.
4. **Fix IDOR + error semantics.** Scope attendance/bookings/submissions reads to owner or role; map `KeyNotFoundException`→404 and business errors→422 per the frozen contract.
5. **Clean up debt:** remove junk root files, empty README/AGENTS, duplicate components, and decide on `.obsidian`/`.claudian` tracking.

---

# Project Knowledge Base

## A. Project Dictionary
- **Mading** — digital bulletin board (announcements with comments & reactions).
- **Ekskul** — extracurricular club (`Extracurricular` + `ExtracurricularMember`).
- **Pembina** — teacher/advisor of a club (modeled as `ManagedByUserId`, no separate role).
- **Waka Kesiswaan** — vice-principal for student affairs (mapped to `Admin` role in practice).
- **OSIS** — student organization council (a `UserRole`).
- **NIS/NISN/NIP** — student/teacher identity numbers referenced by the API contract but **not modeled**.
- **`auth_token`** — JWT cookie name used by frontend middleware.

## B. Architecture Guide
- Clean Architecture, 4 projects: `Domain` (entities+enums) → `Application` (DTOs + service interfaces) → `Infrastructure` (DbContext, EF configs, services, migrations) → `Api` (controllers, middleware, `ApiResponse<T>`).
- DI: all scoped, registered in `Program.cs`. JWT bearer + role-based authorization. Global exception middleware. CORS policies by environment. Health check at `/health`. Swagger in Development only (route prefix = root).

## C. Entity Catalog (15)
`User`, `Announcement`, `AnnouncementComment`, `AnnouncementReaction`, `Assignment`, `Submission`, `Material`, `CalendarEvent`, `Notification`, `Facility`, `FacilityBooking`, `Proposal`, `Extracurricular`, `ExtracurricularMember`, `Attendance`. Enums: `UserRole`, `BookingStatus`, `AttendanceStatus`, `ProposalStatus`, `NotificationType`.

## D. API Catalog
See §5 endpoint matrix (~75 endpoints under `/api/*`). Response wrapper `ApiResponse<T>`.

## E. Feature Catalog
Authentication, Users, Mading (announcements+comments+reactions), Assignments/Submissions, Materials, Calendar, Attendance, Facility Booking, Proposals, Extracurricular, Notifications, Search, Dashboard. Not implemented: E-voting, profile self-service.

## F. Folder Map
See §2 tree.

## G. Coding Standards
English naming, `Async` suffix, DTOs named `Create*/Update*/Review*`, response DTOs `*Response`, `AsNoTracking()` reads, paging clamp (page≥1, 1≤pageSize≤100), `ApiResponse<T>`, service owner-checks, DataAnnotations validation, EF fluent configurations.

## H. Dependency Graph
```
Api ──> Application ──> Domain
  │          │
  │          └──> Infrastructure ──> Domain, Application, Npgsql, EF Core
  └──> Infrastructure (via DI registrations)
```
Domain references nothing. Tests reference Infrastructure + Application (+ Moq/FluentAssertions/InMemory).

## I. Business Rule Catalog
- Booking conflict → cannot create overlapping booking for same facility (excluding Rejected) — returns 409 (contract: 422).
- Only Pending bookings can be approved/rejected; only Approved/Rejected transitions allowed.
- Only students can join clubs; cannot exceed `MaxMembers`; cannot double-join.
- One reaction per user per announcement (unique index).
- One attendance row per (student, date).
- One submission per (assignment, student).
- Owner/Admin guard for comments, calendar events, bookings, club edits.
- Inactive accounts cannot log in (403).
- Admin seeded from `DEFAULT_ADMIN_PASSWORD` env var.

## J. Development Workflow
Backend: edit service → write xUnit test → `dotnet test` → `dotnet build`. No frontend test workflow. Docs expect parallel feature development against the frozen API contract (`frontend/docs/api-agreement.md`). No lint/format enforced for backend; frontend has `npm run lint` (eslint 9).

## K. Deployment Workflow
Intended: GitHub Actions on push to `main` (`backend/**` or `frontend/**`), build/restore, then (currently unimplemented) deploy to a host. See `docs/MONOREPO_DEPLOYMENT_GUIDE.md`. **CI backend build uses .NET 8.0.x and will fail against net10.0.**

## L. Debugging Guide
- Run API: `dotnet run --project backend/StudentCenter.Api`; Swagger at `/` in Development; health at `/health`.
- Run frontend: `npm run dev` in `frontend/`; must set `NEXT_PUBLIC_API_BASE_URL` to a reachable backend (default `/api/v1` has no local proxy).
- Check `docs/Logs/Daily Log.md` for historical context.
- Common failure: 404s from frontend calling non-existent `/profile`, `/clubs`, `/facilities/{id}/slots`.

## M. Common Pitfalls
- Expecting `/api/v1` prefix — backend uses `/api`.
- `KeyNotFoundException` → 500 (not 404).
- `InvalidOperationException` → 409 (not 422 per contract).
- Login by Email, not NIS/NISN.
- `LoginResponse` has no `user` object — AuthContext's fallback to `/profile` breaks login.
- `SearchService`/filters with `Contains` can't use indexes.
- `Pooling=false` in the committed connection string.

## N. Future Roadmap (from `docs/Project/Roadmap.md` + frontend docs)
- E-voting / OSIS election (anonymous, encrypted vote)
- Profile editing (name, class, major, phone, avatar upload)
- Interactive school calendar
- Full file upload support (announcement covers/PDF, proposal PDF ≤15MB per contract)
- Approval workflow refinement (Pembina → Waka Kesiswaan)
- Real deployment automation
- Rotate/externalize secrets (security prerequisite)
