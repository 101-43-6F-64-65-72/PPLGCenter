# 01 — Project Overview

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [What is StudentCenter?](#1-what-is-studentcenter)
2. [Repository Facts](#2-repository-facts)
3. [Goals & Business Purpose](#3-goals--business-purpose)
4. [Target Users & Roles](#4-target-users--roles)
5. [Planned Modules vs Implemented](#5-planned-modules-vs-implemented)
6. [Technology Snapshot](#6-technology-snapshot)
7. [Current State of the Codebase](#7-current-state-of-the-codebase)
8. [Key Facts & Figures](#8-key-facts--figures)
9. [Documentation Map](#9-documentation-map)

---

## 1. What is StudentCenter?

StudentCenter (also referred to as *Student Center SMA/SMK* or *Student Center SMK Negeri 2 Surakarta*) is a web-based **student information & services system** for schools. It unifies school activities — digital bulletin board (mading), extracurricular clubs, facility booking, activity proposals, assignments, materials, attendance, calendar events, and notifications — into a single platform used by **students, OSIS, teachers, and administrators**.

The repository is a **monorepo** containing:

| Component | Description |
|---|---|
| `backend/` | ASP.NET Core Web API (.NET 10) built with Clean Architecture |
| `frontend/` | Next.js 16 (App Router) web application |
| `StudentCenter.Tests/` | xUnit test suite for backend services |
| `.github/workflows/` | CI/CD scaffold for backend & frontend |
| `docs/` | Obsidian-style knowledge base (planning docs, entity/feature docs) |
| `frontend/docs/` | Frontend team planning docs (API agreement, context) |

---

## 2. Repository Facts

| Fact | Value |
|---|---|
| Repository root | `D:\.SCHOOL\StudentCenter` |
| Git remote | `https://github.com/102-43-6F-64-65-72/StudentCenter` |
| Git history | 19 commits (mixed English/Indonesian messages) |
| Latest commit topic | "final b4 integration" (merge) |
| Solution file | `backend/StudentCenter.slnx` (5 projects) |
| Default branch trigger | `main` (GitHub Actions) |
| Root junk files | `a.txt`, `b.txt`, `c.txt`, `Untitled.base`, stray `package-lock.json` |
| Root `README.md` | 15 bytes (effectively empty) |
| Root `AGENTS.md` | 0 bytes (empty) |

---

## 3. Goals & Business Purpose

Per `docs/Project/Project Plan.md`:

> Build a modern, responsive platform that unifies school activities for students, OSIS, teachers, and administrators.

Per `frontend/docs/student-center.md`, the system replaces physical school processes:

- **Mading fisik** → digital bulletin board so announcements reach students faster.
- **Birokrasi kertas** (proposal) → digital submission and tracking.
- **Bentrok fasilitas** (facility double-booking) → online booking with automatic conflict rejection.
- **Pendaftaran ekskul** → online registration for grades 10/11.

The platform is aimed at **SMK Negeri 2 Surakarta** (per frontend branding, layout metadata, and `APP_CONFIG.NAME`).

---

## 4. Target Users & Roles

Defined in `docs/Home.md`, `docs/Project/Glossary.md`, and the API contract:

| Role | Description |
|---|---|
| **Student** | Regular student users (login via NIS/NISN per contract — see [06_Authentication](06_Authentication.md)) |
| **OSIS** | Student council members (submits proposals, manages announcements) |
| **Teacher** | Faculty / extracurricular advisors (approves bookings/proposals, creates assignments/materials) |
| **Admin** | Vice Principal of Student Affairs (Waka Kesiswaan) — highest access |

> ⚠️ **Inconsistency note:** the code models exactly 4 roles (`Admin`, `Teacher`, `Student`, `OSIS`) as a numeric enum. The planning docs also mention "Pembina Ekskul" (club advisor) as a *relationship* (`ManagedByUserId`), not a separate role. See [26_Technical_Debt](26_Technical_Debt.md).

---

## 5. Planned Modules vs Implemented

From `frontend/docs/student-center.md` and `docs/Project/Roadmap.md`:

| Module | Priority (plan) | Backend status | Frontend status |
|---|---|---|---|
| Authentication & Account | Tinggi | ✅ Login + JWT + `/auth/me` | ⚠️ Login UI present, **integration broken** (see [06_Authentication](06_Authentication.md)) |
| Mading Digital & Information | Tinggi | ✅ Announcement CRUD + comments + reactions + feed | ⚠️ Pages present, API mismatch (`/api/v1`) |
| School Calendar | Tinggi | ✅ CalendarEvent CRUD + upcoming | ❌ Not wired to frontend |
| Extracurricular (Ekskul) | Tinggi | ✅ Club CRUD + join/leave + members | ⚠️ Pages present, frontend calls `/clubs` (backend is `/extracurriculars`) |
| Facility Booking | Menengah | ✅ Facility CRUD + booking + conflict check + approval | ⚠️ Pages present, `/slots` endpoint missing on backend |
| Proposal | Menengah | ✅ Proposal submit + review + notifications | ⚠️ Page present, file upload not implemented on backend |
| E-Voting (OSIS election) | Rendah/Opsional | ❌ Not implemented | ❌ Not implemented |
| Profile self-service | (Roadmap Phase 2) | ❌ No profile endpoint; no NIS/class/major/phone fields | ❌ `/profile` page exists but backend endpoint missing |
| Dashboard | (Roadmap Phase 2) | ✅ `GET /api/dashboard` | ✅ `/admin`, `/guru`, `/osis` role pages |
| Notifications | (Roadmap Phase 4) | ✅ Notification CRUD + unread count | ❌ Not wired |
| File upload (Supabase Storage) | (Roadmap Phase 4) | ❌ No upload handling (URLs are strings) | ⚠️ Frontend sends multipart for proposals |
| Search | (Phase 020, in docs) | ✅ `GET /api/search` (7 entity types) | ❌ Not wired |
| Attendance | (docs Backend Overview) | ✅ Attendance CRUD | ❌ Not wired |

> ✅ = implemented in code. ⚠️ = partial/mismatch. ❌ = not implemented.

---

## 6. Technology Snapshot

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | .NET / ASP.NET Core | 10.0 (`net10.0`) |
| Backend ORM | Entity Framework Core | 10.0.10 |
| Backend DB driver | Npgsql | 10.0.3 |
| Database | PostgreSQL (Supabase managed) | (Supabase) |
| Auth | JWT Bearer (HS256) | Microsoft.AspNetCore.Authentication.JwtBearer 10.0.10 |
| API docs | Swashbuckle / OpenAPI | 6.6.2 / Microsoft.AspNetCore.OpenApi 10.0.10 |
| Frontend | Next.js (App Router) | 16.2.12 |
| Frontend UI | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Frontend state/cache | TanStack Query | 5.66.0 |
| Frontend forms | react-hook-form + zod | 7.54.2 / 3.24.2 |
| Frontend HTTP | Axios (+ native fetch fallback) | 1.7.9 |
| Icons | lucide-react | 0.475.0 |
| Backend tests | xUnit + Moq + FluentAssertions + EF InMemory | 2.9.3 / 4.20.72 / 8.10.0 / 10.0.10 |

See [20_Dependency_Graph](20_Dependency_Graph.md) and `docs/Architecture/Tech Stack.md`.

---

## 7. Current State of the Codebase

**Verified facts (Phase 021C.1 / 021D / 022A):**

- ✅ Backend builds with **0 errors**.
- ✅ Backend test suite passes **80/80 tests**.
- ✅ 15 entities, 12 EF migrations, 18 services, 17 controllers (~75 endpoints).
- ⚠️ 2 NuGet audit warnings: `NU1903` — `Microsoft.OpenApi 2.0.0` has a known **high-severity** vulnerability (`GHSA-v5pm-xwqc-g5wc`), transitively via `Microsoft.AspNetCore.OpenApi`.
- ⚠️ **Critical security issue:** live Supabase DB credentials + JWT signing secret are committed in `backend/StudentCenter.Api/appsettings.json`. See [26_Technical_Debt](26_Technical_Debt.md) and [17_Configuration_Guide](17_Configuration_Guide.md).
- ⚠️ **Critical integration issue:** frontend↔backend contracts diverge (base URL `/api/v1` vs `api/...`, missing `/profile`, `/clubs`, `/facilities/{id}/slots`, PATCH vs PUT booking status, login identifier vs email). See [08_API_Catalog](08_API_Catalog.md) and [26_Technical_Debt](26_Technical_Debt.md).
- ⚠️ CI backend workflow targets .NET **8.0.x** while projects target **net10.0** → CI build would fail. See [16_CICD_Guide](16_CICD_Guide.md).
- ⚠️ `opencode.jsonc` contains a committed local-model-router API key. See [26_Technical_Debt](26_Technical_Debt.md).

**Health scores (from Phase 021D audit):** Overall **89/100**, backend "Release Candidate READY" in isolation; **not deployable as an integrated product** without contract fixes.

---

## 8. Key Facts & Figures

| Metric | Value |
|---|---|
| Backend projects | 5 (`Api`, `Application`, `Domain`, `Infrastructure`, `Tests`) |
| Controllers | 17 |
| API endpoints | ~75 (under `/api/...`) |
| Entities | 15 |
| Enums | 5 (`UserRole`, `BookingStatus`, `AttendanceStatus`, `ProposalStatus`, `NotificationType`) |
| EF migrations | 12 (from `20260727054409_InitialCreate` to `20260730081029_AddAttendanceEntity`) |
| Services | 18 |
| Service interfaces | 18 (`StudentCenter.Application/Services/`) |
| DTOs | 58 (request + response) |
| Test files | 8 (~80 tests) |
| Frontend pages | 11 (App Router routes) |
| Frontend components | ~40 |
| Frontend service modules | 6 |
| Default admin seed | `admin@studentcenter.id` — password from `DEFAULT_ADMIN_PASSWORD` env var |
| JWT lifetime | 60 minutes |

---

## 9. Documentation Map

### MASTER docs (this series)

| # | Document | Content |
|---|---|---|
| 01 | [01_Project_Overview.md](01_Project_Overview.md) | **You are here** |
| 02 | [02_System_Architecture.md](02_System_Architecture.md) | End-to-end system view, request flow |
| 03 | [03_Frontend_Architecture.md](03_Frontend_Architecture.md) | Next.js app structure, data flow |
| 04 | [04_Backend_Architecture.md](04_Backend_Architecture.md) | Clean Architecture layers, DI, middleware |
| 05 | [05_Database_Architecture.md](05_Database_Architecture.md) | PostgreSQL schema, migrations, indexes |
| 06 | [06_Authentication.md](06_Authentication.md) | JWT login flow, token storage |
| 07 | [07_Authorization.md](07_Authorization.md) | Role matrix, endpoint access control |
| 08 | [08_API_Catalog.md](08_API_Catalog.md) | Full endpoint reference |
| 09 | [09_Entity_Catalog.md](09_Entity_Catalog.md) | Entity field reference |
| 10 | [10_Database_ERD.md](10_Database_ERD.md) | Entity-relationship diagrams |
| 11 | [11_Business_Rules.md](11_Business_Rules.md) | Domain rules & validations |
| 12 | [12_Feature_Flow.md](12_Feature_Flow.md) | Feature-by-feature flows |
| 13 | [13_Request_Response_Flow.md](13_Request_Response_Flow.md) | HTTP request/response lifecycle |
| 14 | [14_Sequence_Diagrams.md](14_Sequence_Diagrams.md) | Mermaid sequence diagrams |
| 15 | [15_Deployment_Guide.md](15_Deployment_Guide.md) | Deployment strategy & instructions |
| 16 | [16_CICD_Guide.md](16_CICD_Guide.md) | GitHub Actions workflows |
| 17 | [17_Configuration_Guide.md](17_Configuration_Guide.md) | appsettings, config keys |
| 18 | [18_Environment_Variables.md](18_Environment_Variables.md) | Env vars (backend + frontend) |
| 19 | [19_Project_Structure.md](19_Project_Structure.md) | Full folder trees |
| 20 | [20_Dependency_Graph.md](20_Dependency_Graph.md) | Project/package dependency graphs |
| 21 | [21_Code_Standards.md](21_Code_Standards.md) | Coding conventions |
| 22 | [22_Naming_Convention.md](22_Naming_Convention.md) | Naming rules per layer |
| 23 | [23_Testing_Guide.md](23_Testing_Guide.md) | Test approach, how to add tests |
| 24 | [24_Debugging_Guide.md](24_Debugging_Guide.md) | Common issues & debugging steps |
| 25 | [25_Known_Issues.md](25_Known_Issues.md) | Known bugs/limitations |
| 26 | [26_Technical_Debt.md](26_Technical_Debt.md) | Prioritized debt list |
| 27 | [27_Roadmap.md](27_Roadmap.md) | Future plan |
| 28 | [28_Project_Glossary.md](28_Project_Glossary.md) | Terms dictionary |
| 29 | [29_FAQ.md](29_FAQ.md) | Frequently asked questions |
| 30 | [30_DEVELOPER_BIBLE.md](30_DEVELOPER_BIBLE.md) | One-stop developer reference |

### Original knowledge base (`docs/`)

- `docs/Home.md` (index), `docs/Architecture/*`, `docs/Backend/*`, `docs/Database/*`, `docs/API/API Contract.md`, `docs/Entities/*`, `docs/Features/*`, `docs/Engineering/*`, `docs/Project/*`, `docs/Logs/Daily Log.md`.

---

*Cross-references: [02_System_Architecture](02_System_Architecture.md) · [19_Project_Structure](19_Project_Structure.md) · [docs/Home.md](../Home.md)*
