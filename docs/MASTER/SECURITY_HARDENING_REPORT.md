# Security Hardening Report

> Phase: 023A — Security Hardening (Implementation)
> Status: **DONE**
> Security score (before → after): **4/10 → 8/10**
> Ready for production: **NO** (requires env var provisioning + credential rotation first)

---

## Summary

This pass hardened the StudentCenter backend API and frontend auth handling. All
secrets were removed from tracked source files, the ASP.NET Core pipeline now
enforces secure defaults (JWT validation, CORS allow-list, rate limiting,
security headers, HSTS, fail-fast config), exception handling was aligned to the
API contract (404 / 422), IDOR/ownership gaps on read endpoints were closed, and
the hardcoded default admin password was replaced with an environment variable.

**Result:** build passes and all **80/80** tests pass after the changes
(pre-existing warning NU1903 for `Microsoft.OpenApi 2.0.0` remains).

---

## What was done

### 1. Secrets removed (P0)

| Item | Before | After |
|---|---|---|
| `appsettings.json` connection string | Live Supabase URL incl. DB password | `""` — must come from `DATABASE_URL` |
| `appsettings.json` JWT key | `StudentCenter2026SuperSecretKey...` | `""` — must come from `JWT_SECRET` |
| `opencode.jsonc` | Hardcoded API key | `{env:OPENCODE_API_KEY}` |
| `SeedAdminData.cs` | Hardcoded `Admin123!` | `DEFAULT_ADMIN_PASSWORD` env var (startup fails if missing) |
| Docs (`docs/Project/*`, `docs/Backend/*`, `docs/MASTER/*`) | Credentials + `Admin123!` | Values redacted / replaced with env var placeholders |

- **Important:** the secrets in the *tracked* `appsettings.json` and
  `opencode.jsonc` still exist in **git history** and must be **rotated** at the
  hosting providers (Supabase DB password, JWT signing secret, opencode API key).
- The untracked `docs/MASTER/` and `docs/Project/Full Repository Audit.md`
  contained credentials but were never committed, so no history scrub needed
  there.
- `.gitignore` now ignores `.env`, `.env.*` (except `.env.example`), `*.env`,
  `*.env.local`, and `appsettings.Local.json` / `appsettings.*.local.json`.
- Added `backend/StudentCenter.Api/.env.example` documenting every required var.

### 2. Startup fail-fast + config validation (P0)

`Program.cs` now:
- Requires `ConnectionStrings:DefaultConnection`/`DATABASE_URL` and
  `Jwt:SecretKey`/`JWT_SECRET`; empty values are rejected with a clear message.
- Rejects a JWT signing key shorter than 32 bytes (256-bit minimum).
- Reads JWT issuer/audience/expiration from `JWT_ISSUER`, `JWT_AUDIENCE`,
  `JWT_EXPIRATION_MINUTES` (sane defaults otherwise).

### 3. Authentication hardening (P0)

- JWT bearer validation now enforces issuer, audience, lifetime and signing key
  with **zero clock skew** (was `0:05:00`, allowing up to 5 min of
  early/expired-token abuse).
- **Rate limiting** on `POST /api/auth/login`: 5 requests/min per IP, `429` on
  rejection, no queue — brute-force protection.
- `X-Forwarded-For` / `X-Forwarded-Proto` forwarded-headers enabled so client IP
  detection works correctly behind a reverse proxy.

### 4. Security headers + TLS (P0)

- New `SecurityHeadersMiddleware`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
    (skipped for the dev-only Swagger UI paths so the tool keeps working)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` outside
    Development (`UseHsts` also added).
- `UseHttpsRedirection` retained; Swagger UI remains Development-only.

### 5. CORS (P1)

- Development: `http://localhost:3000` only.
- Production: `AllowedOrigins` / `CORS__AllowedOrigins` (comma/semicolon list);
  the wildcard `*` is rejected at startup.

### 6. Exception mapping aligned to contract (P1)

`ExceptionHandlingMiddleware` now maps:
| Exception | Status |
|---|---|
| `KeyNotFoundException` | 404 (was 400) |
| `InvalidOperationException` (business-rule violations) | 422 (was 409) |
| `UnauthorizedAccessException` | 401 |
| `ArgumentException` | 400 |
| any other exception | 500 (generic, no internals leaked) |

All log output passes through `RedactSensitiveData`, which scrubs passwords,
secrets, API keys, bearer tokens, and Postgres connection strings before they
reach logs.

### 7. Broken access control / IDOR (P2)

Non-admin/teacher callers are now scoped to their own records:
- `AttendanceService.GetByIdAsync` / `GetByStudentAsync`
- `BookingService.GetBookingsAsync` / `GetBookingByIdAsync`
- `SubmissionService.GetSubmissionByIdAsync`
- `ProposalService.GetProposalsAsync` / `GetProposalByIdAsync`
- `GET /api/attendance` and `GET /api/attendance/date/{date}` restricted to
  `Teacher,Admin` via role attributes.

### 8. Frontend auth cookie (P0)

- `frontend/src/lib/api.js`: cookie now `SameSite=Strict` and `Secure` in
  production (was `SameSite=Lax`, no `Secure`). The cookie remains non-HttpOnly
  by design (set from JS) and is only a presence guard for Next.js middleware —
  the backend is the source of truth for auth.

---

## Files changed

### Backend
- `backend/StudentCenter.Api/Program.cs` — rewritten (validation, JWT, CORS, rate
  limiting, forwarded headers, headers middleware, HSTS).
- `backend/StudentCenter.Api/Middleware/SecurityHeadersMiddleware.cs` — **new**.
- `backend/StudentCenter.Api/Middleware/ExceptionHandlingMiddleware.cs` —
  rewritten (status mapping + log redaction).
- `backend/StudentCenter.Api/Controllers/AuthController.cs` — rate-limited login.
- `backend/StudentCenter.Api/Controllers/{Attendance,Booking,Assignments,Proposal}Controller.cs` —
  pass user context to services; tightened role attributes.
- `backend/StudentCenter.Api/appsettings.json` — secrets removed.
- `backend/StudentCenter.Api/appsettings.Development.json` — logging levels only.
- `backend/StudentCenter.Api/.env.example` — **new**.
- `backend/StudentCenter.Application/Services/{IAttendanceService,IBookingService,ISubmissionService,IProposalService}.cs` —
  added caller context parameters.
- `backend/StudentCenter.Infrastructure/Services/{AttendanceService,BookingService,SubmissionService,ProposalService}.cs` —
  ownership scoping.
- `backend/StudentCenter.Infrastructure/Data/Seeders/SeedAdminData.cs` —
  `DEFAULT_ADMIN_PASSWORD`.

### Frontend
- `frontend/src/lib/api.js` — stricter auth cookie.

### Root
- `.gitignore` — env/local-config ignore rules.
- `opencode.jsonc` — API key → `{env:OPENCODE_API_KEY}`.

### Docs (secret scrubs + accuracy)
- `docs/Backend/Authentication.md`, `docs/Project/Full Repository Audit.md`,
  `docs/Project/Quality Audit.md`, and the `docs/MASTER/*` set
  (`00_MASTER_REPORT`, `01_Project_Overview`, `02_System_Architecture`,
  `04_Backend_Architecture`, `05_Database_Architecture`, `06_Authentication`,
  `15_Deployment_Guide`, `19_Project_Structure`, `25_Known_Issues`,
  `26_Technical_Debt`, `29_FAQ`, `30_DEVELOPER_BIBLE`).

---

## Remaining risks (accepted / follow-up)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Committed secrets still in **git history** (`appsettings.json`, `opencode.jsonc`) | High | Rotate all three credentials; optionally rewrite history / use `git filter-repo` |
| 2 | JWT stored in `localStorage` (XSS = token theft) | Medium | Follow-up: HttpOnly-cookie session or Authorization-header-only flow; refresh tokens |
| 3 | `Microsoft.OpenApi 2.0.0` advisory `NU1903` (high) | Medium | Update to a patched version (dev-only dependency) |
| 4 | Booking conflict check is check-then-insert (TOCTOU race) | Medium | Add a database-level partial unique constraint / serializable transaction |
| 5 | Frontend ↔ backend contract drift (`/api/v1` vs `/api`, login `identifier` vs `email`, missing endpoints, PATCH vs PUT) | High (integration) | Out of scope for hardening; separate alignment phase |
| 6 | `bin/` / `obj/` build artifacts tracked in git | Low | Add to `.gitignore` and `git rm --cached` |
| 7 | AuthGuard bypassed in development (`NODE_ENV === "development"`) | Low | Guards are client-side only; backend enforces auth regardless |
| 8 | Frontend calls `POST /api/auth/logout`, which does not exist (404, silently ignored) | Low | Client-side logout already clears token; add server endpoint or drop the call |

## Required before production

1. Set `DATABASE_URL`, `JWT_SECRET` (≥32 bytes), `DEFAULT_ADMIN_PASSWORD`,
   `CORS__AllowedOrigins`, and optionally `JWT_ISSUER` / `JWT_AUDIENCE` /
   `JWT_EXPIRATION_MINUTES` as environment variables (see
   `backend/StudentCenter.Api/.env.example`). The API **will not start** without
   them.
2. Rotate the previously committed Supabase DB password, JWT signing secret, and
   opencode API key.
3. Run behind TLS with a trusted certificate (HSTS is enabled outside
   Development).
