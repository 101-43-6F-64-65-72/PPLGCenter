import { REPLYZ_SYSTEM_PROMPT } from "@/config/replyzSystemPrompt";
import { dispatchAiAction } from "@/utils/aiActionDispatcher";
import { AI_TOOLS, executeAiTool, parseAiIntent } from "@/services/aiTools";
import { announcementService } from "@/services/announcementService";
import { scheduleService } from "@/services/scheduleService";
import { notificationService } from "@/services/notificationService";

/**
 * Retrieve active AI API Key from environment variables
 */
export function getAiApiKey() {
  if (typeof process === "undefined" || !process.env) return "";
  const key = (
    process.env.NEXT_PUBLIC_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GROQ_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
    ""
  ).trim();
  return key;
}

/**
 * Determine AI Provider ('groq' | 'gemini' | 'openai')
 */
export function getAiProvider() {
  const key = getAiApiKey();
  const envProvider = (process.env.NEXT_PUBLIC_AI_PROVIDER || "").toLowerCase().trim();
  if (envProvider) return envProvider;
  if (key.startsWith("gsk_")) return "groq";
  if (key.startsWith("AIza") || key.startsWith("AQ.")) return "gemini";
  if (key.startsWith("sk-")) return "openai";
  return "groq";
}

/**
 * Determine Gemini Model version
 */
export function getGeminiModel() {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GEMINI_MODEL) {
    return process.env.NEXT_PUBLIC_GEMINI_MODEL.trim();
  }
  return "gemini-flash-latest";
}

/**
 * Real-Time Backend Data Gatherer
 */
async function fetchRealBackendContext() {
  let announcementsText = "Belum ada pengumuman baru.";
  let scheduleText = "1. 07.00 - 09.30: Pemrograman Web (Lab RPL 1); 2. 09.45 - 12.00: PBO (Lab Komputer 2); 3. 12.30 - 15.00: Basis Data (Lab RPL 2).";
  let unreadCount = 0;

  try {
    const annRes = await announcementService.getAnnouncements({ limit: 2 }).catch(() => null);
    const annItems = annRes?.data?.items || (Array.isArray(annRes?.data) ? annRes.data : null) || (Array.isArray(annRes) ? annRes : null);
    if (Array.isArray(annItems) && annItems.length > 0) {
      announcementsText = annItems.map((a, i) => `${i + 1}. ${a.title || "Pengumuman"}`).join("; ");
    }
  } catch (e) {
    // Ignore fetch failure
  }

  try {
    const schedRes = await scheduleService.getStudentToday().catch(() => null);
    let schedItems = schedRes?.data || (Array.isArray(schedRes) ? schedRes : null);
    if (!schedItems || schedItems.length === 0) {
      const allSched = await scheduleService.getAll().catch(() => null);
      schedItems = allSched?.data || (Array.isArray(allSched) ? allSched : null);
    }
    if (Array.isArray(schedItems) && schedItems.length > 0) {
      scheduleText = schedItems.slice(0, 3).map((s, i) => `${i + 1}. ${s.startTime || "07.00"} - ${s.endTime || "15.00"}: ${s.subjectName || s.subject || "Matpel"}`).join("; ");
    }
  } catch (e) {
    // Ignore fetch failure
  }

  try {
    const notifRes = await notificationService.getUnreadCount().catch(() => null);
    if (typeof notifRes?.data === "number") {
      unreadCount = notifRes.data;
    }
  } catch (e) {
    // Ignore fetch failure
  }

  return `[DATA REAL SEKOLAH SAAT INI]:
- Pengumuman: ${announcementsText}
- Jadwal Pelajaran: ${scheduleText}
- Notifikasi: ${unreadCount} belum dibaca`;
}

/**
 * Fetch available live models from Groq Cloud GET /openai/v1/models
 */
async function fetchGroqAvailableModels(apiKey) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const modelIds = (data?.data || []).map((m) => m.id);
      const chatModels = modelIds.filter(
        (id) =>
          !id.includes("whisper") &&
          !id.includes("guard") &&
          !id.includes("vision") &&
          !id.includes("decommissioned")
      );
      if (chatModels.length > 0) return chatModels;
    }
  } catch (err) {
    console.warn("[Groq API] Could not fetch live models list:", err?.message);
  }
  return ["groq/compound-mini", "groq/compound", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
}

/**
 * Call Groq Cloud API with dynamic model resolution & fallback
 */
async function callGroqApi(apiKey, userQuery, backendContext = "") {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const liveModels = await fetchGroqAvailableModels(apiKey);
  const preferredModels = [
    process.env.NEXT_PUBLIC_GROQ_MODEL,
    "groq/compound-mini",
    "groq/compound",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
  ].filter(Boolean);

  const candidateModels = [...new Set([...preferredModels, ...liveModels])];
  let lastError = null;

  const userContent = backendContext
    ? `${backendContext}\n\nPertanyaan: ${userQuery}`
    : userQuery;

  for (const model of candidateModels) {
    try {
      const payload = {
        model,
        messages: [
          { role: "system", content: REPLYZ_SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
        max_tokens: 600,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const textResult = data?.choices?.[0]?.message?.content || "";
        if (textResult) {
          return textResult;
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${response.status}`;
        console.warn(`[Groq API] Model '${model}' error: ${errMsg}`);
        lastError = new Error(`Groq (${model}) Error: ${errMsg}`);
      }
    } catch (err) {
      console.warn(`[Groq API] Network error on model '${model}':`, err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Gagal menghubungi Groq Cloud API.");
}

/**
 * Call Google Gemini REST API
 */
async function callGeminiApi(apiKey, userQuery, backendContext = "") {
  const primaryModel = getGeminiModel();
  const candidateModels = [
    primaryModel,
    "gemini-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ];

  const uniqueModels = [...new Set(candidateModels)];
  const userContent = backendContext
    ? `${backendContext}\n\nPertanyaan: ${userQuery}`
    : userQuery;

  let lastError = null;

  for (const rawModel of uniqueModels) {
    const cleanModel = rawModel.replace(/^models\//, "").trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

    try {
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${REPLYZ_SYSTEM_PROMPT}\n\n${userContent}` }],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (textResult) return textResult;
      } else {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `HTTP ${response.status}`;
        lastError = new Error(`Gemini (${cleanModel}) Error: ${errMsg}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Gagal menghubungi Google Gemini API.");
}

/**
 * Call OpenAI Chat Completions API
 */
async function callOpenAiApi(apiKey, userQuery, backendContext = "") {
  const url = "https://api.openai.com/v1/chat/completions";
  const userContent = backendContext
    ? `${backendContext}\n\nPertanyaan: ${userQuery}`
    : userQuery;

  const messages = [
    { role: "system", content: REPLYZ_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${errData?.error?.message || response.status}`);
  }

  const data = await response.json();
  const textResult = data?.choices?.[0]?.message?.content || "";
  return textResult;
}

/**
 * Parse Deterministic JSON Output from LLM
 */
function parseLlmJsonOutput(text) {
  if (!text) return null;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed && (parsed.speech !== undefined || parsed.action !== undefined || parsed.emotion !== undefined)) {
        return parsed;
      }
    }
  } catch (err) {
    // Not JSON
  }
  return null;
}

/**
 * Friendly Local Companion Engine (Fallback when API limit or error occurs)
 */
function generateLocalCompanionFallback(userQuery, backendContext = "") {
  const queryLower = (userQuery || "").toLowerCase();

  if (queryLower.includes("jadwal") || queryLower.includes("pelajaran") || queryLower.includes("senin") || queryLower.includes("selasa") || queryLower.includes("rabu") || queryLower.includes("kamis") || queryLower.includes("jumat")) {
    return "Untuk jadwal pelajaran PPLG di SMKN 2 Surakarta hari ini, kita ada Pemrograman Web & Perangkat Bergerak (Lab RPL 1) jam 07.00 - 09.30, lanjut PBO jam 09.45 - 12.00, dan Basis Data jam 12.30 - 15.00 di Lab RPL 2 ya! Ada matpel yang mau kamu tanyakan lagi? 😊";
  }

  if (queryLower.includes("pengumuman") || queryLower.includes("mading") || queryLower.includes("berita") || queryLower.includes("info")) {
    return "Pengumuman sekolah terbaru saat ini bisa kamu cek di halaman Mading Digital! Kalau mau, aku bisa bantu langsung bukakan halaman pengumuman buat kamu. 😊";
  }

  if (queryLower.includes("fasilitas") || queryLower.includes("lab") || queryLower.includes("perpus")) {
    return "Di PPLG Center SMKN 2 Surakarta kita punya Lab Komputer PPLG, Lab RPL, Studio Game Dev, Hardware Workshop, dan Perpustakaan Digital yang siap digunakan! Mau cek status peminjaman lab? 😊";
  }

  if (queryLower.includes("siapa kamu") || queryLower.includes("nama kamu") || queryLower.includes("siapa nama")) {
    return "Halo! Aku Replyz, sahabat dan asisten virtual resmi Student Center SMKN 2 Surakarta (PPLG Center). Aku siap membantu kamu cek jadwal, pengumuman, fasilitas, atau navigasi web ini! 😊";
  }

  return "Halo! Aku Replyz, teman sekelasmu di Student Center SMKN 2 Surakarta. Ada yang bisa kubantu hari ini? Kamu bisa tanya tentang jadwal pelajaran, pengumuman, atau minta aku antar ke halaman mana pun! 😊";
}

/**
 * Main AI Response Generator for Replyz Assistant
 */
export async function generateReplyzAiResponse(userQuery, context = {}) {
  const apiKey = getAiApiKey();
  const provider = getAiProvider();

  // 1. Fetch Compact Real Backend Context
  const backendContext = await fetchRealBackendContext();

  // 2. Local Intent Action Matching
  const localIntent = parseAiIntent(userQuery);
  let actionToolToRun = localIntent;

  let finalSpeech = "";
  let finalEmotion = "happy";

  if (apiKey && apiKey !== "your_ai_api_key_here" && apiKey !== "your_gemini_api_key_here") {
    try {
      let rawLlmOutput = "";

      if (provider === "groq") {
        rawLlmOutput = await callGroqApi(apiKey, userQuery, backendContext);
      } else if (provider === "openai") {
        rawLlmOutput = await callOpenAiApi(apiKey, userQuery, backendContext);
      } else {
        rawLlmOutput = await callGeminiApi(apiKey, userQuery, backendContext);
      }

      const jsonParsed = parseLlmJsonOutput(rawLlmOutput);
      if (jsonParsed) {
        if (jsonParsed.speech) {
          finalSpeech = jsonParsed.speech;
        }
        if (jsonParsed.emotion) {
          finalEmotion = jsonParsed.emotion;
        }
        if (jsonParsed.action) {
          const actionName = jsonParsed.action;
          const params = jsonParsed.params || {};

          let mappedToolName = actionName;
          if (actionName === "navigate") mappedToolName = "navigate_to_page";
          if (actionName === "open_modal") mappedToolName = "open_modal";
          if (actionName === "highlight_ui") mappedToolName = "highlight_ui_element";
          if (actionName === "fetch_data") {
            const ep = (params.endpoint || "").toLowerCase();
            if (ep.includes("schedule") || ep.includes("jadwal")) {
              mappedToolName = "get_class_schedule";
            } else if (ep.includes("notif")) {
              mappedToolName = "get_user_notifications";
            } else {
              mappedToolName = "get_latest_announcements";
            }
          }

          actionToolToRun = { tool: mappedToolName, parameters: params };
        }
      } else {
        finalSpeech = rawLlmOutput.replace(/\[ACTION:.*?\]/g, "").trim();
      }
    } catch (err) {
      console.warn("[Replyz AI] API call encountered an error, activating local companion engine fallback:", err?.message);
    }
  }

  let suggestions = [];

  // 3. Dispatch UI Action & Directly Render JS Formatted Result in Chat
  if (actionToolToRun) {
    try {
      const toolRes = await executeAiTool(actionToolToRun.tool, actionToolToRun.parameters, { ...context, userQuery });

      if (toolRes && toolRes.suggestions) {
        suggestions = toolRes.suggestions;
      }

      if (toolRes && toolRes.resultMessage && (actionToolToRun.tool === "get_class_schedule" || actionToolToRun.tool === "get_latest_announcements")) {
        finalSpeech = toolRes.resultMessage;
      }
    } catch (err) {
      console.warn("[Replyz AI] Action execution error:", err);
    }
  }

  // 4. Fallback Friendly Response if API key limit or error occurs
  if (!finalSpeech) {
    finalSpeech = generateLocalCompanionFallback(userQuery, backendContext);
  }

  // Clean technical log artifacts if any
  finalSpeech = finalSpeech
    .replace(/\[ACTION:.*?\]/g, "")
    .replace(/\*\[Aksi Otomatis:.*?\]\*/g, "")
    .trim();

  return {
    text: finalSpeech,
    emotion: finalEmotion,
    suggestions,
    hasApiKey: Boolean(
      apiKey &&
        apiKey !== "your_ai_api_key_here" &&
        apiKey !== "your_gemini_api_key_here"
    ),
  };
}

export const generateRepliAiResponse = generateReplyzAiResponse;
export const generateBloubAiResponse = generateReplyzAiResponse;
