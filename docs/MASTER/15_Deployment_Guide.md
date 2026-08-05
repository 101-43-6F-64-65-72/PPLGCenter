# 15 — Deployment Guide

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Deployment Overview](#1-deployment-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [Backend Deployment](#4-backend-deployment)
5. [Frontend Deployment](#5-frontend-deployment)
6. [Database (Supabase)](#6-database-supabase)
7. [Domain & Reverse Proxy](#7-domain--reverse-proxy)
8. [Release Checklist](#8-release-checklist)
9. [Rollback](#9-rollback)

---

## 1. Deployment Overview

Per `docs/Project/MONOREPO_DEPLOYMENT_GUIDE.md`, the intended topology is a **frontend + backend + Supabase** stack:

| Service | Intended host | URL |
|---|---|---|
| Frontend (Next.js) | Vercel / Node host | `studentcenter.com` |
| Backend (ASP.NET Core) | Cloud VPS / container | `api.studentcenter.com` |
| Database | Supabase (managed PostgreSQL) | `aws-0-ap-southeast-1.pooler.supabase.com:6543` |

> ⚠️ **Repository reality:** no production configuration (no Dockerfile, no `vercel.json`, no `platform` setup, no deploy scripts) exists **in the repository** for frontend or backend. GitHub Actions workflows are scaffolds with **no deploy step**. Everything below marked "planned" is from documentation, not from code.

---

## 2. Prerequisites

- .NET SDK **10.0** (backend projects target `net10.0`).
- Node.js **20+** (frontend workflow uses `node-version: 20`).
- PostgreSQL connection (Supabase) for the backend.
- A Supabase Storage bucket for file URLs (**Cannot verify from repository** — no upload code exists yet).

---

## 3. Local Development Setup

**Backend:**

```bash
# from repo root
dotnet restore backend/StudentCenter.slnx
dotnet build backend/StudentCenter.slnx
dotnet run --project backend/StudentCenter.Api
# → http://localhost:5051 (HTTP) / https://localhost:7187 (HTTPS)
# Swagger UI available in Development
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

**Env for frontend (`.env.local`):**

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5051/api/v1
NEXT_PUBLIC_APP_NAME="Student Center"
```

> ⚠️ Note the backend exposes `/api`, not `/api/v1`. See [26_Technical_Debt](26_Technical_Debt.md).

**Database migration:**

```bash
# requires EF tools (dotnet-ef) + valid ConnectionStrings:DefaultConnection
dotnet ef database update --project backend/StudentCenter.Infrastructure --startup-project backend/StudentCenter.Api
```

---

## 4. Backend Deployment

**Planned (per docs):** publish ASP.NET Core app and run behind reverse proxy on `api.studentcenter.com`.

```bash
dotnet publish backend/StudentCenter.Api -c Release -o ./publish
# run: dotnet ./publish/StudentCenter.Api.dll  (or host via IIS/Kestrel)
```

**Production configuration must:**
1. Override `Jwt:SecretKey` via environment/secrets (⚠️ committed value must be rotated).
2. Override `ConnectionStrings:DefaultConnection` via environment/secrets (⚠️ committed credentials must be rotated).
3. Set `ASPNETCORE_ENVIRONMENT=Production`.
4. Disable Swagger UI in production.
5. Configure CORS to allow the frontend origin.

**Known blockers before deploy:**
- Set the `DEFAULT_ADMIN_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`, and `CORS__AllowedOrigins` environment variables (startup fails without them).
- `Microsoft.OpenApi` advisory (`NU1903`) should be remediated.
- (Optional) containerize — **Cannot verify from repository** (no Dockerfile found).

---

## 5. Frontend Deployment

**Planned (per docs):** build Next.js and host statically or on a Node server.

```bash
cd frontend
npm run build
# next build output (standalone configured?) — verify next.config.mjs output
```

**Required env at build time:**
- `NEXT_PUBLIC_API_BASE_URL` (point to the deployed backend, **without** `/api/v1` unless the backend is changed — current default `/api/v1` mismatches backend `/api`).
- `NEXT_PUBLIC_APP_URL`.
- `NEXT_PUBLIC_APP_NAME`.

> ⚠️ Because `NEXT_PUBLIC_*` values are inlined at build time, a misconfigured base URL ships into the bundle. See [18_Environment_Variables](18_Environment_Variables.md).

---

## 6. Database (Supabase)

| Item | Value (committed) |
|---|---|
| Host | `aws-0-ap-southeast-1.pooler.supabase.com` |
| Port | 6543 |
| Database | `postgres` |
| User | `postgres.ryskvrqcrytmdsorviie` |
| ⚠️ Password | **committed in `appsettings.json` — ROTATE** |

- Run migrations before first deploy.
- Back up before any destructive change (Supabase dashboard / `pg_dump`).
- Restrict pooler IP rules to the backend host.

---

## 7. Domain & Reverse Proxy

**Cannot verify from repository** — no DNS/TLS/nginx config is committed. Planned per `MONOREPO_DEPLOYMENT_GUIDE.md`:
- Frontend → `studentcenter.com` (TLS).
- Backend → `api.studentcenter.com` (TLS), reverse-proxied to Kestrel port.
- CORS allowlist must include the frontend origin.

---

## 8. Release Checklist

- [ ] Rotate committed Supabase credentials + JWT secret; store in secrets/env.
- [ ] Remove/disable default admin seed (or change password).
- [ ] Reconcile API base path + contract mismatches (login field, `/profile`, `/clubs`, `/slots`, PATCH/PUT, proposal upload).
- [ ] Run `dotnet test` (80 tests) green.
- [ ] Frontend `npm run build` green.
- [ ] Re-enable CI test step + real deploy step (see [16_CICD_Guide](16_CICD_Guide.md)).
- [ ] Set production env vars (section 5).
- [ ] Verify CORS + HTTPS + Swagger disabled.
- [ ] Smoke-test login → dashboard → mading → booking end-to-end.

---

## 9. Rollback

- **Backend:** redeploy previous build artifact; DB schema changes via migrations are forward-only — backup first.
- **Frontend:** redeploy previous build; env changes require a new build (NEXT_PUBLIC_* are build-time).
- **Database:** restore from Supabase snapshot; migrations that dropped columns require manual recovery.

---

*Cross-references: [16_CICD_Guide](16_CICD_Guide.md) · [17_Configuration_Guide](17_Configuration_Guide.md) · [18_Environment_Variables](18_Environment_Variables.md) · [docs/Project/MONOREPO_DEPLOYMENT_GUIDE.md](../Project/MONOREPO_DEPLOYMENT_GUIDE.md)*
