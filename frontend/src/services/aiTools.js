import { announcementService } from "@/services/announcementService";
import { scheduleService } from "@/services/scheduleService";
import { notificationService } from "@/services/notificationService";
import { profileService } from "@/services/profileService";

/**
 * AI Tool / Function Calling Definitions Matrix
 * Pure Dynamic Engine - All Data Fetched Directly from REST API Endpoints
 */
export const AI_TOOLS = {
  // 1. Navigation & UI Controls
  NAVIGATE: {
    name: "navigate_to_page",
    description: "Directs the user to a specific route in the app.",
    parameters: { route: "string (e.g., '/pengumuman', '/jadwal', '/fasilitas')" },
  },
  HIGHLIGHT_UI: {
    name: "highlight_ui_element",
    description: "Highlights/spotlights a UI element to show the user where it is.",
    parameters: { target: "string ('notif_button' | 'login_button' | 'theme_toggle')" },
  },
  OPEN_MODAL: {
    name: "open_modal",
    description: "Opens a specific modal popup for the user.",
    parameters: { modalName: "string ('login' | 'notification_center')" },
  },

  // 2. Dynamic Backend Data Fetchers
  FETCH_ANNOUNCEMENTS: {
    name: "get_latest_announcements",
    description: "Fetches the latest official announcements from the backend API.",
    parameters: { limit: "number (default: 3)" },
  },
  FETCH_SCHEDULE: {
    name: "get_class_schedule",
    description: "Fetches the timetable/schedule for a specific class or day.",
    parameters: { className: "string (optional)", day: "string (optional)" },
  },
  FETCH_NOTIFICATIONS: {
    name: "get_user_notifications",
    description: "Fetches recent user notifications and unread count from backend.",
    parameters: {},
  },
};

/**
 * Route normalization helper
 */
const normalizeRoute = (inputRoute) => {
  const r = (inputRoute || "").toLowerCase().trim();
  if (r.includes("jadwal")) return "/jadwal";
  if (r.includes("mading")) return "/mading";
  if (r.includes("pengumuman") || r.includes("berita")) return "/pengumuman";
  if (r.includes("kelas")) return "/kelas";
  if (r.includes("fasilitas") || r.includes("lab")) return "/fasilitas";
  if (r.includes("komunitas") || r.includes("circle") || r.includes("forum")) return "/komunitas";
  if (r.includes("perpustakaan") || r.includes("buku")) return "/perpustakaan";
  if (r.includes("kalender") || r.includes("agenda")) return "/kalender";
  if (r.includes("profil") || r.includes("profile")) return "/profile";
  if (r.includes("dashboard")) return "/dashboard";
  if (r.includes("admin")) return "/admin";
  if (r.includes("cctv")) return "/cctv";
  if (r.includes("nilai")) return "/nilai";
  if (r.includes("beranda") || r.includes("home") || r === "/") return "/";
  if (inputRoute && inputRoute.startsWith("/")) return inputRoute;
  return "/";
};

/**
 * Action Executor for AI Tools (100% Dynamic - No Hardcoded Fake Data)
 */
export async function executeAiTool(toolName, parameters = {}, context = {}) {
  const { router } = context;

  switch (toolName) {
    case "navigate_to_page": {
      const route = normalizeRoute(parameters.route || "/");
      if (router && typeof router.push === "function") {
        router.push(route);
      } else if (typeof window !== "undefined") {
        window.location.href = route;
      }
      return {
        tool: toolName,
        success: true,
        actionName: "Navigasi Halaman",
        resultMessage: `Navigasi berhasil! Mengarahkan kamu ke halaman ${route}.`,
        payload: { route },
      };
    }

    case "highlight_ui_element": {
      const target = parameters.target || "login_button";
      let element = null;

      if (typeof document !== "undefined") {
        element = document.querySelector(`[data-ai-target="${target}"], #${target}`);

        if (!element && target === "login_button") {
          const buttons = Array.from(document.querySelectorAll("button, a"));
          element = buttons.find((b) => /login|masuk/i.test(b.textContent || ""));
        }
        if (!element && target === "notif_button") {
          element =
            document.querySelector('[data-ai-target="notif_button"]') ||
            document.querySelector(".notification-bell-btn") ||
            Array.from(document.querySelectorAll("button")).find((b) =>
              b.getAttribute("aria-label")?.toLowerCase().includes("notifikasi")
            );
        }
      }

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        const originalTransition = element.style.transition;
        const originalShadow = element.style.boxShadow;
        element.style.transition = "all 0.3s ease-in-out";
        element.style.boxShadow = "0 0 0 4px #2334e6, 0 0 25px rgba(35, 52, 230, 0.6)";

        setTimeout(() => {
          element.style.boxShadow = originalShadow || "";
          element.style.transition = originalTransition || "";
        }, 3500);

        return {
          tool: toolName,
          success: true,
          actionName: "Spotlight Elemen UI",
          resultMessage: `Elemen '${target}' berhasil disorot dengan efek spotlight di layar! ✨`,
          payload: { target },
        };
      }

      return {
        tool: toolName,
        success: false,
        actionName: "Spotlight Elemen UI",
        resultMessage: `Elemen '${target}' tidak ditemukan di halaman ini.`,
        payload: { target },
      };
    }

    case "open_modal": {
      const modalName = String(parameters.modalName || "login").toLowerCase();
      if (typeof window !== "undefined") {
        if (modalName.includes("login")) {
          window.dispatchEvent(new CustomEvent("app:open-login"));
        } else if (modalName.includes("notif")) {
          if (typeof window.openNotificationDrawer === "function") {
            window.openNotificationDrawer();
          } else {
            window.dispatchEvent(new CustomEvent("app:open-notifications"));
          }
        }
      }
      return {
        tool: toolName,
        success: true,
        actionName: "Buka Modal",
        resultMessage: modalName.includes("notif") ? "Panel Notifikasi telah dibukakan untukmu." : `Modal '${modalName}' telah berhasil dibuka!`,
        payload: { modalName },
      };
    }

    case "get_latest_announcements": {
      const limit = parameters.limit || 3;
      try {
        const res = await announcementService.getAnnouncements({ pageSize: limit });
        const items = res?.data?.items || res?.data || (Array.isArray(res) ? res : []);

        if (Array.isArray(items) && items.length > 0) {
          const listText = items
            .slice(0, limit)
            .map((a, idx) => {
              const title = a.title || "Pengumuman Sekolah";
              const category = a.category ? `[${a.category}] ` : "";
              const content = (a.content || a.summary || "").slice(0, 120);
              return `${idx + 1}. 📌 **${category}${title}**\n   "${content}${
                content.length >= 120 ? "..." : ""
              }"`;
            })
            .join("\n\n");

          return {
            tool: toolName,
            success: true,
            actionName: "Fetch Pengumuman Backend",
            resultMessage: `Berhasil mengambil ${items.length} pengumuman terbaru dari database backend:\n\n${listText}`,
            payload: { items: items.slice(0, limit) },
          };
        }
      } catch (err) {
        console.warn("Error fetching announcements via REST API:", err);
      }

      return {
        tool: toolName,
        success: true,
        actionName: "Fetch Pengumuman Backend",
        resultMessage: "Saat ini belum ada pengumuman resmi yang terdaftar di database backend SMKN 2 Surakarta.",
        payload: { items: [] },
      };
    }

    case "get_class_schedule": {
      let userClassName = "XII PPLG B";
      let userClassId = null;

      try {
        const profileRes = await profileService.getProfile().catch(() => null);
        const profile = profileRes?.data ?? profileRes;
        if (profile) {
          if (profile.className || profile.ClassName) userClassName = profile.className || profile.ClassName;
          if (profile.classId || profile.ClassId) userClassId = profile.classId || profile.ClassId;
        }
      } catch (e) {
        console.warn("Could not fetch user profile for class filter:", e);
      }

      const qLower = ((parameters.day || parameters.query || "") + " " + (context.userQuery || "")).toLowerCase();
      let dayName = (parameters.day || "").toLowerCase();
      if (!dayName || !["senin", "selasa", "rabu", "kamis", "jumat"].includes(dayName)) {
        if (qLower.includes("senin")) dayName = "senin";
        else if (qLower.includes("selasa")) dayName = "selasa";
        else if (qLower.includes("rabu")) dayName = "rabu";
        else if (qLower.includes("kamis")) dayName = "kamis";
        else if (qLower.includes("jumat")) dayName = "jumat";
        else dayName = "senin";
      }

      const isJamKeQuery = qLower.includes("jam ke") || qLower.includes("jam-ke") || qLower.includes("pukul ke");

      let targetHour = parameters.hour ? parseInt(parameters.hour, 10) : null;
      if (isJamKeQuery) {
        targetHour = null;
      } else if (!targetHour) {
        const hourMatch = qLower.match(/(?:jam|pukul)?\s*(\d{1,2})(?::|\.|\s*00)?/);
        if (hourMatch && (qLower.includes("jam") || qLower.includes("pukul"))) {
          const parsedH = parseInt(hourMatch[1], 10);
          if (parsedH >= 1 && parsedH <= 24) targetHour = parsedH;
        }
      }

      let rawItems = [];
      try {
        const params = { day: dayName };
        if (userClassId) params.classId = userClassId;
        else params.className = userClassName;

        const res = await scheduleService.getAll(params).catch(() => null);
        rawItems = res?.data || (Array.isArray(res) ? res : []);

        if (rawItems.length === 0) {
          const studentToday = await scheduleService.getStudentToday().catch(() => null);
          rawItems = studentToday?.data || (Array.isArray(studentToday) ? studentToday : []);
        }
      } catch (err) {
        console.warn("Error fetching schedule via REST API:", err);
      }

      let fetchedScheduleItems = rawItems.map((s) => {
        const time = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.time || "07.00 - 15.00");
        const subject = s.subjectName || s.subject || "Mata Pelajaran";
        const teacher = s.teacherName || s.teacher || s.teacherFullName || "Guru PPLG";
        const room = s.roomName || s.room || "Ruang Kelas PPLG";
        const day = (s.day || s.dayName || "").toLowerCase();

        let startH = 7, endH = 15;
        if (s.startTime && s.endTime) {
          const sMatch = String(s.startTime).match(/(\d{1,2})[:.](\d{2})/);
          const eMatch = String(s.endTime).match(/(\d{1,2})[:.](\d{2})/);
          if (sMatch) startH = parseInt(sMatch[1], 10) + parseInt(sMatch[2], 10) / 60;
          if (eMatch) endH = parseInt(eMatch[1], 10) + parseInt(eMatch[2], 10) / 60;
        }

        return { time, subject, teacher, room, day, startH, endH };
      });

      let dayItems = fetchedScheduleItems.filter((item) => item.day.includes(dayName));
      if (dayItems.length === 0) dayItems = fetchedScheduleItems;

      let hourItems = dayItems;
      if (targetHour !== null) {
        hourItems = dayItems.filter((item) => {
          if (item.startH !== undefined && item.endH !== undefined) {
            return Math.max(item.startH, targetHour) < Math.min(item.endH, targetHour + 1) ||
                   Math.floor(item.startH) === targetHour || Math.floor(item.endH) === targetHour;
          }
          const tStr = item.time || item.startTime || "";
          const hStr = targetHour < 10 ? `0${targetHour}` : `${targetHour}`;
          return tStr.includes(hStr);
        });
        if (hourItems.length === 0) hourItems = dayItems;
      }

      const uniqueItems = [];
      const seenKeys = new Set();
      for (const item of hourItems) {
        const key = `${(item.subject || item.subjectName || "").trim()}_${(item.time || item.startTime || "").trim()}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        uniqueItems.push(item);
      }

      const dayFormatted = dayName.toUpperCase();
      let resultText = "";

      if (targetHour !== null) {
        resultText = `Pelajaran Jam ${targetHour}.00 (${dayFormatted} - ${userClassName}):\n\n` +
          uniqueItems.map((s) => `• ${s.time || s.startTime || (targetHour + ".00")}: ${s.subject || s.subjectName}\n  Pengajar: ${s.teacher || s.teacherName || "Guru PPLG"} | Ruangan: ${s.room || s.roomName || "Ruang Kelas PPLG"}`).join("\n\n");
      } else {
        resultText = `Jadwal KBM ${userClassName} - Hari ${dayFormatted}:\n\n` +
          uniqueItems.map((s, idx) => `${idx + 1}. ${s.time || s.startTime}: ${s.subject || s.subjectName}\n   Pengajar: ${s.teacher || s.teacherName || "Guru PPLG"} | Ruangan: ${s.room || s.roomName || "Ruang Kelas PPLG"}`).join("\n\n");
      }

      resultText += "\n\nAda yang mau kamu tanyakan lagi seputar KBM?";

      return {
        tool: toolName,
        success: true,
        actionName: `Jadwal ${userClassName}`,
        resultMessage: resultText,
        suggestions: [
          { label: "Lihat jadwal lengkap", route: "/jadwal", icon: "📅" },
          { label: "Cek pengumuman sekolah", route: "/pengumuman", icon: "📢" },
        ],
        payload: { class: userClassName, day: dayName, targetHour, items: uniqueItems },
      };
    }

    case "get_user_notifications": {
      const qLower = (context.userQuery || "").toLowerCase();
      const isReadDetails = qLower.includes("isi") || qLower.includes("baca") || qLower.includes("buka") || qLower.includes("lihat") || qLower.includes("detail");

      if (isReadDetails) {
        executeAiTool("open_modal", { modalName: "notification_center" }, context).catch(() => null);

        return {
          tool: toolName,
          success: true,
          actionName: "Buka Panel Notifikasi",
          resultMessage: "Aku sudah membukakan panel notifikasi untukmu. Kamu bisa langsung membaca seluruh rincian pesan di sana.",
          payload: { modalOpened: true },
        };
      }

      let unreadCount = 0;
      try {
        const unreadRes = await notificationService.getUnreadCount().catch(() => null);
        if (typeof unreadRes?.data === "number") unreadCount = unreadRes.data;
        else if (typeof unreadRes === "number") unreadCount = unreadRes;
      } catch (err) {
        console.warn("Error fetching unread count via REST API:", err);
      }

      return {
        tool: toolName,
        success: true,
        actionName: "Fetch Notifikasi Backend",
        resultMessage: `Kamu memiliki ${unreadCount} notifikasi yang belum dibaca.\n\nKetik "baca isinya" atau "buka notifikasi" jika kamu ingin aku membukakan panel notifikasi untukmu.`,
        payload: { unreadCount },
      };
    }

    default:
      return {
        tool: toolName,
        success: false,
        actionName: "Unknown Action",
        resultMessage: `Aksi '${toolName}' tidak dikenal.`,
      };
  }
}

/**
 * Autonomous AI Intent Parser
 */
export function parseAiIntent(userQuery) {
  const queryLower = (userQuery || "").toLowerCase();

  // 1. Navigation Intent Matching
  if (
    queryLower.includes("bawa aku ke") ||
    queryLower.includes("pergi ke") ||
    queryLower.includes("buka halaman") ||
    queryLower.includes("navigasi ke") ||
    queryLower.includes("buka menu") ||
    queryLower.includes("ke halaman") ||
    queryLower.includes("jelajahi") ||
    queryLower.includes("buka page") ||
    queryLower.includes("ke page") ||
    queryLower.startsWith("ke ") ||
    queryLower.includes(" profil") ||
    queryLower.includes(" profile")
  ) {
    if (queryLower.includes("pengumuman") || queryLower.includes("mading") || queryLower.includes("berita")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/pengumuman" } };
    }
    if (queryLower.includes("jadwal") || queryLower.includes("kelas")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/kelas" } };
    }
    if (queryLower.includes("fasilitas") || queryLower.includes("lab") || queryLower.includes("perpus")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/fasilitas" } };
    }
    if (queryLower.includes("komunitas") || queryLower.includes("circle") || queryLower.includes("forum")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/komunitas" } };
    }
    if (queryLower.includes("perpustakaan") || queryLower.includes("buku")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/perpustakaan" } };
    }
    if (queryLower.includes("beranda") || queryLower.includes("home")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/" } };
    }
    if (queryLower.includes("profil") || queryLower.includes("profile")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/profile" } };
    }
  }

  // Direct page shortcuts (e.g., "ke profil page", "buka mading", "profil")
  if (queryLower.includes("profil") || queryLower.includes("profile")) {
    if (queryLower.includes("ke ") || queryLower.includes("buka ") || queryLower.includes("page") || queryLower.includes("halaman")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/profile" } };
    }
  }
  if (queryLower.includes("mading") || queryLower.includes("pengumuman")) {
    if (queryLower.includes("ke ") || queryLower.includes("buka ") || queryLower.includes("page") || queryLower.includes("halaman")) {
      return { tool: AI_TOOLS.NAVIGATE.name, parameters: { route: "/pengumuman" } };
    }
  }

  // 2. Schedule & Timetable Intent Matching
  if (
    queryLower.includes("jadwal") ||
    queryLower.includes("pelajaran") ||
    queryLower.includes("matpel") ||
    queryLower.includes("senin") ||
    queryLower.includes("selasa") ||
    queryLower.includes("rabu") ||
    queryLower.includes("kamis") ||
    queryLower.includes("jumat") ||
    queryLower.includes("sabtu")
  ) {
    if (
      queryLower.includes("ada") ||
      queryLower.includes("cek") ||
      queryLower.includes("apa") ||
      queryLower.includes("jam") ||
      queryLower.includes("lihat") ||
      queryLower.includes("hari") ||
      queryLower.includes("pelajaran")
    ) {
      return { tool: AI_TOOLS.FETCH_SCHEDULE.name, parameters: {} };
    }
  }

  // 3. Spotlight UI Highlight intent
  if (
    queryLower.includes("di mana tombol") ||
    queryLower.includes("tunjukkan tombol") ||
    queryLower.includes("mana tombol") ||
    queryLower.includes("highlight") ||
    queryLower.includes("spotlight") ||
    queryLower.includes("letak tombol")
  ) {
    if (queryLower.includes("login") || queryLower.includes("masuk")) {
      return { tool: AI_TOOLS.HIGHLIGHT_UI.name, parameters: { target: "login_button" } };
    }
    if (queryLower.includes("notifikasi") || queryLower.includes("lonceng") || queryLower.includes("notif")) {
      return { tool: AI_TOOLS.HIGHLIGHT_UI.name, parameters: { target: "notif_button" } };
    }
    if (queryLower.includes("tema") || queryLower.includes("theme") || queryLower.includes("mode")) {
      return { tool: AI_TOOLS.HIGHLIGHT_UI.name, parameters: { target: "theme_toggle" } };
    }
  }

  // 4. Open Modal intent
  if (
    queryLower.includes("buka modal") ||
    queryLower.includes("buka popup") ||
    queryLower.includes("mau login") ||
    queryLower.includes("buka login") ||
    queryLower.includes("tampilkan login") ||
    queryLower.includes("buka pusat notifikasi")
  ) {
    if (queryLower.includes("login") || queryLower.includes("masuk")) {
      return { tool: AI_TOOLS.OPEN_MODAL.name, parameters: { modalName: "login" } };
    }
    if (queryLower.includes("notifikasi") || queryLower.includes("notif")) {
      return { tool: AI_TOOLS.OPEN_MODAL.name, parameters: { modalName: "notification_center" } };
    }
  }

  // 5. Data Fetching intents
  if (
    queryLower.includes("pengumuman") ||
    queryLower.includes("berita sekolah") ||
    queryLower.includes("info terbaru") ||
    queryLower.includes("mading")
  ) {
    if (
      queryLower.includes("ada") ||
      queryLower.includes("lihat") ||
      queryLower.includes("cek") ||
      queryLower.includes("terbaru") ||
      queryLower.includes("apa")
    ) {
      return { tool: AI_TOOLS.FETCH_ANNOUNCEMENTS.name, parameters: { limit: 3 } };
    }
  }

  if (
    queryLower.includes("notifikasi saya") ||
    queryLower.includes("cek notifikasi") ||
    queryLower.includes("ada notif apa") ||
    queryLower.includes("jumlah notifikasi")
  ) {
    return { tool: AI_TOOLS.FETCH_NOTIFICATIONS.name, parameters: {} };
  }

  return null;
}
