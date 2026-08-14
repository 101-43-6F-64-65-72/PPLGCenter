# 24 — Debugging Guide

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Common Symptoms & Fixes](#1-common-symptoms--fixes)
2. [Backend Debugging](#2-backend-debugging)
3. [Frontend Debugging](#3-frontend-debugging)
4. [Database Debugging](#4-database-debugging)
5. [The Integration "Triple Mismatch"](#5-the-integration-triple-mismatch)
6. [Logging](#6-logging)

---

## 1. Common Symptoms & Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `401` on every call | token missing/expired (60 min) | re-login; verify `Authorization` header |
| `404` on login | base path `/api/v1` vs `/api` | align `config/api.js` or backend route |
| Login "wrong credentials" | frontend sends `identifier`; backend wants `email` | change field or add support |
| `409` on booking | time-slot conflict | pick different time; server intentionally rejects |
| `400` on `KeyNotFoundException` | not-found returns 400 not 404 | handle 400 in UI; fix middleware mapping |
| React Query stale data | default staleTime | configure `staleTime` in `queryClient.js` |
| Session lost on refresh | `/profile` endpoint missing → restore fails | use `/api/auth/me` |
| `NU1903` warning | Microsoft.OpenApi vulnerable | update OpenApi package |

---

## 2. Backend Debugging

```bash
# run with dev env + Swagger
dotnet run --project backend/StudentCenter.Api
# → Swagger at https://localhost:7187/swagger (Development)

# or attach debugger in IDE; breakpoints in services/controllers
```

**Tips:**
- Enable `Microsoft.EntityFrameworkCore` logging (`LogLevel.Information`) in `appsettings.Development.json` to see SQL (verify current setting).
- Inspect middleware mapping for odd status codes: `ExceptionHandlingMiddleware.cs`.
- Validate JWT with `JwtService`; check claims via `GET /api/auth/me`.

---

## 3. Frontend Debugging

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

**Tips:**
- Open DevTools → Network: inspect actual request URL/method/body (expect `/api/v1/...`).
- Check `AuthContext` storage: `localStorage.token`, cookie `auth_token`.
- `AuthGuard` bypass in development — test protection with a production build (`npm run build && npm start`).
- React Query devtools: check cached keys and `QueryClient` options.

---

## 4. Database Debugging

- Migrations: `dotnet ef database update --project backend/StudentCenter.Infrastructure --startup-project backend/StudentCenter.Api`.
- View SQL: enable EF logging or use Supabase SQL editor (`pg_dump`, `psql`).
- Unique-violation errors surface as `DuplicateNameException` → 409.
- Check `__EFMigrationsHistory` for pending migrations.

---

## 5. The Integration "Triple Mismatch"

The #1 debugging trap is that three contracts disagree:

| Aspect | docs contract | backend code | frontend code |
|---|---|---|---|
| Base path | `/api/v1` | `/api` | `/api/v1` |
| Login field | `identifier` | `email` | `identifier` |
| Booking status verb | (contract) | `PUT` | `PATCH` |

**Debug workflow when a feature 404s:**
1. Check DevTools URL → if `/api/v1`, that's the cause.
2. Grep backend `Controllers/` for the route.
3. Grep `frontend/src/constants/apiRoutes.js` + `config/api.js` for the path.
4. Align one side (recommended: fix frontend config + routes, or add `/api/v1` route prefix + identifier login to backend). See [26_Technical_Debt](26_Technical_Debt.md).

---

## 6. Logging

- ASP.NET Core built-in logging (console) — default level `Information`; adjust per env.
- No structured logging provider (no Serilog) wired — **Cannot verify from repository** (verify package list).
- Frontend: browser console + React Query devtools; no Sentry/analytics configured.

---

*Cross-references: [06_Authentication](06_Authentication.md) · [08_API_Catalog](08_API_Catalog.md) · [25_Known_Issues](25_Known_Issues.md) · [26_Technical_Debt](26_Technical_Debt.md)*
