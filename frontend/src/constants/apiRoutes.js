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
  EXTRACURRICULARS: {
    LIST: "/api/extracurriculars",
    DETAIL: (id) => `/api/extracurriculars/${id}`,
    JOIN: (id) => `/api/extracurriculars/${id}/join`,
    LEAVE: (id) => `/api/extracurriculars/${id}/leave`,
    MEMBERS: (id) => `/api/extracurriculars/${id}/members`,
  },
  PROPOSALS: {
    LIST: "/api/proposals",
    DETAIL: (id) => `/api/proposals/${id}`,
    REVIEW: (id) => `/api/proposals/${id}/review`,
  },
  FACILITIES: {
    LIST: "/api/facilities",
    SLOTS: (id) => `/api/facilities/${id}/slots`,
  },
  USERS: {
    LIST: "/api/users",
    DETAIL: (id) => `/api/users/${id}`,
  },
};
