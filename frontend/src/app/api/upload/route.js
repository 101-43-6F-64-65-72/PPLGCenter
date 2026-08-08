import { API_CONFIG } from "@/config/api";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "File is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const backendUrl = API_CONFIG.BASE_URL;
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const authHeader = request.headers.get("authorization");
    const headers = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${backendUrl}/api/upload`, {
      method: "POST",
      headers,
      body: backendFormData,
    });

    const data = await res.json();

    if (data?.success && data?.data?.url) {
      return new Response(JSON.stringify({ url: data.data.url }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: data?.message || "Upload failed" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "Upload error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
