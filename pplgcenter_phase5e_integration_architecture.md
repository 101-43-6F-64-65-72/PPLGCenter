# PPLG CENTER — PHASE 5E INTEGRATION ARCHITECTURE DOCUMENTATION

**Date:** 2026-08-13  
**Author:** Principal Software Architect / Senior .NET + Next.js + PostgreSQL Engineer  
**Status:** PHASE 5E COMPLETED & VERIFIED (Zero DB alterations, zero migrations, zero schema drift).

---

## 1. Final Module Map

```
PPLG CENTER APPLICATION TOPOLOGY
┌─────────────────────────────────────────────────────────────────────────┐
│ CORE ACTIVE MODULES (PPLG Primary Product):                             │
│ 1. Authentication & Identity (JWT, Login, Register, Refresh)            │
│ 2. Student Profile & Portfolio (Bio, Skills, Projects CRUD)             │
│ 3. Kelas & Struktur Divisi (4-Level Division Tree, Class Leadership)    │
│ 4. Jadwal & Kalender Akademik (Rotation Config, Academic Events)        │
│ 5. Perpustakaan (Book Catalog, Inventory, Borrowing Workflow)          │
│ 6. Fasilitas PPLG (Lab & Server Rooms, Multi-Teacher Managers, Booking) │
│ 7. Komunitas PPLG (Study Groups, Member Approvals, Group Messaging)    │
│ 8. Pengumuman / Mading (Announcements, Comments, Reactions)            │
│ 9. Proposal (Student Proposals, PDF Uploads, Teacher Review Workflow)   │
├─────────────────────────────────────────────────────────────────────────┤
│ SECONDARY / COMPATIBILITY MODULES:                                      │
│ 10-15. LMS & Gradebook (Materials, Assignments, Assessments, Attendance)│
│ 16. Academic Discussion Forum (DiscussionThreads & Replies)             │
│ 17. Legacy Direct Messaging (1-on-1 Direct Conversations & Messages)     │
├─────────────────────────────────────────────────────────────────────────┤
│ DEPRECATED CANDIDATES (Out of PPLG UI Scope):                           │
│ 18-20. OSIS Recruitment, Pemilos Elections, Non-PPLG Extracurriculars    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (Next.js 16 App Router)

- **Framework:** Next.js 16 (App Router with Client/Server component separation).
- **Styling & UI:** Vanilla CSS + TailwindCSS utility classes, glassmorphism, responsive flex/grid layouts.
- **State Management:** React Context (`AuthContext.jsx`) for identity and permission state.
- **API Client:** Axios singleton (`frontend/src/lib/api.js`) with automatic Bearer token injection and global HTTP error handling.
- **Deployment Target:** Vercel CDN Singleton.

---

## 3. Backend Architecture (ASP.NET Core / .NET 10)

- **Layering Pattern:** 
  - `StudentCenter.Api` (REST API Controllers, JWT Middleware, Request Validation)
  - `StudentCenter.Application` (DTOs, Interfaces, Service Contracts)
  - `StudentCenter.Infrastructure` (EF Core DbContext, PostgreSQL Data Access, Cloudinary Gateway)
  - `StudentCenter.Domain` (Domain Entities, Enums, Value Objects)
- **Deployment Target:** Render Web Service Singleton.

---

## 4. API Boundary

- **Communication Protocol:** Stateless HTTPS REST API (JSON payload formats).
- **Base Endpoint Mapping:**
  - `/api/Auth` — Authentication & JWT Issuance
  - `/api/StudentProfiles` — Student Profile & Portfolio Showcase
  - `/api/ClassDivisions` & `/api/ClassLeadership` — Division Hierarchy Tree
  - `/api/Schedules` & `/api/ScheduleRotation` — Schedule Rotation Grids
  - `/api/Books` — Library Catalog & Borrow Requests
  - `/api/Facilities` — Lab PPLG & Server Room Reservations
  - `/api/CommunityGroups` & `/api/CommunityMessages` — PPLG Community Chat
  - `/api/Announcements` — Announcements & Mading Feed
  - `/api/Proposals` — Student Activity Proposals
  - `/api/Upload` — Cloudinary Signed Upload Gateway

---

## 5. Auth Boundary

- **Token Format:** HMAC-SHA256 Signed Bearer JWT Tokens.
- **Payload Claims:** `NameIdentifier` (UserId), `Email`, `Role`, `FullName`.
- **Identity Hydration:** `/api/Auth/login` returns user profile, role, capability permission strings, and accepted `CommunityGroups`.

---

## 6. Permission Boundary

- **Authoritative Security Boundary:** ASP.NET Core controllers and domain services enforce security rules via `[Authorize]` attributes and `IUserPermissionService`.
- **Frontend Permission Guard:** `AuthContext` and `permissions.js` serve exclusively as UX helpers to show/hide UI buttons.
- **IDOR Safeguard:** Resource mutation operations derive student identity directly from token claims (`ICurrentUserService.UserId`).

---

## 7. Cloudinary Upload Architecture

```
Next.js Client (Browser)
     │
     │ 1. POST /api/upload (Multipart FormData + Bearer JWT)
     ▼
ASP.NET Core UploadController (Render)
     │
     │ 2. Authenticates JWT & reads CLOUDINARY__APISECRET from backend/.env
     │ 3. Generates SHA-1 signature server-side
     ▼
Cloudinary CDN API (https://api.cloudinary.com/v1_1/{cloud_name}/image/upload)
     │
     │ 4. Returns secure CDN URL (https://res.cloudinary.com/...)
     ▼
ASP.NET Core UploadController
     │
     │ 5. Returns { url: "https://res.cloudinary.com/..." } to Frontend Client
     ▼
Next.js Client
```

- **Security Verification:** Zero Cloudinary API secrets exist in frontend code or environment templates.

---

## 8. Supabase PostgreSQL Relationship

- **Database Topology:** Dedicated Supabase PostgreSQL instance (`rwopazhqgvvrosdizmvt`).
- **Table Count:** 59 public tables (14 PPLG foundation tables co-existing alongside 45 inherited Student Center tables).
- **Foreign Key Integrity:** Enforced across all entities via EF Core mappings.

---

## 9. Legacy Compatibility Strategy

- **OSIS / Pemilos / Extracurriculars:** Backend controllers (`ElectionsController`, `OsisRecruitmentController`, `ExtracurricularsController`) and EF Core `DbSets` remain active in backend DI for test suite compatibility. UI navigation entry points are 100% decoupled.
- **Legacy Direct Messaging:** `MessageService.cs` and `MessagesController.cs` remain active as fallback compatibility for 1-on-1 direct messaging. PPLG Community features default to `CommunityGroups` and `GroupMessages`.

---

## 10. Environment Configuration Strategy

- **Development:** `backend/.env` loaded locally by `Program.cs` for local testing.
- **Production Deployment:**
  - Vercel (Frontend): Sets `NEXT_PUBLIC_API_BASE_URL=https://<your-render-backend>.onrender.com`
  - Render (Backend): Sets `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY__CLOUDNAME`, `CLOUDINARY__APIKEY`, `CLOUDINARY__APISECRET`.

---

## 11. Deployment Architecture

```
           Users (Browsers / Mobile)
                       │
                       ▼
            ┌─────────────────────┐
            │ Vercel CDN Singleton│ (Next.js 16 App Router)
            └──────────┬──────────┘
                       │ HTTPS REST API
                       ▼
            ┌─────────────────────┐
            │ Render Web Service  │ (ASP.NET Core Web API)
            └──────┬───────┬──────┘
                   │       │
    PostgreSQL SQL │       │ SHA-1 Upload Gateway
                   ▼       ▼
       ┌──────────────┐ ┌─────────────┐
       │ Supabase DB  │ │ Cloudinary  │
       └──────────────┘ └─────────────┘
```

---

## 12. Technical Debt & Deferred Cleanup Items

1. **Dual Facility Managers:** Co-existence of scalar `Facility.ManagerTeacherId` and `FacilityManagers` join table (synchronized atomically in `FacilityService`).
2. **Unlinked Legacy Pages:** Physical existence of `/pemilos` and `/osis` page files in `frontend/src/app/` (ready for optional deletion or redirect in Phase 6).

---

## 13. Known Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Direct URL access to unlinked pages (`/pemilos`) | Low | Server-side ASP.NET Core authorization guards all endpoints (`401`/`403`). |
| DB write contention on group chat under high concurrency | Medium | Group messaging pagination capped at 100 items per page; Redis caching planned for Phase 6+. |

---

## 14. Consolidated Verification Results

- **Backend Release Build (`dotnet build backend/StudentCenter.slnx -c Release`):** **SUCCESS (0 Errors, 0 Warnings)**
- **Backend Unit Test Suite (`dotnet test`):** **SUCCESS (147/147 Passed, 0 Failed, 0 Skipped)**
- **Frontend Production Build (`npm run build`):** **SUCCESS (28/28 App Router routes compiled & prerendered cleanly)**
- **Cloudinary Security Audit:** **100% CLEAN (Zero API secrets in client code or tracked templates)**

---

## 15. Recommended Phase 6 Scope

- Execute **Phase 6 — E2E Playwright Automation, Security Verification, and Final Production Hardening Audit**.
