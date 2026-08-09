import { API_CONFIG } from "@/config/api";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!file) {
      return new Response(JSON.stringify({ error: "File is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const backendUrl = API_CONFIG.BASE_URL;
    const backendFormData = new FormData();
    backendFormData.append("file", file);
    if (folder) {
      backendFormData.append("folder", folder);
    }

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

    if (data?.success && data?.data) {
      return new Response(
        JSON.stringify({
          url: data.data.url,
          path: data.data.path || data.data.url,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: data?.message || "Gagal mengunggah file. Silakan coba lagi." }),
      {
        status: res.status || 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Gagal mengunggah file. Silakan coba lagi." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
