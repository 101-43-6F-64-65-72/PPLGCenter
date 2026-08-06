import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "application/pdf";
    const isImage = mimeType.startsWith("image/");

    const uploadOptions = {
      folder: isImage ? "studentcenter/mading" : "studentcenter/proposals",
      resource_type: isImage ? "image" : "raw",
      use_filename: true,
      unique_filename: true,
    };

    if (isImage) {
      uploadOptions.transformation = [{ width: 1280, height: 720, crop: "fill", quality: "auto" }];
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return Response.json({ url: result.secure_url });
  } catch (error) {
    console.error("Server-side upload error:", error?.message || error);
    return Response.json(
      { error: error?.message || "Gagal mengunggah file dokumen." },
      { status: 500 }
    );
  }
}
