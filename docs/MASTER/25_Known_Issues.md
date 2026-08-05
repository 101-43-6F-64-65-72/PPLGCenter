# 25 — Known Issues

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [How to Read This List](#1-how-to-read-this-list)
2. [Critical Issues](#2-critical-issues)
3. [High Issues](#3-high-issues)
4. [Medium Issues](#4-medium-issues)
5. [Low / Cosmetic Issues](#5-low--cosmetic-issues)
6. [Open Questions](#6-open-questions)

---

## 1. How to Read This List

Verified during the Phase 021C.1/021D/022A audits. Severity: **Critical** = blocks deployment/security, **High** = breaks features, **Medium** = functional gap, **Low** = polish. Each item links to the mitigation doc.

---

## 2. Critical Issues

| ID | Issue | Evidence | Impact | Mitigation |
|---|---|---|---|---|
| KI-1 | **Supabase credentials + JWT secret committed** in `appsettings.json` | `git ls-files`, file contents | Full DB compromise, token forgery | Rotate now; move to secrets ([17_Configuration_Guide](17_Configuration_Guide.md)) |
| KI-2 | **API key committed** in `opencode.jsonc` | file contents | Key abuse | Rotate; gitignore ([26_Technical_Debt](26_Technical_Debt.md)) |
| KI-3 | **Frontend↔backend contract broken** (`/api/v1` vs `/api`, login `identifier` vs `email`) | `config/api.js`, `LoginRequest.cs`, controllers | No feature integrates; login 404s | Align contract ([06](06_Authentication.md), [08](08_API_Catalog.md), [26](26_Technical_Debt.md)) |
| KI-4 | **Default admin password** was hardcoded `Admin123!` in seeder (FIXED — now `DEFAULT_ADMIN_PASSWORD` env var) | `SeedAdminData.cs` | Public default credential | ✅ Fixed ([26](26_Technical_Debt.md)) |
| KI-5 | **CI backend workflow uses .NET 8.0.x** for net10.0 projects | `deploy-backend.yml` | CI build fails | Set `10.0.x` ([16](16_CICD_Guide.md)) |

---

## 3. High Issues

| ID | Issue | Evidence | Impact |
|---|---|---|---|
| KI-6 | `KeyNotFoundException` → **400** (contract: 404) | `ExceptionHandlingMiddleware.cs` | Wrong client error semantics |
| KI-7 | Business errors → **409** (contract: 422) | middleware + services | Contract drift |
| KI-8 | Frontend calls **missing endpoints**: `/profile`, `/clubs`, `/facilities/{id}/slots` | `services/*` | 404s for profile/clubs/slots |
| KI-9 | Booking status **PATCH vs PUT** mismatch | `facilityService.js` vs controller | 404/405 |
| KI-10 | Proposal **multipart upload** vs backend JSON `fileUrl` | `proposalService.js` vs `CreateProposalRequest` | Upload broken |
| KI-11 | **No tests** for 10+ services + all controllers | test inventory | Regression risk |
| KI-12 | **IDOR** on attendance/booking/submission read endpoints | service code | Data leak between students |

---

## 4. Medium Issues

| ID | Issue | Evidence |
|---|---|---|
| KI-13 | `Microsoft.OpenApi` **NU1903** (high-severity advisory) | build warnings |
| KI-14 | AuthGuard bypassed in development | `AuthContext`/guard code |
| KI-15 | Token in localStorage + **non-HttpOnly cookie** | `AuthContext.jsx` |
| KI-16 | Empty `README.md` / `AGENTS.md`; junk root files (`a.txt`…) | root listing |
| KI-17 | Duplicate `home/` component set | `components/` listing |
| KI-18 | `.obsidian/`, `.claudian/` committed | git status |
| KI-19 | No CI test step; workflows have no deploy step | `.github/workflows/` |
| KI-20 | Role enum ints exposed (0–3) instead of stable names | enum serialization (verify DTO) |

---

## 5. Low / Cosmetic Issues

| ID | Issue |
|---|---|
| KI-21 | Mixed Indonesian/English identifiers (`Ekstrakurikuler` vs `Extracurricular`) |
| KI-22 | Stray root `package-lock.json` |
| KI-23 | `progres-projek.md` progress % outdated (frontend 38% / backend 12%) |
| KI-24 | No `.editorconfig`/`.prettierrc` (verify) — formatting not enforced |

---

## 6. Open Questions

- Actual deployment target/host — **Cannot verify from repository**.
- Live DB row counts / environment — **Cannot verify from repository**.
- npm `audit` findings — **Cannot verify from repository** (not executed in audit).
- Coverage % threshold — not configured.

---

*Cross-references: [26_Technical_Debt](26_Technical_Debt.md) · [24_Debugging_Guide](24_Debugging_Guide.md) · [docs/Project/Quality Audit.md](../Project/Quality%20Audit.md)*
