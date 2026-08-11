/**
 * File Upload Utility Service
 * Uploads images directly to Cloudinary from browser using SHA-1 Signed API requests,
 * and handles PDF documents securely through Next.js server route (/api/upload).
 */

import { API_CONFIG } from "@/config/api";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "vzq8p7ot";
const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "361676817915771";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "HdLS3Zkb971WfCXlIPOBuB54_fE";

// Browser native SHA-1 hash helper using Web Crypto API
const sha1 = async (str) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

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

    if (!response.ok) {
      const errMsg = data?.message || data?.error || (response.status === 401 ? "Sesi login telah berakhir. Silakan login kembali." : "Gagal mengunggah file ke server.");
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
    console.warn("Upload PDF Error:", error?.message || error);
    throw error;
  }
};

/**
 * Uploads images directly from browser to Cloudinary CDN via Signed Upload API.
 */
export const uploadImageToCloudinary = async (file, folder = "student-center") => {
  if (!file) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const targetFolder = folder || "student-center";
    const stringToSign = `folder=${targetFolder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = await sha1(stringToSign);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("folder", targetFolder);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    }
    if (data.url) {
      return data.url;
    }

    console.warn("Direct Cloudinary upload returned response:", data);
  } catch (err) {
    console.warn("Direct Cloudinary upload failed, falling back to backend:", err);
  }

  // Fallback to backend API /api/upload
  const res = await uploadPdfDocument(file, folder);
  return res?.url || res?.path || null;
};

export default uploadImageToCloudinary;

