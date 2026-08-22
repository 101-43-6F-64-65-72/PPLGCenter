import crypto from "crypto";

const DEFAULT_CLOUD_NAME = "vzq8p7ot";
const DEFAULT_API_KEY = "167423762679175";
const DEFAULT_API_SECRET = "yNndEjifN2cYFu5u_a3ICKyHvSE";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "student-center";

    if (!file) {
      return new Response(JSON.stringify({ error: "File is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cloudName =
      process.env.CLOUDINARY__CLOUDNAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      DEFAULT_CLOUD_NAME;

    const apiKey =
      process.env.CLOUDINARY__APIKEY ||
      process.env.CLOUDINARY_API_KEY ||
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
      DEFAULT_API_KEY;

    const apiSecret =
      process.env.CLOUDINARY__APISECRET ||
      process.env.CLOUDINARY_API_SECRET ||
      DEFAULT_API_SECRET;

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const paramString = `folder=${folder}&timestamp=${timestamp}`;
      const stringToSign = `${paramString}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", file);
      cloudinaryFormData.append("api_key", apiKey);
      cloudinaryFormData.append("timestamp", timestamp);
      cloudinaryFormData.append("folder", folder);
      cloudinaryFormData.append("signature", signature);

      const isPdf = file?.type?.includes("pdf") || file?.name?.endsWith(".pdf");
      const resourceType = isPdf ? "raw" : "auto";
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: cloudinaryFormData,
      });

      if (res.ok) {
        const data = await res.json();
        const finalUrl = data.secure_url || data.url;
        if (finalUrl) {
          return new Response(
            JSON.stringify({
              success: true,
              url: finalUrl,
              path: finalUrl,
              data: { url: finalUrl, path: finalUrl },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    } catch (cErr) {
      console.warn("Next.js direct Cloudinary upload warning:", cErr);
    }

    // Fallback: Convert file to Base64 Data URL if direct upload fails
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";
    const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: base64Data,
        path: base64Data,
        data: { url: base64Data, path: base64Data },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Gagal mengunggah file." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

