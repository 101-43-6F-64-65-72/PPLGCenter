/**
 * File Upload Utility Service
 * Uploads images and PDF documents securely through Next.js server route (/api/upload).
 */

import { API_CONFIG } from "@/config/api";

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

    const backendUrl = API_CONFIG.BASE_URL;
    const response = await fetch(`${backendUrl}/api/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    const uploadData = data?.data || data;
    if (uploadData?.path || uploadData?.url) {
      return {
        path: uploadData.path || uploadData.url,
        url: uploadData.url,
      };
    }

    console.warn("Upload API returned error:", data?.message || data?.error || data);
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
