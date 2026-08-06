/**
 * Helper to resolve valid image URLs from backend REST API responses
 * Handles full URLs (https://...), relative paths (/uploads/...), and fallback images.
 */
export const resolveImageUrl = (src, fallback = "/images/dummypic.jpg") => {
  if (!src) return fallback;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5051";
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
