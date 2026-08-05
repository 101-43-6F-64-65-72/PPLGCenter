# 16 — CI/CD Guide

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Workflow Inventory](#1-workflow-inventory)
2. [deploy-backend.yml](#2-deploy-backendyml)
3. [deploy-frontend.yml](#3-deploy-frontendyml)
4. [Secrets Used](#4-secrets-used)
5. [Known CI Issues](#5-known-ci-issues)
6. [Recommended Fixes](#6-recommended-fixes)

---

## 1. Workflow Inventory

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/deploy-backend.yml` | push to `main` | build backend (.NET) |
| `.github/workflows/deploy-frontend.yml` | push to `main` | build frontend (Next.js) |

Both are **build-only scaffolds**. Neither contains a real deployment step (placeholder comments only) and neither runs the test suite.

---

## 2. deploy-backend.yml

Verified contents:

| Step | Detail |
|---|---|
| Trigger | push on `main` |
| Runner | `ubuntu-latest` |
| Setup .NET | **`dotnet-version: '8.0.x'`** ⚠️ |
| Restore | `dotnet restore` (solution) |
| Build | `dotnet build --no-restore` |
| Test | ❌ **absent** |
| Publish | ❌ **absent** |
| Deploy | ❌ placeholder only |

> ⚠️ **Critical:** the project targets **net10.0** but the workflow installs the **.NET 8 SDK**. The build will fail (`TargetFramework net10.0 not found`). See [25_Known_Issues](25_Known_Issues.md).

---

## 3. deploy-frontend.yml

Verified contents:

| Step | Detail |
|---|---|
| Trigger | push on `main` |
| Runner | `ubuntu-latest` |
| Setup Node | `node-version: 20` |
| Install | `npm ci` |
| Build | `npm run build` with env `NEXT_PUBLIC_API_BASE_URL` from **GitHub Secret** |
| Deploy | ❌ placeholder only |

> The build inlines `NEXT_PUBLIC_API_BASE_URL` — if the secret points at `/api/v1` while the backend is `/api`, the mismatch ships in the bundle. See [26_Technical_Debt](26_Technical_Debt.md).

---

## 4. Secrets Used

| Name | Type | Used by |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | repo/org secret | deploy-frontend.yml build env |

> The backend workflow does **not** reference any secret (no deploy step). JWT secret / DB connection string are NOT wired into CI — they'd be needed when a real deploy step is added.

---

## 5. Known CI Issues

| # | Issue | Severity |
|---|---|---|
| CI-1 | Backend workflow installs .NET 8.0.x; projects are net10.0 → build fails | Critical |
| CI-2 | No test step in either workflow | High |
| CI-3 | No publish/deploy step (workflows are placeholders) | High |
| CI-4 | No database migration step | Medium |
| CI-5 | No artifact caching between steps (minor perf) | Low |

---

## 6. Recommended Fixes

1. Set `dotnet-version: '10.0.x'` (or a matrix) in deploy-backend.yml.
2. Add `dotnet test` step (`--no-build --collect:"XPlat Code Coverage"`).
3. Add publish + deploy steps (scp / `gh` deploy / Docker push) — actual target **Cannot verify from repository**.
4. Add a migration step (`dotnet ef database update`) guarded by an environment.
5. Add cache steps (`actions/setup-dotnet` + `actions/cache` for npm).
6. Use `NEXT_PUBLIC_API_BASE_URL` value that matches the backend (`/api`, not `/api/v1`) once the contract is reconciled.

---

*Cross-references: [15_Deployment_Guide](15_Deployment_Guide.md) · [18_Environment_Variables](18_Environment_Variables.md) · [26_Technical_Debt](26_Technical_Debt.md) · `.github/workflows/deploy-backend.yml` · `.github/workflows/deploy-frontend.yml`*
