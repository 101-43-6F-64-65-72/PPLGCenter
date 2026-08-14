# PPLG CENTER — SUPABASE DATABASE CONNECTION FORENSIC AUDIT REPORT

**Date:** 2026-08-13  
**Auditor:** Principal Software Architect & Application Security Engineer  
**Mode:** FORENSIC AUDIT ONLY (Read-Only Inspection / Zero Code Modifications / Zero DB Modifications).

---

## 1. Executive Summary

A comprehensive, repository-wide forensic audit was conducted to investigate database connection paths and resolve concerns regarding potential unintended connectivity to the old Student Center Supabase database (`ryskvrqcrytmdsorviie`) versus the new dedicated PPLG Center Supabase database (`rwopazhqgvvrosdizmvt`).

The audit revealed that while application source code (`Program.cs` & `AppDbContext.cs`) and `backend/.env` are correctly configured for the new PPLG Center database, **residual configuration hardcoding exists in local execution scripts (`start_backend.ps1`) and Playwright test config (`playwright.config.js`) pointing to the old Student Center database**. Furthermore, production database connectivity on Render is governed externally by Render environment variables, which require manual dashboard verification.

---

## 2. Database Connection Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │  ASP.NET Core Web API (Program.cs)          │
                               │  Reads: Environment.GetEnvironmentVariable   │
                               │         ("DATABASE_URL")                     │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
     [LOCAL / DEV ENVIRONMENT]                                     [PRODUCTION / RENDER PLATFORM]
     Source: backend/.env                                          Source: Render Dashboard Env Vars
     Host: db.rwopazhqgvvrosdizmvt.supabase.co                     Host: Render Environment Variable
     (PPLG Center Dedicated DB)                                    (Must be set to PPLG Center DB)
                       │
                       ├───────► Exception: start_backend.ps1 & playwright.config.js
                       │         contain hardcoded host: db.ryskvrqcrytmdsorviie.supabase.co (OLD DB!)
```

---

## 3. Local Configuration Audit

- **`backend/.env` (Git-Ignored):**
  - **Status:** **CORRECT**
  - **Target Host:** `db.rwopazhqgvvrosdizmvt.supabase.co` (PPLG Center Dedicated DB)
  - **Password:** `[REDACTED]`

- **`start_backend.ps1` (Line 2):**
  - **Status:** **OLD STUDENT CENTER DEPENDENCY FOUND**
  - **Target Host:** `db.ryskvrqcrytmdsorviie.supabase.co` (Old Student Center DB)
  - **Password:** `[REDACTED]`
  - **Risk:** Executing `start_backend.ps1` overrides `$env:DATABASE_URL` in local PowerShell sessions with the old Student Center database connection.

- **`frontend/playwright.config.js` (Line 31):**
  - **Status:** **OLD STUDENT CENTER DEPENDENCY FOUND**
  - **Target Host:** `db.ryskvrqcrytmdsorviie.supabase.co` (Old Student Center DB)
  - **Password:** `[REDACTED]`
  - **Risk:** Running Playwright test runners locally triggers backend startup pointing to the old Student Center database.

---

## 4. Production Configuration Audit

- **ASP.NET Core Runtime (`Program.cs` Lines 43-47):**
  - `Program.cs` dynamically resolves `DATABASE_URL` from the process environment:
    ```csharp
    var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
        ?? builder.Configuration.GetConnectionString("DefaultConnection")
        ?? string.Empty;
    ```
  - **Code Status:** **CLEAN & ENVIRONMENT DRIVEN**
  - **Repository Limit:** The repository itself does NOT dictate production database credentials. Render injects `DATABASE_URL` into the container at runtime.

- **Render Blueprint (`render.yaml` Lines 17-20 & 36-41):**
  - **Status:** Contains a Render Blueprint definition linking `DATABASE_URL` to an internal Render PostgreSQL instance (`pplgcenter-db`).
  - **Render Dashboard Rule:** Manual Render environment settings override `render.yaml`.

---

## 5. Supabase Project Reference Audit

| Host Identifier | Associated Project | Files Found In | Classification |
|---|---|---|---|
| `rwopazhqgvvrosdizmvt` | **NEW PPLG Center DB** | `backend/.env`, Phase 4D/5A/5C/5D/5E/8/9 Docs | **CORRECT PPLG CENTER TARGET** |
| `ryskvrqcrytmdsorviie` | **OLD Student Center DB** | `start_backend.ps1`, `playwright.config.js`, Phase 6/7 Manifest Docs | **OLD STUDENT CENTER DEPENDENCY** |

---

## 6. Student Center Legacy Reference Audit

- **Application Controllers / DTOs / Services:** 0 hardcoded database connection strings.
- **`appsettings.json` & `appsettings.Development.json`:** `ConnectionStrings:DefaultConnection` is empty (`""`). No Student Center credentials exist in JSON configs.

---

## 7. AppDbContext & EF Core Audit

- **`AppDbContext.cs`:** Implements standard constructor injection `DbContextOptions<AppDbContext>`. Contains zero hardcoded connection strings or provider overrides in `OnConfiguring`.
- **EF Core Assembly Configurations:** Entity configurations define schema mappings (`DbSet` / tables) only. Zero database server targets hardcoded.

---

## 8. Migration Audit

- **Migration History:** Migration files (`backend/StudentCenter.Infrastructure/Migrations/`) represent C# DDL schema code (`migrationBuilder.CreateTable`, `AddColumn`).
- **Target Neutrality:** EF Core migration files do NOT bind to a specific database host. They execute against whichever database host is specified by the active `DATABASE_URL` at runtime.

---

## 9. GitHub Actions & CI/CD Audit

- **`.github/workflows/ci.yml`:** Runs `dotnet build` and `dotnet test` (which use EF Core In-Memory provider or local mock context). No database host configured.
- **`.github/workflows/deploy-backend.yml`:** Build step only. No production database secrets hardcoded.

---

## 10. Environment Variable Audit

- **`backend/.env.example`:** `DATABASE_URL=` (Empty placeholder — CLEAN).
- **`.env.example` (Root):** `DATABASE_URL=` (Empty placeholder — CLEAN).
- **`.gitignore`:** `backend/.env` and `.env.local` are 100% ignored by git and untracked.

---

## 11. Fork vs. Runtime Dependency Analysis

- **Forking Context:** PPLG Center was created as a domain-focused evolution from Student Center.
- **Distinction:**
  - **Git History / Repository Copy:** Inherits previous code files, scripts, and documentation. Copying repository files does NOT grant runtime database access by itself.
  - **Runtime Database Configuration:** Runtime database access occurs ONLY when process environment variables (`DATABASE_URL`) or local scripts (`start_backend.ps1`, `playwright.config.js`) supply connection credentials to Npgsql at runtime.
- **Audit Finding:** The issue is NOT git fork history; the issue is explicit hardcoded fallback strings in `start_backend.ps1` and `playwright.config.js`.

---

## 12. Database Target Matrix

| Layer | Configuration Source | Current Target | Expected Target | Status |
|---|---|---|---|---|
| **Local Backend (`dotnet run`)** | `backend/.env` | `db.rwopazhqgvvrosdizmvt.supabase.co` | `db.rwopazhqgvvrosdizmvt.supabase.co` | **PASS** |
| **Local Backend Script (`start_backend.ps1`)** | `start_backend.ps1` (Line 2) | `db.ryskvrqcrytmdsorviie.supabase.co` | `db.rwopazhqgvvrosdizmvt.supabase.co` | **FAIL** |
| **Playwright Local WebServer** | `frontend/playwright.config.js` (Line 31) | `db.ryskvrqcrytmdsorviie.supabase.co` | `db.rwopazhqgvvrosdizmvt.supabase.co` | **FAIL** |
| **ASP.NET Core `Program.cs`** | `DATABASE_URL` Env Var | Environment Driven | Environment Driven | **PASS** |
| **EF Core / `AppDbContext`** | Constructor Injection | Environment Driven | Environment Driven | **PASS** |
| **GitHub Actions** | `.github/workflows/ci.yml` | None (In-Memory/Mock) | None | **PASS** |
| **Render Production API** | Render Platform Env Var `DATABASE_URL` | **UNKNOWN / Platform State** | `db.rwopazhqgvvrosdizmvt.supabase.co` | **HUMAN CHECK** |
| **Frontend App Router** | `NEXT_PUBLIC_API_BASE_URL` | Render API Endpoint | Render API Endpoint | **PASS** |

---

## 13. Security Findings

- No unencrypted database passwords exposed in tracked repository files.
- `backend/.env` is strictly git-ignored and untracked.

---

## 14. Exact Root Cause Analysis

1. **Local Test Script Hardcoding:** `start_backend.ps1` (line 2) and `frontend/playwright.config.js` (line 31) explicitly hardcode `$env:DATABASE_URL` with host `db.ryskvrqcrytmdsorviie.supabase.co` (Old Student Center DB). When developer tools run these scripts, local backend execution is forced onto the old Student Center database.
2. **Render Platform State Unknown:** Production Render deployment derives `DATABASE_URL` from Render Dashboard Environment Variables. If Render was configured during an earlier test run using the old Student Center connection string, Render will continue targeting `ryskvrqcrytmdsorviie` until updated in the Render Dashboard.

---

## 15. Unknowns Requiring Render Verification

- **Render Dashboard Environment Setting:** The repository cannot inspect live production environment variables inside Render's cloud platform. The DevOps administrator must log into Render Dashboard ➔ `pplgcenter-backend` ➔ Environment ➔ and verify that `DATABASE_URL` points to `db.rwopazhqgvvrosdizmvt.supabase.co`.

---

## 16. Recommended Fix Plan (For Future Execution)

1. **Update `start_backend.ps1`:** Replace `db.ryskvrqcrytmdsorviie.supabase.co` in Line 2 with `db.rwopazhqgvvrosdizmvt.supabase.co`.
2. **Update `frontend/playwright.config.js`:** Replace `db.ryskvrqcrytmdsorviie.supabase.co` in Line 31 with `db.rwopazhqgvvrosdizmvt.supabase.co`.
3. **Verify Render Dashboard:** Confirm Render environment setting `DATABASE_URL` contains `db.rwopazhqgvvrosdizmvt.supabase.co`.

---

## 17. Final Architecture Gate Verdict

### **VERDICT: C. BLOCKED — Repository still contains an active Student Center database dependency.**

*(Reason: `start_backend.ps1` and `playwright.config.js` contain hardcoded connection strings targeting the old Student Center database `db.ryskvrqcrytmdsorviie.supabase.co`, and Render Dashboard environment variable state requires manual human verification).*

---

## 18. Final Safety Verification

- Database Modified: **NO**
- Migration Created: **NO**
- Migration Applied: **NO**
- Data Modified: **NO**
- Files Modified: **NO**
- Git Commit: **NO**
- Git Push: **NO**
- Deployment Triggered: **NO**
