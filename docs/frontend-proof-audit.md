# PHASE 022A — PROOF AUDIT REPORT

**Project:** Student Center SMKN 2 Surakarta  
**Audit Date:** 3 Agustus 2026  
**Type:** PROOF AUDIT (READ ONLY)  

---

# 1. AUTH PROOF

### ✓ AuthContext
- **Path:** `frontend/src/contexts/AuthContext.jsx`
- **Proof / Implementation:**
  ```javascript
  export const AuthContext = createContext(null);
  export const AuthProvider = ({ children }) => { ... };
  export default AuthProvider;
  ```

### ✓ login()
- **Path:** `frontend/src/contexts/AuthContext.jsx` & `frontend/src/services/authService.js`
- **Proof / Implementation:**
  ```javascript
  // AuthContext.jsx
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    if (res?.success || res?.token) {
      const token = res.data?.token || res.token;
      if (token) setStoredToken(token);
    }
    return res;
  };
  ```

### ✓ logout()
- **Path:** `frontend/src/contexts/AuthContext.jsx` & `frontend/src/services/authService.js`
- **Proof / Implementation:**
  ```javascript
  // AuthContext.jsx
  const logout = async () => {
    try { await authService.logout(); } catch (e) {}
    finally {
      setStoredToken(null);
      setUser(null);
      setRole(null);
      window.location.href = "/login";
    }
  };
  ```

### ✓ restoreSession() / fetchProfile()
- **Path:** `frontend/src/contexts/AuthContext.jsx`
- **Proof / Implementation:**
  ```javascript
  const fetchProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const res = await profileService.getProfile();
    if (res?.data) setUser(res.data);
  }, []);
  ```

### ✓ useAuth()
- **Path:** `frontend/src/hooks/useAuth.js`
- **Proof / Implementation:**
  ```javascript
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
  };
  ```

### ✓ ProtectedRoute / AuthGuard
- **Path:** `frontend/src/components/layout/AuthGuard.jsx`
- **Proof / Implementation:**
  ```javascript
  export const AuthGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      }
    }, [isAuthenticated, loading, pathname]);
  };
  ```

### ✗ RoleGuard (Stand-Alone Component)
- **Path:** `frontend/src/contexts/AuthContext.jsx` *(Ditangani via state `role` pada AuthContext & pembatasan menu UI per role)*
- **Status:** `PARTIAL` *(Role state & checks siap di AuthContext, namun belum ada file komponen `RoleGuard.jsx` terpisah)*

### ✓ Middleware
- **Path:** `frontend/middleware.js`
- **Proof / Implementation:**
  ```javascript
  export function middleware(request) {
    const protectedRoutes = ["/profile", "/dashboard"];
    const authToken = request.cookies.get("auth_token")?.value;
    if (isProtectedRoute && !authToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  ```

---

# 2. API PROOF

### ✓ axios client
- **Path:** `frontend/src/lib/api.js`
- **Proof / Implementation:**
  ```javascript
  let Axios = null;
  try { Axios = require("axios").default || require("axios"); } catch (e) {}
  ```

### ✓ interceptor request
- **Path:** `frontend/src/lib/api.js`
- **Proof / Implementation:**
  ```javascript
  clientInstance.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });
  ```

### ✓ interceptor response
- **Path:** `frontend/src/lib/api.js`
- **Proof / Implementation:**
  ```javascript
  clientInstance.interceptors.response.use(
    (response) => response.data,
    (error) => formatApiError(error)
  );
  ```

### ✓ bearer token injection
- **Path:** `frontend/src/lib/api.js`
- **Proof / Implementation:**
  ```javascript
  export const getStoredToken = () => {
    return localStorage.getItem("token") || getCookie("auth_token");
  };
  ```

### ✓ timeout
- **Path:** `frontend/src/config/api.js` & `frontend/src/lib/api.js`
- **Proof / Implementation:**
  ```javascript
  // src/config/api.js
  export const API_CONFIG = { BASE_URL: "/api/v1", TIMEOUT: 15000 };
  ```

### ✓ ApiResponse unwrap
- **Path:** `frontend/src/lib/api.js`
- **Proof / Implementation:**
  ```javascript
  clientInstance.interceptors.response.use((response) => response.data);
  ```

---

# 3. SERVICE LAYER PROOF

Seluruh file Service Layer di `frontend/src/services/`:

1. `frontend/src/services/authService.js` (Export: `authService`)
2. `frontend/src/services/profileService.js` (Export: `profileService`)
3. `frontend/src/services/facilityService.js` (Export: `facilityService`)
4. `frontend/src/services/proposalService.js` (Export: `proposalService`)
5. `frontend/src/services/announcementService.js` (Export: `announcementService`)
6. `frontend/src/services/clubService.js` (Export: `clubService`)

---

# 4. PAGES PROOF

| Page Name | Route | Page File | Service Used |
| :--- | :--- | :--- | :--- |
| **login** | `/login` | `frontend/src/app/login/page.js` | `authService` |
| **dashboard** | `/` | `frontend/src/app/page.js` | `announcementService`, `facilityService`, `clubService` |
| **profile** | `/profile` | `frontend/src/app/profile/page.js` | `profileService`, `authService` |
| **mading** | `/mading` & `/mading/[id]` | `frontend/src/app/mading/page.js` | `announcementService` |
| **proposal** | `/proposal` | `frontend/src/app/proposal/page.js` | `proposalService` |
| **booking** | `/fasilitas` (CartModal) | `frontend/src/app/fasilitas/page.js` | `facilityService` |
| **facility** | `/fasilitas` | `frontend/src/app/fasilitas/page.js` | `facilityService` |
| **osis** | `/osis` | `frontend/src/app/osis/page.js` | `proposalService`, `facilityService`, `announcementService` |
| **ekstrakurikuler** | `/ekstrakurikuler` | `frontend/src/app/ekstrakurikuler/page.js` | `clubService` |
| **guru** | `/guru` | `frontend/src/app/guru/page.js` | `proposalService`, `facilityService` |
| **admin** | `/admin` | `frontend/src/app/admin/page.js` | `proposalService`, `facilityService`, `announcementService` |

---

# 5. STATE MANAGEMENT PROOF

- **Context:** `frontend/src/contexts/AuthContext.jsx` (`AuthContext = createContext(null)`)
- **Provider:** `frontend/src/contexts/AuthContext.jsx` (`AuthProvider`) & `frontend/src/app/providers.jsx`
- **Hooks:** `frontend/src/hooks/useAuth.js` (`useAuth()`)

---

# 6. BACKEND CONTRACT PROOF

- **ApiResponse<T>**:  
  Terbukti di `src/lib/api.js` baris 140-150: response unwrapped menjadi objek data `{ success, statusCode, message, data }`.
- **Authorization Bearer**:  
  Terbukti di `src/lib/api.js` baris 134: `config.headers["Authorization"] = 'Bearer ' + token`.
- **Role enum**:  
  Terbukti di `src/constants/roles.js`: `"Student"`, `"Teacher"`, `"OSIS"`, `"Admin"`.
- **Pagination**:  
  Terbukti di `src/services/announcementService.js` & `clubService.js`: menerima parameter query `page` & `pageSize`.

---

# 7. DUMMY DATA & FALLBACK PROOF

- **Unsplash Image URLs**:  
  Terdeteksi pada 8 file (`announcementService.js`, `utils.js`, `MadingSection.jsx`, `MadingCollage.jsx`, `MadingTextInfoCard.jsx`, `ExtracurricularCollage.jsx`, `/mading/[id]/page.js`). Dipakai sebagai gambar default cadangan saat media backend offline.
- **Lorem Ipsum**:  
  `0` file terdeteksi. (Semua teks menggunakan Bahasa Indonesia resmi SMKN 2 Surakarta).
- **Mock Data Fallbacks**:  
  Tersimpan dalam service layer (`facilityService.js`, `proposalService.js`, `clubService.js`, `announcementService.js`) untuk menjamin UI tidak crash saat server backend dalam perbaikan.

---

# 8. FINAL PROOF TABLE

| Feature | Status | Proof Found | File |
| :--- | :---: | :---: | :--- |
| **AuthContext** | `READY` | `createContext(null)` | `frontend/src/contexts/AuthContext.jsx` |
| **login()** | `READY` | `authService.login()` | `frontend/src/contexts/AuthContext.jsx` |
| **logout()** | `READY` | `authService.logout()` | `frontend/src/contexts/AuthContext.jsx` |
| **restoreSession()** | `READY` | `fetchProfile()` | `frontend/src/contexts/AuthContext.jsx` |
| **useAuth()** | `READY` | `useContext(AuthContext)` | `frontend/src/hooks/useAuth.js` |
| **ProtectedRoute** | `READY` | `AuthGuard` | `frontend/src/components/layout/AuthGuard.jsx` |
| **RoleGuard** | `PARTIAL` | State role terintegrasi di AuthContext | `frontend/src/contexts/AuthContext.jsx` |
| **Middleware** | `READY` | `middleware(request)` | `frontend/middleware.js` |
| **Axios Client** | `READY` | `Axios.create()` | `frontend/src/lib/api.js` |
| **Request Interceptor** | `READY` | `interceptors.request.use` | `frontend/src/lib/api.js` |
| **Response Interceptor** | `READY` | `interceptors.response.use` | `frontend/src/lib/api.js` |
| **Bearer Token Injection** | `READY` | `getStoredToken()` | `frontend/src/lib/api.js` |
| **Timeout Handling** | `READY` | `API_CONFIG.TIMEOUT` (15s) | `frontend/src/config/api.js` |
| **ApiResponse Unwrap** | `READY` | `response.data` unwrap | `frontend/src/lib/api.js` |
| **facilityService** | `READY` | `facilityService` export | `frontend/src/services/facilityService.js` |
| **proposalService** | `READY` | `proposalService` export | `frontend/src/services/proposalService.js` |
| **clubService** | `READY` | `clubService` export | `frontend/src/services/clubService.js` |
| **announcementService** | `READY` | `announcementService` export | `frontend/src/services/announcementService.js` |
| **authService** | `READY` | `authService` export | `frontend/src/services/authService.js` |
| **profileService** | `READY` | `profileService` export | `frontend/src/services/profileService.js` |

---

Dokumen bukti audit ini disimpan di [docs/frontend-proof-audit.md](file:///d:/PKL%20ENUMA/KERJA%21/SchoolProject/StudentCenter/docs/frontend-proof-audit.md).
