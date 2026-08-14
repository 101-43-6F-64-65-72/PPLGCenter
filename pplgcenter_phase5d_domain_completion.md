# PPLG CENTER — PHASE 5D DOMAIN COMPLETION & STRUCTURAL BUILD REPORT

**Date:** 2026-08-13  
**Auditor:** Principal Software Architect / Senior .NET + Next.js + PostgreSQL Engineer  
**Mode:** DOMAIN COMPLETION & STRUCTURAL BUILD (Zero DB alterations, zero migrations, zero schema drift).

---

## 1. Structural Inventory

The structural audit mapped all 9 core PPLG Center modules across the application architecture:

```
Next.js 16 App Router (Vercel)
          │
          │ HTTPS REST API (Bearer JWT / JSON)
          ▼
ASP.NET Core Web API (Render)
          │
          ├──── Application Services Layer
          ├──── Infrastructure Layer (EF Core 10)
          ├──── Supabase PostgreSQL (Dedicated PPLG Center DB - 59 Public Tables)
          └──── Cloudinary CDN (Signed SHA-1 Gateway `/api/upload`)
```

- **Backend Layers:** `StudentCenter.Api`, `StudentCenter.Application`, `StudentCenter.Infrastructure`, `StudentCenter.Domain`.
- **Frontend App Router:** 28 static & dynamic routes in `frontend/src/app`.
- **Database Context:** Supabase PostgreSQL (`rwopazhqgvvrosdizmvt`) with 59 public tables.

---

## 2. Backend Changes

- **API Route Alignment:** Added `[HttpPost("send")]` route attribute to `CommunityMessagesController.cs` so that both `POST /api/CommunityMessages` and `POST /api/CommunityMessages/send` resolve cleanly.
- **In-Memory Test Compatibility:** Guarded transaction creation in `GroupMessageService.cs` (`_context.Database.IsRelational() ? await _context.Database.BeginTransactionAsync() : null`), ensuring compatibility with both PostgreSQL production and EF Core In-Memory test providers.
- **Unit Test Expansion:** Added `StudentCenter.Tests/GroupMessageServiceTests.cs` to test group membership authorization enforcement and message envelope creation.

---

## 3. Frontend Changes

- **Primary Navigation (`Navbar.jsx`):** Cleaned primary menu to display **PPLG Center** branding and active PPLG routes (`/kelas`, `/perpustakaan`, `/komunitas`, `/fasilitas`, `/profile`, `/proposal`, `/mading`, `/kalender`).
- **Cloudinary Upload Wrapper (`cloudinaryService.js`):** Confirmed all file upload calls route strictly through backend `POST /api/upload`. Zero client-side API secrets.

---

## 4. API Contract Changes

All 9 Core PPLG Frontend Services map 1-to-1 with ASP.NET Core controllers:

| Frontend Service File | Target Controller Route | HTTP Methods | Auth Guard |
|---|---|---|---|
| `authService.js` | `/api/Auth` | `POST /login`, `POST /register`, `POST /refresh-token` | Public |
| `studentProfileService.js` | `/api/StudentProfiles` | `GET /me`, `PUT /me`, `POST/PUT/DELETE /me/projects` | `[Authorize]` |
| `classTreeService.js` | `/api/ClassDivisions`, `/api/ClassLeadership` | `GET /tree`, `POST`, `PUT`, `DELETE`, `GET /active` | `[Authorize]` |
| `scheduleService.js` | `/api/Schedules`, `/api/ScheduleRotation` | `GET`, `POST`, `GET /config` | `[Authorize]` |
| `bookService.js` | `/api/Books` | `GET`, `GET /{id}`, `POST /borrow`, `GET /borrow-requests` | `[Authorize]` |
| `facilityService.js` | `/api/Facilities` | `GET`, `POST /managers`, `DELETE /managers/{id}`, `POST /bookings` | `[Authorize]` |
| `communityService.js` | `/api/CommunityGroups` | `GET`, `POST`, `POST /{id}/join`, `GET /{id}/members` | `[Authorize]` |
| `groupMessageService.js` | `/api/CommunityMessages` | `GET /group/{groupId}`, `POST /send` | `[Authorize]` |
| `announcementService.js` | `/api/Announcements` | `GET`, `GET /{id}`, `POST /{id}/comments`, `POST /{id}/reactions` | `[Authorize]` |
| `proposalService.js` | `/api/Proposals` | `GET`, `POST`, `PUT /{id}/review-*` | `[Authorize]` |

---

## 5. Auth & Capability Verification

- **Server Security Boundary:** All authorization rules are enforced authoritatively on ASP.NET Core controllers and domain services using `[Authorize]` attributes and `IUserPermissionService`.
- **Identity Hydration:** `LoginResponse` returns authenticated user identity, role, permission capabilities (`string[]`), and accepted `CommunityGroups`.
- **IDOR Protection:** Verified that student profile updates (`PUT /api/StudentProfiles/me`) derive user identity directly from JWT claims (`ICurrentUserService.UserId`).

---

## 6. Cloudinary Verification

- **Git-Ignored Secrets:** `CLOUDINARY__CLOUDNAME`, `CLOUDINARY__APIKEY`, and `CLOUDINARY__APISECRET` are stored exclusively in `backend/.env`.
- **Template Cleanliness:** `backend/.env.example` contains placeholders only (`CLOUDINARY__CLOUDNAME=`).
- **Zero Client Exposure:** No `NEXT_PUBLIC_CLOUDINARY_API_SECRET` or raw credential strings exist in client code.

---

## 7. Core Module Completion Matrix

| Core Module | Backend Controller | Frontend Route | Loading / Empty State | Status |
|---|---|---|---|---|
| **1. Auth & Identity** | `AuthController.cs` | `/login`, `AuthContext` | YES | **COMPLETE** |
| **2. Student Profile & Portfolio** | `StudentProfilesController.cs` | `/profile` | YES | **COMPLETE** |
| **3. Kelas & Struktur Divisi** | `ClassDivisionsController.cs` | `/kelas` | YES | **COMPLETE** |
| **4. Jadwal & Kalender** | `ScheduleRotationController.cs` | `/kalender` | YES | **COMPLETE** |
| **5. Perpustakaan** | `BooksController.cs` | `/perpustakaan` | YES | **COMPLETE** |
| **6. Fasilitas PPLG** | `FacilitiesController.cs` | `/fasilitas` | YES | **COMPLETE** |
| **7. Komunitas PPLG** | `CommunityGroupsController.cs` | `/komunitas` | YES | **COMPLETE** |
| **8. Pengumuman / Mading** | `AnnouncementsController.cs` | `/mading` | YES | **COMPLETE** |
| **9. Proposal** | `ProposalsController.cs` | `/proposal` | YES | **COMPLETE** |

---

## 8. Secondary & Compatibility Modules

- **LMS & Academic Gradebook (10-15):** Materials, Assignments, Submissions, Assessments, Grades, AttendanceSessions, Attendances are maintained as-is without database modification.
- **Academic Discussion Forum (16):** `DiscussionThreads` and `DiscussionReplies` retained for academic and proposal discussions.
- **Legacy Direct Messaging (17):** Retained as fallback compatibility for 1-on-1 direct user messaging.

---

## 9. Deprecated Modules

- **OSIS Recruitment & Cabinet:** Kept intact in code and DB for backward compatibility; hidden from PPLG navigation.
- **Pemilos / Elections:** Kept intact in code and DB for backward compatibility; hidden from PPLG navigation.
- **Non-PPLG Extracurricular Clubs:** Kept intact in code and DB for backward compatibility; hidden from PPLG navigation.

---

## 10. Technical Debt & Known Limitations

- **Dual Facility Manager Fields:** Scalar `Facility.ManagerTeacherId` co-exists with `FacilityManagers` join table (synchronized in `FacilityService`).
- **Unlinked Legacy Page Files:** Physical existence of `/pemilos` and `/osis` page files in `frontend/src/app/`.

---

## 11. Full Verification Results

- **Backend Release Build (`dotnet build backend/StudentCenter.slnx -c Release`):** **SUCCESS (0 Errors, 0 Warnings)**
- **Backend Unit Tests (`dotnet test`):** **SUCCESS (147 Passed, 0 Failed, 0 Skipped)**
- **Frontend Production Build (`npm run build`):** **SUCCESS (28/28 static & dynamic App Router routes compiled & prerendered cleanly)**

---

## 12. Recommended Phase 5E Actions

- Perform UI polish, error message localization, and prepare end-to-end integration testing manifests for production deployment on Vercel and Render.

---

## 13. Final Architecture Gate

### **A. READY FOR PHASE 5E**

---

## Final Safety Verification

Database Modified: **NO**  
Migration Created: **NO**  
Migration Applied: **NO**  
Tables Dropped: **NO**  
Data Modified: **NO**  
Git Commit: **NO**  
Git Push: **NO**  
Deploy: **NO**  
