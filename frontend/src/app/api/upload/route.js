// Cloudinary import removed for UI-only build

"use server";

export async function POST(request) {
  // Stub: upload functionality not available in UI-only mode.
  return new Response(JSON.stringify({ error: "Upload not supported in UI build." }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}
