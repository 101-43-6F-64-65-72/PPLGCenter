/**
 * Cloudinary Image Upload Utility Service
 * Uses a Next.js server-side API route (/api/upload) to perform a signed upload
 * with the API Secret — no unsigned preset needed on Cloudinary.
 */
export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data?.url) {
      return data.url; // valid HTTPS Cloudinary CDN URL
    }

    console.warn("Upload API returned no URL:", data);
    return null;
  } catch (error) {
    console.warn("Upload network error:", error);
    return null;
  }
};

export default uploadImageToCloudinary;
