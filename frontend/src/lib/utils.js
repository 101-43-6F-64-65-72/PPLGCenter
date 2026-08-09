import { API_CONFIG } from "@/config/api";

/**
 * Helper to resolve valid image URLs from backend REST API responses
 * Handles full URLs (https://...), relative paths (/uploads/...), and fallback images.
 */
export const resolveImageUrl = (src, fallback = "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80") => {
  if (!src || src.includes("dummypic")) return fallback;

  // Replace local dev backend URLs (http://localhost:5051) with production API URL when deployed or running over HTTPS
  if (typeof src === "string" && src.includes("localhost:")) {
    const isHttpsProduction = typeof window !== "undefined" && window.location.protocol === "https:";
    const isProdApi = API_CONFIG.BASE_URL && !API_CONFIG.BASE_URL.includes("localhost");

    if (isHttpsProduction || isProdApi) {
      const baseUrl = isProdApi ? API_CONFIG.BASE_URL : "https://studentcenter-backend.onrender.com";
      return src.replace(/http:\/\/localhost:\d+/, baseUrl);
    }
  }

  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }
  const baseUrl = API_CONFIG.BASE_URL;
  return `${baseUrl}/${src.startsWith("/") ? src.slice(1) : src}`;
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
