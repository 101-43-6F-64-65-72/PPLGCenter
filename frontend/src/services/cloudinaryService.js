/**
 * Production File & Media Upload Service
 * Routes file uploads securely through the authenticated ASP.NET Core API (/api/upload).
 * The backend handles validation, authorization, and Cloudinary CDN storage.
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
          document.cookie.match(/auth_token=([^;]+)/)?.[1] ||
          document.cookie.match(/token=([^;]+)/)?.[1]
        : null;

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const backendUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${backendUrl}/api/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data?.message ||
        data?.error ||
        (response.status === 401
          ? "Sesi login telah berakhir. Silakan login kembali."
          : "Gagal mengunggah file ke server.");
      throw new Error(errMsg);
    }

    const uploadData = data?.data || data;
    if (uploadData?.path || uploadData?.url) {
      return {
        path: uploadData.path || uploadData.url,
        url: uploadData.url,
      };
    }

    throw new Error(data?.message || "Format respon upload dari server tidak sesuai.");
  } catch (error) {
    console.warn("Upload File Error:", error?.message || error);
    throw error;
  }
};

/**
 * Uploads media images securely through ASP.NET Core API (/api/upload).
 */
export const uploadImageToCloudinary = async (file, folder = "student-center") => {
  if (!file) return null;
  const res = await uploadPdfDocument(file, folder);
  return res?.url || res?.path || null;
};

export default uploadImageToCloudinary;
