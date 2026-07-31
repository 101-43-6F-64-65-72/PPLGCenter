/**
 * Application Business Rules & UI Configuration
 * Prevents magic numbers and duplicate settings across components.
 */

export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || "Student Center SMK Negeri 2 Surakarta",
  URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  UPLOAD_LIMIT_BYTES: Number(process.env.NEXT_PUBLIC_UPLOAD_LIMIT) || 2097152, // 2MB
  DEFAULT_PAGE_SIZE: 10,
  TOKEN_COOKIE_NAME: "auth_token",
};
