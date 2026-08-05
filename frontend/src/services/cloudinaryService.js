/**
 * Cloudinary Image Upload Utility Service
 * Uploads local image files to Cloudinary CDN storage and returns secure HTTPS URL.
 * Uses unsigned upload preset (no API Secret needed client-side).
 */
export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;

  const cloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "yywsocka";
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "studentcenter_unsigned";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "studentcenter/mading");

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (data?.secure_url) {
      return data.secure_url; // valid HTTPS CDN URL
    }

    // Cloudinary rejected (preset not configured, etc.) — return null
    console.warn("Cloudinary upload rejected:", data?.error?.message || data);
    return null;
  } catch (error) {
    console.warn("Cloudinary upload network error:", error);
    return null;
  }
};

export default uploadImageToCloudinary;
