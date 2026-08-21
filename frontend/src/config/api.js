/**
 * API Infrastructure Configuration
 * Single source of truth for base URLs, timeouts, and network settings.
 */

export const API_CONFIG = {
  // In browser, using relative "" routes requests through Next.js proxy (rewrites in next.config.mjs)
  // preventing all CORS issues from localhost:3000 -> render backend.
  BASE_URL:
    typeof window !== "undefined"
      ? ""
      : process.env.NEXT_PUBLIC_API_BASE_URL || "https://pplgcenter.onrender.com",
  TIMEOUT: 60000, // 60 seconds timeout for Render cold start tolerance
  WITH_CREDENTIALS: true,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};
