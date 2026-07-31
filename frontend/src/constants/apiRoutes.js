/**
 * Centralized API Routes map following API Contract V1
 */

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
  },
  PROFILE: {
    GET: "/profile",
    UPDATE: "/profile",
  },
  ANNOUNCEMENTS: {
    LIST: "/announcements",
    DETAIL: (id) => `/announcements/${id}`,
  },
  CLUBS: {
    LIST: "/clubs",
    DETAIL: (id) => `/clubs/${id}`,
  },
  BOOKINGS: {
    LIST: "/bookings",
    CREATE: "/bookings",
  },
};
