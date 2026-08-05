/**
 * Centralized API Routes map following API Contract V1
 */

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
  },
  PROFILE: {
<<<<<<< HEAD
    GET: "/auth/me",
    UPDATE: "/auth/me",
=======
    GET: "/api/auth/me",
    UPDATE: "/api/auth/me",
>>>>>>> c6427a23d5c889fa58b1e0348c871c51ae22edb1
  },
  ANNOUNCEMENTS: {
    LIST: "/api/announcements",
    DETAIL: (id) => `/api/announcements/${id}`,
  },
  CLUBS: {
    LIST: "/api/clubs",
    DETAIL: (id) => `/api/clubs/${id}`,
  },
  BOOKINGS: {
    LIST: "/api/bookings",
    CREATE: "/api/bookings",
  },
};
