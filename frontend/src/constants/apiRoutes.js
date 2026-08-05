/**
 * Centralized API Routes map following API Contract V1
 */

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
  },
  PROFILE: {
    GET: "/api/auth/me",
    UPDATE: "/api/auth/me",
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
