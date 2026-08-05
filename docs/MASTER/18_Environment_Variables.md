# 18 — Environment Variables

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Overview](#1-overview)
2. [Backend Variables](#2-backend-variables)
3. [Frontend Variables](#3-frontend-variables)
4. [CI/CD Variables](#4-cicd-variables)
5. [Local `.env` Templates](#5-local-env-templates)
6. [Gotchas](#6-gotchas)

---

## 1. Overview

- **Backend** reads `ConnectionStrings:DefaultConnection` + `Jwt:*` from `appsettings.json` (overridable by env vars with prefix `ConnectionStrings__DefaultConnection`, `Jwt__SecretKey`, …).
- **Frontend** inlines `NEXT_PUBLIC_*` at build time (Next.js convention).
- **CI/CD** injects `NEXT_PUBLIC_API_BASE_URL` as a secret.

---

## 2. Backend Variables

| Env var | Config key | Example | Required |
|---|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | – | `Production` | yes (prod) |
| `ConnectionStrings__DefaultConnection` | `ConnectionStrings:DefaultConnection` | `Host=...;Database=postgres;...` | yes (prod) |
| `Jwt__SecretKey` | `Jwt:SecretKey` | 32+ char secret | yes (prod) |
| `Jwt__Issuer` | `Jwt:Issuer` | `StudentCenter` | no |
| `Jwt__Audience` | `Jwt:Audience` | `StudentCenterApp` | no |
| `Jwt__ExpirationMinutes` | `Jwt:ExpirationMinutes` | `60` | no |
| `AllowedHosts` | `AllowedHosts` | `*` | no |
| `CORS__AllowedOrigins` | CORS config | frontend URL | yes (prod) *(verify exact key)* |

> On Windows `.NET` uses `__` (double underscore) as the environment separator.

---

## 3. Frontend Variables

`NEXT_PUBLIC_*` — inlined at build time:

| Variable | Used in | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `config/api.js` | backend base URL |
| `NEXT_PUBLIC_APP_NAME` | `config/app.js` | app branding |
| `NEXT_PUBLIC_APP_URL` | layout/SEO | canonical URL |
| `NEXT_PUBLIC_UPLOAD_LIMIT` | upload UI | max upload size (MB) |

> ⚠️ All `NEXT_PUBLIC_*` values are baked into the bundle. Changing them requires a **rebuild**.

---

## 4. CI/CD Variables

| Secret / var | Used by |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | deploy-frontend.yml build step |

Backend secrets (DB connection, JWT key) are **not yet wired** into workflows (no deploy step exists). Add them when implementing real deployments.

---

## 5. Local `.env` Templates

**frontend/.env.local:**

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:5051/api/v1
NEXT_PUBLIC_APP_NAME="Student Center"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_UPLOAD_LIMIT=2
```

> ⚠️ Remember: backend serves `/api` (no `/api/v1`). Adjust after contract reconciliation.

**backend (PowerShell, alternative to appsettings):**

```powershell
$env:ConnectionStrings__DefaultConnection="Host=...;Database=postgres;..."
$env:Jwt__SecretKey="<long-random-secret>"
$env:ASPNETCORE_ENVIRONMENT="Production"
```

---

## 6. Gotchas

1. `NEXT_PUBLIC_*` are **build-time** — missing values silently fall back to code defaults (`/api/v1`).
2. Committed `appsettings.json` values will **override missing env vars** — always set env vars in production.
3. CORS origin must exactly match the frontend's public URL (including scheme/port).
4. `.env` files are **not committed** (verify `.gitignore` includes `.env*`).
5. Changing JWT secret invalidates all sessions.

---

*Cross-references: [17_Configuration_Guide](17_Configuration_Guide.md) · [16_CICD_Guide](16_CICD_Guide.md) · [15_Deployment_Guide](15_Deployment_Guide.md)*
