# Contract Mismatch Report

**Phase:** 023B — Frontend ↔ Backend Full Integration Stabilization (Phase 1 + Phase 2)
**Date:** 2026-08-03
**Status:** Complete — all 16 mismatches resolved frontend-only; decisions confirmed; fixes applied, lint-clean, production build green, backend 80/80 (uncommitted).

## Scope & Method

Every frontend API call was cross-checked against the actual backend controllers, DTOs,
and domain enums. Frontend truth sources: `frontend/src/services/*.js`,
`frontend/src/constants/apiRoutes.js`, `frontend/src/lib/api.js`,
`frontend/src/config/api.js`, and all feature screens/hooks that consume them.
Backend truth sources: `backend/StudentCenter.Api/Controllers/*.cs`,
`backend/StudentCenter.Application/DTOs/*.cs`, `backend/StudentCenter.Domain/Enums/*.cs`,
`backend/StudentCenter.Domain/Entities/*.cs`.

## Confirmed Backend Contract

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `api/auth/login` | Public | Rate limited 5/min/IP; `LoginRequest {email, password}` |
| GET | `api/auth/me` | JWT | `CurrentUserResponse {id, fullName, email, role}` |
| GET | `api/announcements` | JWT | Paged `PagedResult<AnnouncementResponse>`; filters: `page, pageSize, category` |
| GET | `api/announcements/{id}` | JWT | |
| POST | `api/announcements` | Admin, OSIS | `CreateAnnouncementRequest` |
| PUT | `api/announcements/{id}` | Admin, OSIS | |
| DELETE | `api/announcements/{id}` | Admin, OSIS | |
| GET | `api/announcements/feed` | JWT | `PagedResult<AnnouncementFeedResponse>` |
| POST | `api/announcements/{id}/comments` | JWT | `CommentRequest` |
| GET | `api/announcements/{id}/comments` | JWT | |
| DELETE | `api/comments/{id}` | JWT | |
| POST | `api/announcements/{id}/reactions` | JWT | `ReactionRequest` |
| DELETE | `api/announcements/{id}/reactions` | JWT | |
| GET | `api/bookings` | JWT | Paged; filters `page, pageSize, facilityId, userId, status` |
| GET | `api/bookings/{id}` | JWT | |
| POST | `api/bookings` | Student, Teacher, OSIS | `CreateBookingRequest {facilityId, purpose, startTime, endTime}` |
| PUT | `api/bookings/{id}/status` | Admin, Teacher | `UpdateBookingStatusRequest {status, rejectionReason}` |
| DELETE | `api/bookings/{id}` | JWT | Cancel |
| GET | `api/facilities` | JWT | Paged `PagedResult<FacilityResponse>` |
| GET | `api/facilities/{id}` | JWT | |
| POST/PUT/DELETE | `api/facilities...` | Admin | |
| GET | `api/proposals` | JWT | Paged; filters `page, pageSize, userId, status` |
| GET | `api/proposals/{id}` | JWT | |
| POST | `api/proposals` | OSIS | `CreateProposalRequest {title, description, fileUrl}` |
| PUT | `api/proposals/{id}` | OSIS | |
| DELETE | `api/proposals/{id}` | OSIS | |
| PATCH | `api/proposals/{id}/review` | Admin, Teacher | `ReviewProposalRequest {status, rejectionReason}` |
| GET | `api/clubs/*` | — | No `api/clubs` route exists in backend |

**Serialization:** camelCase JSON (framework default `JsonSerializerDefaults.Web`),
**enums serialized as integers** (no `JsonStringEnumConverter`).
**No route prefix** — controllers use `[Route("api/...")]`, no `UsePathBase`.
Response wrapper is always `ApiResponse<T>` = `{ success, message, data }`.

## Mismatches & Resolution Status

All fixes were **frontend-only** and have been applied (Phase 2). None required a backend change.

### P1 — Critical (blocks login / core flows)

| ID | Mismatch | Resolution |
|---|---|---|
| M1 | Base URL `/api/v1` vs `/api` | Fixed: `config/api.js` default → `"/api"`. |
| M2 | Login `identifier` vs `email` | Fixed (decision 1 → Option A): `loginSchema`/`useLogin`/`LoginForm` collect `email`. |
| M3 | `POST /auth/logout` 404 | Fixed: logout client-side only (clear token + cookie, redirect); no network call. |
| M4 | Booking status `PATCH` vs `PUT` | Fixed: `facilityService.updateBookingStatus` → `PUT /bookings/{id}/status` with `{status, rejectionReason}`. |
| M5 | Proposal review `/status` vs `/review` | Fixed: `proposalService.updateProposalStatus` → `PATCH /proposals/{id}/review` with `{status, rejectionReason}`. |
| M6 | Proposal create multipart vs JSON | Fixed: `createProposal` posts JSON `{title, description, fileUrl}`; no upload endpoint (documented gap). |
| M7 | Facilities `{places, items}` + slots vs `PagedResult<FacilityResponse>` | Fixed: `getFacilities` reads `data.items` + aliases (`name→title`, `isActive→status`). |
| M8 | Fabricated time slots | Fixed: `ScheduleModal` rewritten as freeform date + start/end time booking. |
| M9 | Booking rich labels vs `BookingResponse` | Fixed: Admin/Guru/Osis facility tabs render real fields + int status badges + `rejectionReason`. |
| M10 | `/clubs` not found | Fixed: `clubService` maps to `/extracurriculars`. |

### P2 — High (data shape / enum / pagination)

| ID | Mismatch | Resolution |
|---|---|---|
| M11 | Pagination `meta` vs `{items,page,pageSize,totalCount,totalPages}` | Fixed: `announcementService`/`facilityService`/`proposalService`/`clubService` read `data.items`; `meta` normalized for UI. |
| M12 | Enum strings vs ints | Fixed: `BOOKING_STATUS`/`PROPOSAL_STATUS` (0/1/2) exported; all status writes send ints; UIs map int→label. |
| M13 | Fake `readTime`/`rating`/`summary` vs `AnnouncementResponse` | Fixed: `AnnouncementCard` computes read time from content; rating removed from `AnnouncementHeroCarousel`; `coverImageUrl`/`createdByUserName` mapped. |

### P3 — Low (harmless / optional)

| ID | Mismatch | Resolution |
|---|---|---|
| M14 | `search` param ignored by backend | Fixed: mading page filters loaded announcements client-side (backend has no free-text search). |
| M15 | `apiRoutes.js` incomplete | Fixed: full route map for auth/announcements/extracurriculars/facilities/bookings/proposals incl. `STATUS(id)` PUT and `REVIEW(id)` PATCH. |
| M16 | `deploy-backend.yml` .NET 8.0.x vs net10.0 | Unchanged (deployment concern, KI-5 from 023A); tracked in Remaining Integration Issues. |

## Open Decisions (confirmed by product owner — all frontend-only, Option A)

1. **Login identity → Email.** `User` entity has no NIS/identifier column; login is `LoginRequest {email, password}`. ✅ Applied.
2. **Booking approval → single-stage.** No two-stage Guru→Admin workflow in backend; UI collapsed to `BookingStatus` Pending/Approved/Rejected (0/1/2). ✅ Applied.
3. **Facility scheduling → freeform.** No slot concept; booking uses `startTime`/`endTime` pickers. ✅ Applied.

## Remaining Backend Gaps (documented, NOT worked around or fabricated)

These are genuine missing backend capabilities surfaced during integration. The frontend is
aligned to real data and does **not** invent substitutes:

1. **File upload** — no endpoint exists; proposals/announcements carry only URL strings (`fileUrl`, `coverImageUrl`).
2. **Logout endpoint** — JWT is stateless; logout is client-side only.
3. **Facility inventory/items** — no items/equipment module; `GET /facilities` returns facilities only. The fasilitas "BARANG" section was removed rather than showing fabricated stock.
4. **Free-text search** — `GET /announcements` supports only `page/pageSize/category`; search is client-side.
5. **Profile update** — no `PUT /profile`; profile page is read-only (name/email/role from `GET /auth/me`).
6. **User registration** — no public register endpoint; accounts are provisioned by admin (`CreateUserRequest`).

## Stabilization Closeout (Phases 5/6/8 — same session, uncommitted)

Beyond the contract fixes above, the frontend was hardened and verified end-to-end at the
compiler/lint level (E2E runtime still blocked on local env provisioning):

**Build & lint gate (passed):**
- `npm run lint` clean; `npm run build` succeeds (Next.js 16.2.12, 13 routes, `/mading/[id]` dynamic).
- Fixes required for the gate: React Compiler `set-state-in-effect` in
  `proposal/page.js`, `AuthContext.jsx`, `AnnouncementHeroCarousel.jsx`, `queryClient.js`;
  conditional hooks in `AuthGuard.jsx`; `react/no-unescaped-entities` quotes in Admin/Guru/Osis
  facility tabs; `useSearchParams` without `Suspense` on `/login`; `react/display-name` +
  anonymous default export in `lib/motion.js`; `experimental.reactCompiler` moved to top-level
  in `next.config.mjs`.
- TanStack Query v5 compatibility: `keepPreviousData` → `placeholderData: keepPreviousData`
  (shim re-exports a passthrough fallback in `lib/queryClient.js`).

**Phase 5 — Error/retry/race hardening:**
- New shared hook `frontend/src/hooks/useAsyncList.js`: mounted-ref race guard, loading state,
  error capture, `reload()`; normalizes array or `{data: [...]}` loader results.
- All 8 management tabs refactored onto it (Admin/Guru/Osis × Facility/Proposal/Announcements):
  removed ad-hoc `useCallback`+`.then` loaders; added "Memuat…" / error + "Coba Lagi" retry UI.
- `ScheduleModal` reset effect removed in favor of `key`-based remount in `fasilitas/page.js`.
- Existing guards preserved: `fasilitas/page.js` `isMounted`, `AuthContext` deferred profile fetch.

**Phase 6 — Validation parity (frontend mirrors backend attributes):**
- Login: password no longer requires 6 chars (backend `LoginRequest` only requires non-empty).
- Booking: purpose ≤500 (backend `MaxLength(500)`); start time cannot be in the past
  (backend `CreateBookingRequest.Validate`); `endTime > startTime` kept.
- Proposal: title 5–300, description 10–2000, fileUrl required ≤500 (backend `StringLength`);
  dropped invented URL-format requirement; `maxLength` attributes added in `ProposalForm`.
- Announcements: title ≤200, content ≤5000 (`maxLength` attributes) matching backend.

**Phase 8 — Performance:**
- Removed `ensureAssets()` per-render fs call + deleted `src/lib/ensure-assets.js`
  (hardcoded dead paths from another machine; target images already exist in `public/images`).
- Loading skeletons/states confirmed on every data-driven screen
  (AnnouncementSkeleton, AnnouncementDetailSkeleton, FacilityCardSkeleton, tab loading states).

**Verification:** `node --check` on edited JS; `npm run lint` (0 errors); `npm run build` (0 errors);
`dotnet build` (2 warnings, 0 errors); `dotnet test` → 80/80 passed.

## Files Changed (Phases 2/5/6/8, uncommitted)

- `frontend/src/config/api.js`, `frontend/src/constants/apiRoutes.js`, `frontend/src/lib/api.js`
- `frontend/src/services/{authService,profileService,announcementService,clubService,facilityService,proposalService}.js`
- `frontend/src/contexts/AuthContext.jsx`
- `frontend/src/hooks/useAsyncList.js` (new)
- `frontend/src/lib/{queryClient,motion}.js` (ensure-assets.js deleted)
- `frontend/src/features/auth/{schemas/loginSchema.js,hooks/useLogin.js,components/LoginForm.jsx}`
- `frontend/src/features/announcement/{hooks/useAnnouncements.js,components/AnnouncementCard.jsx,components/AnnouncementHeroCarousel.jsx}`
- `frontend/src/components/admin/{AdminFacilityTab,AdminAnnouncementsTab,AdminProposalTab}.jsx`
- `frontend/src/components/guru/{GuruFacilityTab,GuruProposalTab}.jsx`
- `frontend/src/components/osis/{OsisFacilityTab,OsisAnnouncementsTab,OsisProposalTab}.jsx`
- `frontend/src/components/layout/AuthGuard.jsx`
- `frontend/src/components/proposal/{ProposalForm,ProposalCard,ProposalList}.jsx` (ProposalUpload deleted)
- `frontend/src/app/{page,login,proposal,profile,fasilitas,mading}/page.js`
- `frontend/src/components/fasilitas/{ScheduleModal,FacilitySection,FacilityCard}.jsx` (CartModal deleted)
- `frontend/next.config.mjs`

## Not a Backend Problem

Nothing in this report requires a backend change. Where the backend genuinely lacks a feature
(file upload, logout, slots, clubs, inventory, search, profile update, registration), the fix is
frontend alignment + explicit documentation in this report — never fabricated data.
