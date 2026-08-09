import { API_CONFIG } from "@/config/api";

/**
 * Helper to resolve valid image URLs from backend REST API responses
 * Handles full URLs (https://...), relative paths (/uploads/...), and fallback images.
 */
export const resolveImageUrl = (src, fallback = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80") => {
  if (!src || typeof src !== "string" || src.includes("dummypic")) return fallback;

  const isHttpsProduction = typeof window !== "undefined" && window.location.protocol === "https:";
  const prodApiUrl = (API_CONFIG.BASE_URL && !API_CONFIG.BASE_URL.includes("localhost"))
    ? API_CONFIG.BASE_URL
    : "https://studentcenter-backend.onrender.com";

  // Case 1: Replace hardcoded localhost dev URLs (e.g. http://localhost:5051/uploads/...)
  if (src.includes("localhost:")) {
    if (isHttpsProduction || (API_CONFIG.BASE_URL && !API_CONFIG.BASE_URL.includes("localhost"))) {
      return src.replace(/http:\/\/localhost:\d+/, prodApiUrl);
    }
  }

  // Case 2: Relative uploads path (e.g. /uploads/feb7404f...)
  if (src.startsWith("/")) {
    if (isHttpsProduction) {
      return `${prodApiUrl}${src}`;
    }
    const baseUrl = API_CONFIG.BASE_URL || "";
    return `${baseUrl}${src}`;
  }

  // Case 3: Already complete HTTPS or Data URL
  if (src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }

  // Case 4: Insecure HTTP URL loaded on HTTPS page (prevent Mixed Content)
  if (src.startsWith("http://") && isHttpsProduction) {
    return src.replace("http://", "https://");
  }

  if (src.startsWith("http://")) {
    return src;
  }

  const baseUrl = API_CONFIG.BASE_URL || prodApiUrl;
  return `${baseUrl}/${src}`;
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
