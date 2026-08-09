/**
 * File Upload Utility Service
 * Uploads images and PDF documents securely through Next.js server route (/api/upload).
 */

export const uploadPdfDocument = async (file, folder = "proposals") => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") ||
          document.cookie.match(/token=([^;]+)/)?.[1]
        : null;

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (data?.path || data?.url) {
      return {
        path: data.path || data.url,
        url: data.url,
      };
    }

    console.warn("Upload API returned no path/URL:", data);
    return null;
  } catch (error) {
    console.warn("Upload network error:", error);
    return null;
  }
};

export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;

  const res = await uploadPdfDocument(file, "images");
  return res?.url || null;
};

export default uploadImageToCloudinary;
