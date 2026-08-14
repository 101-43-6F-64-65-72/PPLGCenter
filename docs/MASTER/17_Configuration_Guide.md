# 17 — Configuration Guide

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Configuration Sources](#1-configuration-sources)
2. [appsettings.json](#2-appsettingsjson)
3. [appsettings.Development.json](#3-appsettingsdevelopmentjson)
4. [JWT Settings](#4-jwt-settings)
5. [Connection Strings](#5-connection-strings)
6. [Security: Committed Secrets](#6-security-committed-secrets)
7. [Frontend Configuration](#7-frontend-configuration)
8. [Best Practices](#8-best-practices)

---

## 1. Configuration Sources

Backend uses standard ASP.NET Core configuration layering:

```
appsettings.json
→ appsettings.{ASPNETCORE_ENVIRONMENT}.json
→ environment variables (highest priority)
```

---

## 2. appsettings.json

Located at `backend/StudentCenter.Api/appsettings.json`. Verified keys:

| Section | Key | Value (committed) |
|---|---|---|
| `ConnectionStrings` | `DefaultConnection` | Supabase pooler connection string |
| `Jwt` | `SecretKey` | **committed signing key** |
| `Jwt` | `Issuer` | `StudentCenter` |
| `Jwt` | `Audience` | `StudentCenterApp` |
| `Jwt` | `ExpirationMinutes` | `60` |
| `Logging` | `LogLevel` | `Information` (Default), etc. |
| `AllowedHosts` | – | `*` |

> ⚠️ **This file is committed to git** (`git ls-files` confirms it is tracked). It contains production Supabase credentials and the JWT signing secret. See [6. Security](#6-security-committed-secrets).

---

## 3. appsettings.Development.json

Development overrides for local runs (verify exact keys on disk). Expected typical contents: relaxed CORS, Swagger enabled. **Verify current contents before relying on any specific value.**

---

## 4. JWT Settings

| Setting | Value | Purpose |
|---|---|---|
| `Jwt:SecretKey` | 32+ byte secret | HS256 signing key (⚠️ committed) |
| `Jwt:Issuer` | `StudentCenter` | token issuer claim |
| `Jwt:Audience` | `StudentCenterApp` | token audience claim |
| `Jwt:ExpirationMinutes` | `60` | token lifetime |

Consumed by `JwtService` in `Infrastructure/Services`.

---

## 5. Connection Strings

`ConnectionStrings:DefaultConnection`:

- Host: `aws-0-ap-southeast-1.pooler.supabase.com`
- Port: `6543` (pooler)
- Database: `postgres`
- User: `postgres.ryskvrqcrytmdsorviie`
- ⚠️ Password: **committed**

---

## 6. Security: Committed Secrets

**CRITICAL — verified in git history and working tree:**

1. Supabase database password.
2. JWT `SecretKey`.
3. `opencode.jsonc` contains a provider API key (`9router` / `sk-1838980bfd7a3387-lsycfj-...`).

**Immediate remediation (do before any public deploy):**
- [ ] Rotate the Supabase DB password (Supabase dashboard → Database → Connection → Reset password).
- [ ] Rotate the JWT secret; invalidate all previously issued tokens.
- [ ] Move values to environment variables / GitHub Secrets / a secrets manager.
- [ ] Remove `opencode.jsonc` API key from the repo (add to `.gitignore`).
- [ ] Consider scrubbing git history (`git filter-repo`) for the old values — **Cannot verify from repository** that history was already rewritten (it was not, per `git log`).

---

## 7. Frontend Configuration

Frontend config is in `frontend/src/config/`:

| File | Keys |
|---|---|
| `api.js` | `BASE_URL = "/api/v1"` ⚠️ (backend is `/api`), `TIMEOUT = 15000`, headers |
| `app.js` | `APP_NAME`, `UPLOAD_LIMIT = 2MB`, `TOKEN_COOKIE_NAME = "auth_token"` |

Runtime overrides come from `NEXT_PUBLIC_*` env vars — see [18_Environment_Variables](18_Environment_Variables.md).

---

## 8. Best Practices

1. **Never commit secrets.** Use User Secrets (`dotnet user-secrets`) for local dev, environment vars for staging/prod.
2. Keep `appsettings.json` with **placeholder** values; store real values in CI/CD secrets.
3. Add `appsettings.*.json` local overrides + `opencode.jsonc` (or its secrets) to `.gitignore`.
4. Validate config on startup (fail fast if `Jwt:SecretKey` is placeholder).
5. Enable `DataProtection` + HTTPS only in production.

---

*Cross-references: [15_Deployment_Guide](15_Deployment_Guide.md) · [18_Environment_Variables](18_Environment_Variables.md) · [26_Technical_Debt](26_Technical_Debt.md)*
