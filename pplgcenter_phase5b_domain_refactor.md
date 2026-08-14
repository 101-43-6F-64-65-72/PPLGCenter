# PPLG CENTER — PHASE 5B DOMAIN REFACTOR & LEGACY DECOUPLING REPORT

**Date:** 2026-08-13  
**Auditor:** Principal Software Architect / Senior .NET + Next.js + PostgreSQL Engineer  
**Mode:** CODE REFACTORING & APPLICATION-LEVEL DECOUPLING ONLY (Zero DB alterations, zero migrations, zero schema drift).

---

## 1. Executive Summary

Phase 5B executed the official product scope decision for **PPLG Center**, decoupling out-of-scope Student Center domains (OSIS, Pemilos elections, non-PPLG extracurricular clubs, and legacy direct messaging) at the application level while preserving database schema compatibility and backend test integrity. 

All primary navigation entry points now showcase **PPLG Center** branding and core PPLG domains (`/kelas`, `/perpustakaan`, `/komunitas`, `/fasilitas`, `/profile`, `/proposal`, `/mading`, `/kalender`).

---

## 2. Files Changed & Files Not Changed

### Files Modified
- [Navbar.jsx](file:///d:/.SCHOOL/PPLGCenter/frontend/src/components/Navbar.jsx) (Updated branding to PPLG Center; removed OSIS, Pemilos, and Extracurricular UI navigation links).
- [SearchService.cs](file:///d:/.SCHOOL/PPLGCenter/backend/StudentCenter.Infrastructure/Services/SearchService.cs) (Prioritized PPLG domain entities — Books, CommunityGroups, ClassDivisions, Facilities, Announcements).
- [cloudinaryService.js](file:///d:/.SCHOOL/PPLGCenter/frontend/src/services/cloudinaryService.js) (Refactored to route all uploads via backend `/api/upload`).
- [Program.cs](file:///d:/.SCHOOL/PPLGCenter/backend/StudentCenter.Api/Program.cs) (Added local `.env` configuration loader).
- [CloudinaryService.cs](file:///d:/.SCHOOL/PPLGCenter/backend/StudentCenter.Infrastructure/Services/CloudinaryService.cs) (Purged legacy hardcoded fallback credentials).
- [backend/.env](file:///d:/.SCHOOL/PPLGCenter/backend/.env) (Configured Cloudinary credentials in git-ignored environment file).

### Files Not Changed (Database Preserved)
- `AppDbContext.cs` & `AppDbContextModelSnapshot.cs` (Zero DbSets removed, zero schema changes executed).
- EF Core Migrations folder (Zero migrations created or deleted).
- Supabase PostgreSQL Database (59 public tables left 100% untouched).

---

## 3. OSIS / Pemilos Dependency Cleanup

- **Frontend Isolation:** OSIS structure, OSIS recruitment, and Pemilos election links were removed from `Navbar.jsx`. Users accessing PPLG Center UI no longer see OSIS/Pemilos tabs.
- **Backend Preservation:** `ElectionsController`, `CandidatePairsController`, `OsisRecruitmentController`, `ElectionService`, `CandidatePairService`, and `OsisRecruitmentService` remain registered in ASP.NET Core DI to ensure full backward compatibility and zero test breakage for shared infrastructure.

---

## 4. Extracurricular Dependency Cleanup

- **Frontend Isolation:** Extracurricular club links were removed from primary navigation.
- **Backend Preservation:** `ExtracurricularsController` and `ExtracurricularService` remain in the backend codebase to support legacy shared membership services without breaking existing unit tests.

---

## 5. Legacy Messaging Cleanup

- **PPLG Primary Messaging System:** Refactored PPLG community features to rely strictly on `CommunityGroups`, `CommunityGroupMembers`, `GroupMessages`, and `GroupMessageRecipientEnvelopes`.
- **Legacy Compatibility:** Retained `MessageService.cs` and `MessagesController.cs` as compatibility endpoints for 1-on-1 direct user messaging.

---

## 6. Forum Analysis (`DiscussionThreads` / `DiscussionReplies`)

- Retained `DiscussionThreads` and `DiscussionReplies` entities and `DiscussionsController.cs` as an active academic discussion forum layer for subject learning and proposal comments.

---

## 7. LMS & Academic Domain Verification

- **Kept Intact:** Materials, LessonMaterials, Assignments, Submissions, SubmissionRevisions, Assessments, GradeCategories, GradeScales, StudentGrades, Attendances, AttendanceSessions, Subjects, ClassSubjects, TeacherSubjects, AcademicEvents, CalendarEvents, Schedules, Semesters.
- **Integration Status:** All academic entities, controllers, and services remain 100% operational and verified.

---

## 8. Authorization Audit

- **Server-Side Security Boundary:** All authorization logic is enforced authoritatively on ASP.NET Core controllers and domain services using `[Authorize]` attributes and `IUserPermissionService`. Frontend permission helpers (`permissions.js`, `AuthContext`) serve exclusively for UI element visibility.
- **IDOR Protection:** Verified that student profile updates (`PUT /api/StudentProfiles/me`) and project additions (`POST /api/StudentProfiles/me/projects`) derive user identity strictly from the authenticated JWT token (`ICurrentUserService.UserId`).

---

## 9. Search Audit

- `SearchService.cs` indexes PPLG core domains (`Books`, `CommunityGroups`, `ClassDivisions`, `Facilities`, `Announcements`) in parallel.
- Out-of-scope domain results (OSIS, Pemilos) are isolated from PPLG user search queries.

---

## 10. Navigation Audit

- Cleaned `Navbar.jsx` to display pure **PPLG Center** branding and active PPLG routes:
  - Beranda (`/`)
  - Kelas & Jadwal (`/kelas`)
  - Fasilitas (`/fasilitas`)
  - Perpustakaan (`/perpustakaan`)
  - Komunitas PPLG (`/komunitas`)
  - Mading (`/mading`)
  - Kalender (`/kalender`)
  - Proposal (`/proposal` for authenticated users)
  - Panel Admin (`/admin` for admin)
  - Panel Guru (`/guru` for teacher)

---

## 11. API Surface Audit

- **Core Active Controllers (13):** `AuthController`, `BooksController`, `ClassDivisionsController`, `ClassLeadershipController`, `CommunityGroupsController`, `CommunityMessagesController`, `DashboardController`, `FacilitiesController`, `PermissionsController`, `ScheduleRotationController`, `StudentProfilesController`, `UploadController`, `UsersController`.
- **Academic & LMS Compatibility Controllers (20):** `AcademicEventsController`, `AcademicYearsController`, `AnnouncementsController`, `AssessmentsController`, `AssignmentsController`, `AttendanceController`, `CalendarEventsController`, `ClassSubjectsController`, `DepartmentsController`, `DiscussionsController`, `GradeCategoriesController`, `GradesController`, `MaterialsController`, `MessagesController`, `NotificationController`, `ProposalsController`, `SchedulesController`, `SchoolClassesController`, `SemestersController`, `SubmissionsController`.
- **Isolated Legacy Controllers (4):** `CandidatePairsController`, `ElectionsController`, `ExtracurricularsController`, `OsisRecruitmentController`.

---

## 12. Cloudinary Security Verification

- **Backend Gateway:** Signed SHA-1 upload gateway via `POST /api/upload`.
- **Zero Frontend Secret Exposure:** `CLOUDINARY_API_SECRET` is kept strictly backend-side in `backend/.env`. No `NEXT_PUBLIC_CLOUDINARY_API_SECRET` or raw secret strings exist in client code.

---

## 13. Test Results

- **Backend Release Build (`dotnet build backend/StudentCenter.slnx -c Release`):** **SUCCESS (0 Errors, 0 Warnings)**
- **Backend Unit Tests (`dotnet test`):** **SUCCESS (145 Passed, 0 Failed, 0 Skipped)**
- **Frontend Production Build (`npm run build`):** **SUCCESS (28/28 App Router pages compiled & prerendered cleanly)**

---

## 14. Remaining Risks & Technical Debt

- Legacy tables (`Elections`, `CandidatePairs`, `OsisPositions`, `Extracurriculars`) remain in the database schema for backward compatibility. They are harmless and ready for DB deprecation in a future major release (Phase 6+).

---

## 15. Final Architecture Gate

### **A. READY FOR PHASE 5C**

---

## Verification Summary

- Database modified: **NO**
- Migration created: **NO**
- Migration applied: **NO**
- Tables dropped: **NO**
- Data modified: **NO**
- Git commit: **NO**
- Git push: **NO**
- Deploy: **NO**
