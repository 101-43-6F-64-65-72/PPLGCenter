/**
 * API Infrastructure Configuration
 * Single source of truth for base URLs, timeouts, and network settings.
 */

export const API_CONFIG = {
<<<<<<< HEAD
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
=======
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5051",
>>>>>>> c6427a23d5c889fa58b1e0348c871c51ae22edb1
  TIMEOUT: 15000, // 15 seconds timeout
  WITH_CREDENTIALS: true,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};
