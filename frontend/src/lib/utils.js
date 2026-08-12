import { API_CONFIG } from "@/config/api";

/**
 * Helper to resolve valid image URLs from backend REST API responses
 * Handles full URLs (https://...), relative paths (/uploads/...), and fallback images.
 */
export const resolveImageUrl = (
  src,
  fallback = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80"
) => {
  if (!src || typeof src !== "string" || src.trim() === "" || src.includes("dummypic")) {
    return fallback;
  }

  const cleanSrc = src.trim();

  // Data URLs and Blob URLs remain untouched
  if (cleanSrc.startsWith("data:") || cleanSrc.startsWith("blob:")) {
    return cleanSrc;
  }

  // Determine production vs dev environment and backend base URL
  const isHttpsProd = typeof window !== "undefined" && window.location.protocol === "https:";
  let rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || API_CONFIG.BASE_URL || "https://studentcenter-backend.onrender.com";

  // Strip trailing slash and /api suffix if present
  let backendOrigin = rawApiBase.replace(/\/api\/?$/i, "").replace(/\/$/, "");

  // In HTTPS production, force HTTPS backend origin if it was configured as localhost or HTTP
  if (isHttpsProd && (backendOrigin.includes("localhost") || backendOrigin.includes("127.0.0.1") || backendOrigin.startsWith("http://"))) {
    if (backendOrigin.includes("localhost") || backendOrigin.includes("127.0.0.1")) {
      backendOrigin = "https://studentcenter-backend.onrender.com";
    } else {
      backendOrigin = backendOrigin.replace(/^http:/, "https:");
    }
  }

  // Case 1: Replace legacy stored localhost URLs (e.g. http://localhost:5051/uploads/feb7404f...)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(cleanSrc)) {
    if (isHttpsProd || (!backendOrigin.includes("localhost") && !backendOrigin.includes("127.0.0.1"))) {
      return cleanSrc.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, backendOrigin);
    }
    return cleanSrc;
  }

  // Case 2: Local Next.js public assets (e.g. /images/..., /assets/...)
  if (cleanSrc.startsWith("/images/") || cleanSrc.startsWith("/assets/") || cleanSrc.startsWith("/favicon") || cleanSrc.startsWith("/logo")) {
    return cleanSrc;
  }

  // Case 3: Relative upload paths from backend (e.g. /uploads/feb7404f...)
  if (cleanSrc.startsWith("/")) {
    return `${backendOrigin}${cleanSrc}`;
  }

  // Case 3: HTTPS or Cloudinary / external absolute URLs
  if (cleanSrc.startsWith("https://")) {
    return cleanSrc;
  }

  // Case 4: Upgrade HTTP to HTTPS in production to prevent Mixed Content
  if (cleanSrc.startsWith("http://")) {
    if (isHttpsProd) {
      return cleanSrc.replace(/^http:/, "https:");
    }
    return cleanSrc;
  }

  return `${backendOrigin}/${cleanSrc}`;
};

/**
 * Format ISO datetime string to Indonesian localized date format
 */
export const formatDate = (dateString) => {
  if (!dateString) return "Terbaru";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    return "Terbaru";
  }
};
