# Backend & Frontend Sync Agreement V1

Documenting answers and technical alignment between **Backend (.NET Clean Architecture)** and **Frontend (Next.js App Router)**.

---

## 1. Authentication Flow Alignment

| Item | Backend Answer | Frontend Implementation |
| :--- | :--- | :--- |
| **Authentication Type** | **JWT Bearer Token** (`Authorization: Bearer <jwt_token>`) | `src/lib/api.js` Axios request interceptor injects `Authorization: Bearer` header automatically. |
| **Token Storage** | Sent in JSON payload (`{ token, expiresAt, user }`) | Token stored in `localStorage` + `auth_token` cookie (for Next middleware route guards). |
| **Post-Login Profile Fetch** | **Not Required**. Login response already returns `user` object. | `AuthContext.jsx` saves `user` state directly from login response. `fetchProfile()` is only used for session re-verification on app load. |

---

## 2. User & Profile Schema

| Item | Backend Standard | Frontend Implementation |
| :--- | :--- | :--- |
| **User Identifier** | Generic string `identifier` (NIS / NISN / NIP / Admin ID) | `loginSchema.js` & `LoginForm.jsx` accept generic `identifier`. |
| **Role Enum** | String enum: `"Student"`, `"Teacher"`, `"OSIS"`, `"Admin"` | `USER_ROLES` constant & `AuthGuard` use matching string roles. |

---

## 3. Announcement (Mading) Module

| Item | Backend Standard | Frontend Implementation |
| :--- | :--- | :--- |
| **Category Filter** | String parameter (e.g. `?category=Olahraga`) | Filter pills send category string directly to `announcementService.getAnnouncements()`. |
| **Cover Image** | `imageUrl` (supports full URLs or `/uploads/...`) | Components handle `image` or `imageUrl` dynamically (`<img src={announcement.imageUrl || announcement.image}/>`). |
| **Attachments** | Backlog / Not yet implemented on backend | Handled gracefully (rendered conditionally only when present). |

---

## 4. Frontend Standards Answered to Backend

| # | Question from Backend | Frontend Architecture Standard |
| :-: | :--- | :--- |
| **1** | **Fetch vs Axios?** | **Axios Client (`src/lib/api.js`)** with global interceptors for Bearer headers, timeout, and response error formatting. |
| **2** | **Service Layer?** | **Global Service Layer (`src/services/`)**: `authService.js`, `announcementService.js`, `profileService.js`. UI components never make direct API calls. |
| **3** | **State Management?** | **React Context (`AuthContext.jsx`)** with `useAuth()` custom hook. |
| **4** | **API Response Standard?** | Unwrapped via Axios response interceptor (`{ success, statusCode, message, data }`). |
| **5** | **Cache Strategy?** | **TanStack Query** (`staleTime: 3-5 mins`, `keepPreviousData: true`). |
| **6** | **Error Handling?** | Centralized error formatting (400, 401, 403, 404, 422, 500), auto-logout on 401, `ErrorAlert` UI. |
| **7** | **UI States?** | All data pages support 4 UI states: **Loading Skeleton**, **Empty State ("Ups...")**, **Error Alert**, **Success Grid**. |
