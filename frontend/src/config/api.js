/**
 * API Infrastructure Configuration
 * Single source of truth for base URLs, timeouts, and network settings.
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1",
  TIMEOUT: 15000, // 15 seconds timeout
  WITH_CREDENTIALS: true,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};
