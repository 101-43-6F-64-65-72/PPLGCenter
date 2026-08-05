# 26 — Technical Debt

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [Debt Summary](#1-debt-summary)
2. [P0 — Security & Secrets](#2-p0--security--secrets)
3. [P1 — Integration / Contract Alignment](#3-p1--integration--contract-alignment)
4. [P2 — Reliability & Testing](#4-p2--reliability--testing)
5. [P3 — Quality of Life](#5-p3--quality-of-life)
6. [Debt Register](#6-debt-register)

---

## 1. Debt Summary

Total estimated remediation effort: **~3–5 focused sprints** (security sprint → integration sprint → testing sprint → cleanup sprint). Priorities:

| Priority | Theme | Count | Risk |
|---|---|---|---|
| P0 | Secrets, credentials, CI blocker | 5 | Critical |
| P1 | API contract, endpoints, methods | 6 | High |
| P2 | Tests, IDOR, exception mapping | 5 | High/Medium |
| P3 | Docs, duplicates, polish | 6 | Low |

---

## 2. P0 — Security & Secrets

| # | Debt | Effort | Status |
|---|---|---|---|
| D1 | Rotate + move Supabase password & JWT secret out of git | S | 🔴 Not started |
| D2 | Remove API key from `opencode.jsonc`; gitignore it | S | 🔴 Not started |
| D3 | Remove/override default admin seed (`Admin123!`) | S | 🟢 Done — password from `DEFAULT_ADMIN_PASSWORD` |
| D4 | Fix CI .NET version (8.0.x → 10.0.x) | S | 🔴 Not started |
| D5 | Harden token handling (HttpOnly cookie, refresh tokens) | M | 🔴 Not started |

---

## 3. P1 — Integration / Contract Alignment

| # | Debt | Effort | Status |
|---|---|---|---|
| D6 | Unify base path: `/api/v1` vs `/api` (pick one; recommend backend keeps `/api` + update frontend config, or add version segment) | M | 🔴 Not started |
| D7 | Login field: support `identifier` OR align frontend to `email` | S | 🔴 Not started |
| D8 | Add backend `/profile` (or repoint frontend to `/auth/me`) | M | 🔴 Not started |
| D9 | Add `/clubs` alias or repoint frontend to `/extracurriculars` | S | 🔴 Not started |
| D10 | Add `/facilities/{id}/slots` or remove from frontend | M | 🔴 Not started |
| D11 | Unify booking status verb (PUT vs PATCH) + proposal upload format (multipart vs JSON) | M | 🔴 Not started |

---

## 4. P2 — Reliability & Testing

| # | Debt | Effort | Status |
|---|---|---|---|
| D12 | Fix exception mapping: `KeyNotFoundException`→404, business errors→422 (or update contract) | S | 🔴 Not started |
| D13 | Add IDOR protection on attendance/booking/submission reads | M | 🔴 Not started |
| D14 | Add unit tests for FacilityBookingService, SubmissionService, JwtService, AttendanceService, ExtracurricularService, controllers | L | 🔴 Not started |
| D15 | Add CI test step + coverage gate | S | 🔴 Not started |
| D16 | Remediate NU1903 (Microsoft.OpenApi advisory) | S | 🔴 Not started |

---

## 5. P3 — Quality of Life

| # | Debt | Effort | Status |
|---|---|---|---|
| D17 | Deduplicate `home/` components | S | 🔴 Not started |
| D18 | Write `README.md`, `AGENTS.md`; delete junk root files | S | 🔴 Not started |
| D19 | Gitignore `.obsidian/`, `.claudian/`, root artifacts | S | 🔴 Not started |
| D20 | Normalize naming (`Extracurricular` canonical) | M | 🔴 Not started |
| D21 | Refresh `progres-projek.md` status % | S | 🔴 Not started |
| D22 | Add `.editorconfig`/formatters; enforce formatting | S | 🔴 Not started |

---

## 6. Debt Register

| ID | Item | Priority | Effort | Status |
|---|---|---|---|---|
| D1 | Rotate committed DB + JWT secrets | P0 | S | 🔴 |
| D2 | Remove committed API key | P0 | S | 🔴 |
| D3 | Default admin credential | P0 | S | 🔴 |
| D4 | CI .NET version | P0 | S | 🔴 |
| D5 | Token hardening | P0 | M | 🔴 |
| D6 | Base path unification | P1 | M | 🔴 |
| D7 | Login field | P1 | S | 🔴 |
| D8 | Profile endpoint | P1 | M | 🔴 |
| D9 | Clubs alias | P1 | S | 🔴 |
| D10 | Slots endpoint | P1 | M | 🔴 |
| D11 | Verb/upload contract | P1 | M | 🔴 |
| D12 | Exception mapping | P2 | S | 🔴 |
| D13 | IDOR fixes | P2 | M | 🔴 |
| D14 | Test expansion | P2 | L | 🔴 |
| D15 | CI tests | P2 | S | 🔴 |
| D16 | NU1903 | P2 | S | 🔴 |
| D17 | Duplicate components | P3 | S | 🔴 |
| D18 | Root docs/junk | P3 | S | 🔴 |
| D19 | Gitignore | P3 | S | 🔴 |
| D20 | Naming canonicalization | P3 | M | 🔴 |
| D21 | Progress docs refresh | P3 | S | 🔴 |
| D22 | Formatters | P3 | S | 🔴 |

Legend: S = ≤1 day, M = 2–5 days, L = 1+ week. 🔴 not started (documentation-only phase).

---

*Cross-references: [25_Known_Issues](25_Known_Issues.md) · [27_Roadmap](27_Roadmap.md) · [17_Configuration_Guide](17_Configuration_Guide.md) · [16_CICD_Guide](16_CICD_Guide.md)*
