"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "@/hooks/useAuth";
import calendarService from "@/services/calendarService";
import LoginRequiredFallback from "@/components/common/LoginRequiredFallback";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MapPin,
  Clock,
  BookOpen,
  Flag,
  Users,
  CheckSquare,
  X,
  Info,
  CalendarDays,
  ListTodo,
  Trash2,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  AlertCircle
} from "lucide-react";

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none border border-slate-200 shadow-xl max-w-md w-full p-5 sm:p-6 relative z-10 text-slate-900 text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
          aria-label="Tutup modal"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
};

// Helper: Format Date to YYYY-MM-DD
const formatDate = (date) => {
  if (!date) return "";
  if (typeof date === "string") {
    if (date.startsWith("0001")) return "";
    const match = date.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const y = match[1];
      if (parseInt(y, 10) < 1900) return "";
      const m = match[2].padStart(2, "0");
      const d = match[3].padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 1900) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

// Helper: Format event date range for Indonesian locale
const formatEventDateRange = (startDateStr, endDateStr) => {
  if (!endDateStr || startDateStr === endDateStr) {
    const d = new Date(startDateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }
  const s = new Date(startDateStr);
  const e = new Date(endDateStr);
  return `${s.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${e.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
};

export default function KalenderPage() {
  const { role, user } = useAuth();
  const userRole = (role || user?.role || "").toLowerCase();

  // OSIS, Admin, and Guru (Teacher) are allowed to add/delete events
  const isAllowedToAddEvent =
    userRole === "admin" ||
    userRole === "teacher" ||
    userRole === "guru" ||
    userRole === "osis" ||
    role === "Admin" ||
    role === "Guru" ||
    role === "Teacher" ||
    role === "OSIS";

  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();

  // State Management
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMonthStr = String(today.getMonth() + 1).padStart(2, "0");

  // Default Seed Events Fallback if Database is empty
  const SEED_CALENDAR_EVENTS = useMemo(() => [
    {
      id: "seed-1",
      date: `${year}-${currentMonthStr}-03`,
      end: `${year}-${currentMonthStr}-05`,
      title: "Masa Bimbingan & Orientasi Siswa",
      category: "Akademik",
      location: "Aula SMKN 2 Surakarta",
      description: "Pengarahan program akademik dan kegiatan pembekalan siswa."
    },
    {
      id: "seed-2",
      date: `${year}-${currentMonthStr}-10`,
      end: `${year}-${currentMonthStr}-10`,
      title: "Rapat Koordinasi Pengurus OSIS & MPK",
      category: "OSIS",
      location: "Ruang OSIS SMKN 2 Surakarta",
      description: "Musyawarah evaluasi bulanan dan persiapan kegiatan sekolah."
    },
    {
      id: "seed-3",
      date: `${year}-${currentMonthStr}-14`,
      end: `${year}-${currentMonthStr}-14`,
      title: "Hari Pramuka & Latihan Gabungan",
      category: "Ekstrakurikuler",
      location: "Halaman SMKN 2 Surakarta",
      description: "Kegiatan peringatan Hari Pramuka dan apel serentak."
    },
    {
      id: "seed-4",
      date: `${year}-${currentMonthStr}-17`,
      end: `${year}-${currentMonthStr}-17`,
      title: "Upacara Bendera HUT Kemerdekaan RI",
      category: "Libur Nasional",
      location: "Lapangan Utama SMKN 2 Surakarta",
      description: "Seluruh siswa dan bapak/ibu guru mengikuti upacara peringatan HUT Kemerdekaan RI."
    },
    {
      id: "seed-5",
      date: `${year}-${currentMonthStr}-24`,
      end: `${year}-${currentMonthStr}-27`,
      title: "Penilaian Tengah Semester (PTS)",
      category: "Ujian",
      location: "Ruang Kelas & Lab Komputer",
      description: "Pelaksanaan evaluasi pembelajaran PTS berbasis CBT."
    }
  ], [year, currentMonthStr]);

  // Fetch Events from Backend API Endpoint
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setIsUnauthorized(false);
    try {
      const res = await calendarService.getEvents({ page: 1, pageSize: 100 });
      const rawData = res?.data ?? res;
      const apiItems = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(res?.items)
        ? res.items
        : [];

      if (apiItems.length > 0) {
        const isValidDateStr = (str) => typeof str === "string" && str.length >= 10 && !str.startsWith("0001");
        const mapped = apiItems.map((item) => {
          const rawStart = isValidDateStr(item.startDate)
            ? item.startDate
            : isValidDateStr(item.StartDate)
            ? item.StartDate
            : isValidDateStr(item.eventDate)
            ? item.eventDate
            : isValidDateStr(item.EventDate)
            ? item.EventDate
            : item.date || "";

          const rawEnd = isValidDateStr(item.endDate)
            ? item.endDate
            : isValidDateStr(item.EndDate)
            ? item.EndDate
            : isValidDateStr(item.end)
            ? item.end
            : rawStart;

          const sDate = formatDate(rawStart) || formatDate(new Date());
          const eDate = formatDate(rawEnd) || sDate;

          return {
            id: item.id || item.Id,
            date: sDate,
            end: eDate,
            title: item.title || item.Title || "Kegiatan Sekolah",
            category: item.category || item.Category || "Akademik",
            location: item.location || item.Location || "SMKN 2 Surakarta",
            description: item.description || item.Description || "",
          };
        });
        setEvents(mapped);
      } else {
        setEvents(SEED_CALENDAR_EVENTS);
      }
    } catch (err) {
      const checkUnauth =
        err?.statusCode === 401 ||
        err?.response?.status === 401 ||
        err?.message?.includes("Sesi") ||
        err?.message?.includes("Unauthorized") ||
        err?.message?.includes("login");
      if (checkUnauth) {
        setIsUnauthorized(true);
        setEvents([]);
      } else {
        setEvents(SEED_CALENDAR_EVENTS);
      }
    } finally {
      setLoading(false);
    }
  }, [SEED_CALENDAR_EVENTS]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Color & Badge Style Mapping Configurations
  const getCategoryBadgeStyle = (category) => {
    if (!category) return "bg-slate-100 text-slate-700 border-slate-200";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (cat.includes("ujian") || cat.includes("pts") || cat.includes("pas") || cat.includes("pat")) return "bg-amber-50 text-amber-800 border-amber-200";
    if (cat.includes("osis") || cat.includes("mpk")) return "bg-blue-50 text-[#2C1EE8] border-blue-200";
    if (cat.includes("ekstra") || cat.includes("eskul")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const getCategoryColor = (category) => {
    if (!category) return "bg-slate-400";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-rose-500";
    if (cat.includes("ujian") || cat.includes("pts")) return "bg-amber-500";
    if (cat.includes("osis")) return "bg-[#2C1EE8]";
    if (cat.includes("ekstra")) return "bg-purple-500";
    return "bg-emerald-500";
  };

  const categoryColors = {
    "Libur Nasional": "bg-rose-500",
    Akademik: "bg-emerald-500",
    Ujian: "bg-amber-500",
    OSIS: "bg-[#2C1EE8]",
    Ekstrakurikuler: "bg-purple-500",
  };

  const categoryBadgeStyles = {
    "Libur Nasional": "bg-rose-50 text-rose-700 border-rose-200",
    Akademik: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Ujian: "bg-amber-50 text-amber-800 border-amber-200",
    OSIS: "bg-blue-50 text-[#2C1EE8] border-blue-200",
    Ekstrakurikuler: "bg-purple-50 text-purple-700 border-purple-200",
  };

  // Add Event Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    category: "",
    location: "",
    description: "",
  });

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const submitNewEvent = async (e) => {
    e.preventDefault();
    if (newEvent.end && new Date(newEvent.start) > new Date(newEvent.end)) {
      alert("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: newEvent.title.trim(),
        description: newEvent.description ? newEvent.description.trim() : null,
        startDate: new Date(newEvent.start).toISOString(),
        endDate: new Date(newEvent.end || newEvent.start).toISOString(),
        location: newEvent.location ? newEvent.location.trim() : "SMKN 2 Surakarta",
        category: newEvent.category,
        isAllDay: true,
      };
      const res = await calendarService.createEvent(payload);
      if (res?.success) {
        setShowAddModal(false);
        setNewEvent({ title: "", start: "", end: "", category: "", location: "", description: "" });
        await fetchEvents();
      } else {
        alert(res?.message || "Gagal menambah kegiatan kalender.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan kegiatan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!id) return;
    if (!confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) return;
    try {
      const res = await calendarService.deleteEvent(id);
      if (res?.success) {
        setShowDetailModal(false);
        await fetchEvents();
      } else {
        alert(res?.message || "Gagal menghapus kegiatan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menghapus kegiatan.");
    }
  };

  // Month navigation logic - Main Calendar
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const resetToToday = () => {
    const current = new Date();
    setCurrentMonth(new Date(current.getFullYear(), currentMonth.getMonth(), 1));
    setSelectedDate(formatDate(current));
  };

  // OSIS, Admin, and Guru (Teacher) are allowed to view OSIS category & OSIS events
  const canViewOsisCategory = useMemo(() => {
    return (
      userRole === "admin" ||
      userRole === "teacher" ||
      userRole === "guru" ||
      userRole === "osis" ||
      role === "Admin" ||
      role === "Teacher" ||
      role === "Guru" ||
      role === "OSIS"
    );
  }, [userRole, role]);

  // Filter base events so non-OSIS/Guru/Admin users cannot see OSIS events at all
  const visibleEvents = useMemo(() => {
    if (canViewOsisCategory) return events;
    return events.filter((e) => {
      const cat = (e.category || "").trim().toLowerCase();
      return !cat.includes("osis") && !cat.includes("mpk");
    });
  }, [events, canViewOsisCategory]);

  // Filter & Search Logic
  const filteredEvents = useMemo(() => {
    return filter === "All" ? visibleEvents : visibleEvents.filter((e) => e.category === filter);
  }, [visibleEvents, filter]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return visibleEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (e.location && e.location.toLowerCase().includes(query)) ||
        e.category.toLowerCase().includes(query)
    );
  }, [visibleEvents, searchQuery]);

  // Check if a date string falls within an event range
  const isEventOnDate = useCallback((e, dateStr) => {
    if (!e.end) return e.date === dateStr;
    return dateStr >= e.date && dateStr <= e.end;
  }, []);

  // Filter events for a specific date
  const eventsForDate = useCallback(
    (dateStr) => {
      return filteredEvents.filter((e) => isEventOnDate(e, dateStr));
    },
    [filteredEvents, isEventOnDate]
  );

  // Main Calendar Date Grid Math
  const startDay = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(), [currentMonth]);
  const daysInMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate(), [currentMonth]);

  // Total events in current selected month
  const currentMonthEventsCount = useMemo(() => {
    return visibleEvents.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  }, [visibleEvents, currentMonth]);

  // Open Detail Modal
  const openDetail = (dateStr) => {
    setSelectedDate(dateStr);
    setShowDetailModal(true);
  };

  // Today Events computed list
  const todayEvents = useMemo(() => {
    const todayStr = formatDate(today);
    return visibleEvents.filter((e) => isEventOnDate(e, todayStr));
  }, [visibleEvents, today, isEventOnDate]);

  // Upcoming events sorted chronologically (excluding past events)
  const upcomingEvents = useMemo(() => {
    const todayStr = formatDate(today);
    return visibleEvents
      .filter((e) => {
        const checkDate = e.end || e.date;
        return checkDate >= todayStr;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [visibleEvents, today]);

  // Statistics Computations
  const stats = useMemo(() => {
    return {
      total: visibleEvents.length,
      libur: visibleEvents.filter((e) => e.category === "Libur Nasional").length,
      akademik: visibleEvents.filter((e) => e.category === "Akademik").length,
      ujian: visibleEvents.filter((e) => e.category === "Ujian").length,
      ekskul: visibleEvents.filter((e) => e.category === "Ekstrakurikuler").length,
      osis: visibleEvents.filter((e) => e.category === "OSIS").length,
    };
  }, [visibleEvents]);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-4">
        {/* Top Direct Action Toolbar */}
        <div className="bg-white border border-slate-200 rounded-none p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#2C1EE8]" />
              <span>Kalender Akademik & Agenda Kegiatan {year}</span>
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Jadwal agenda pembelajaran, evaluasi PTS/PAS, program OSIS, ekstrakurikuler, dan hari libur sekolah.
            </p>
          </div>

          {isAllowedToAddEvent && (
            <button
              onClick={() => {
                setNewEvent({
                  title: "",
                  start: formatDate(new Date()),
                  end: formatDate(new Date()),
                  category: "Akademik",
                  location: "SMKN 2 Surakarta",
                  description: ""
                });
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Agenda</span>
            </button>
          )}
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Kegiatan", count: stats.total, color: "text-[#2C1EE8] bg-blue-50 border-blue-200" },
            { label: "Libur Nasional", count: stats.libur, color: "text-rose-700 bg-rose-50 border-rose-200" },
            { label: "Agenda Akademik", count: stats.akademik, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            { label: "Jadwal Ujian", count: stats.ujian, color: "text-amber-800 bg-amber-50 border-amber-200" },
            { label: "Ekstrakurikuler", count: stats.ekskul, color: "text-purple-700 bg-purple-50 border-purple-200" }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-none border border-slate-200 bg-white shadow-xs flex flex-col justify-between text-left"
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900">{item.count}</span>
                <span className={`px-1.5 py-0.2 rounded-none text-[9.5px] font-bold uppercase border font-mono ${item.color}`}>
                  Aktif
                </span>
              </div>
            </div>
          ))}
        </div>

        {isUnauthorized ? (
          <LoginRequiredFallback featureName="Kalender Akademik" />
        ) : (
          /* Main 2-Column Workspace Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start text-left">
            {/* LEFT COLUMN: Main Calendar Grid */}
            <div className="lg:col-span-8 space-y-4">
              {/* Search and Category Filter Toolbar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-none border border-slate-200 shadow-xs space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama agenda atau lokasi kegiatan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-none pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#2C1EE8] outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {["All", "Akademik", "Ujian", "Libur Nasional", "Ekstrakurikuler", ...(canViewOsisCategory ? ["OSIS"] : [])].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-2.5 py-1 rounded-none text-[10.5px] font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer border ${
                          filter === cat
                            ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {cat === "All" ? "Semua Kategori" : cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Instant Search Results Panel */}
              {searchQuery && (
                <div className="bg-white p-4 rounded-none border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Hasil pencarian &quot;{searchQuery}&quot;
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#2C1EE8] border border-blue-200 font-mono font-bold px-2 py-0.2 rounded-none">
                      {searchResults.length} kegiatan
                    </span>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {searchResults.map((e, idx) => (
                        <div
                          key={idx}
                          onClick={() => openDetail(e.date)}
                          className="p-3 rounded-none border border-slate-200 hover:border-[#2C1EE8] hover:bg-blue-50/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-slate-900 text-xs line-clamp-1 uppercase">{e.title}</h4>
                            <span
                              className={`text-[9.5px] font-bold uppercase font-mono px-1.5 py-0.2 rounded-none border shrink-0 ${
                                categoryBadgeStyles[e.category] || "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {e.category}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-[11px] text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatEventDateRange(e.date, e.end)}</span>
                            </div>
                            {e.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{e.location}</span>
                              </div>
                            )}
                          </div>
                          {e.description && (
                            <p className="mt-1.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-normal">
                              {e.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-none border border-slate-200">
                      Tidak ada kegiatan yang sesuai dengan kata kunci pencarian.
                    </p>
                  )}
                </div>
              )}

              {/* MAIN CALENDAR GRID */}
              <div className="bg-white p-4 sm:p-5 rounded-none border border-slate-200 shadow-xs">
                {/* Month Header Controls */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Tahun {currentMonth.getFullYear()}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight uppercase">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={resetToToday}
                      className="px-2.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      Hari Ini
                    </button>
                    <div className="flex items-center bg-slate-50 border border-slate-200">
                      <button
                        onClick={prevMonth}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        aria-label="Bulan sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border-l border-slate-200"
                        aria-label="Bulan berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Day of Week Labels */}
                <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  <div className="text-rose-600">Min</div>
                  <div>Sen</div>
                  <div>Sel</div>
                  <div>Rab</div>
                  <div>Kam</div>
                  <div>Jum</div>
                  <div className="text-[#2C1EE8]">Sab</div>
                </div>

                {/* Days Monthly Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {Array.from({ length: startDay }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="p-1.5 min-h-[70px] sm:min-h-[90px] rounded-none bg-slate-50/50 border border-transparent"
                    />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), idx + 1);
                    const dateStr = formatDate(dateObj);
                    const isToday = dateStr === formatDate(today);

                    const dayEvents = eventsForDate(dateStr);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <button
                        key={dateStr}
                        onClick={() => openDetail(dateStr)}
                        className={`group p-1.5 sm:p-2 min-h-[75px] sm:min-h-[95px] rounded-none flex flex-col justify-between transition-colors border text-left cursor-pointer relative ${
                          isToday
                            ? "bg-[#2C1EE8] text-white border-[#2C1EE8] shadow-xs"
                            : "bg-white text-slate-800 border-slate-200 hover:border-[#2C1EE8] hover:bg-blue-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isToday ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          {hasEvents && (
                            <span
                              className={`text-[9px] font-bold font-mono px-1 py-0.2 rounded-none ${
                                isToday ? "bg-white/25 text-white" : "bg-blue-50 text-[#2C1EE8] border border-blue-200"
                              }`}
                            >
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {hasEvents && (
                          <div className="w-full mt-1 space-y-0.5">
                            {/* Mobile: Color Dots */}
                            <div className="flex flex-wrap gap-1 sm:hidden">
                              {dayEvents.map((e, i) => (
                                <span
                                  key={i}
                                  className={`inline-block w-1.5 h-1.5 rounded-none ${
                                    isToday ? "bg-white" : getCategoryColor(e.category)
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Desktop: Event Labels */}
                            <div className="hidden sm:block space-y-0.5">
                              {dayEvents.slice(0, 2).map((e, i) => (
                                <div
                                  key={i}
                                  className={`text-[9.5px] font-bold leading-tight px-1 py-0.5 rounded-none truncate border ${
                                    isToday
                                      ? "bg-white/20 text-white border-white/30"
                                      : getCategoryBadgeStyle(e.category)
                                  }`}
                                >
                                  {e.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div
                                  className={`text-[9px] font-bold font-mono pl-0.5 ${
                                    isToday ? "text-blue-100" : "text-slate-500"
                                  }`}
                                >
                                  +{dayEvents.length - 2} lainnya
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Category Legend */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#2C1EE8] rounded-none inline-block" />
                    <span>Hari Ini</span>
                  </div>
                  {Object.keys(categoryColors)
                    .filter((cat) => cat !== "OSIS" || canViewOsisCategory)
                    .map((cat) => (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-none inline-block ${categoryColors[cat]}`} />
                        <span>{cat}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Sidebar Highlights */}
            <div className="lg:col-span-4 space-y-4 text-left">
              {/* Monthly Overview Card */}
              <div className="bg-white p-4 rounded-none border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    Ringkasan {monthNames[currentMonth.getMonth()]}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#2C1EE8]" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-none border border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Bulan Ini</span>
                    <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
                      {currentMonthEventsCount} Agenda
                    </span>
                  </div>
                  <div className="p-2.5 bg-blue-50/50 rounded-none border border-blue-200">
                    <span className="block text-[10px] font-bold text-[#2C1EE8] uppercase">Hari Ini</span>
                    <span className="text-lg font-bold font-mono text-[#2C1EE8] block mt-0.5">
                      {todayEvents.length} Agenda
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Pilih tanggal pada kisi kalender untuk membaca rincian lengkap kegiatan atau menambahkan agenda baru bagi pengurus.
                </p>
              </div>

              {/* Agenda Hari Ini */}
              <div className="bg-white p-4 rounded-none border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>Agenda Hari Ini</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </div>

                {todayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {todayEvents.map((e, idx) => (
                      <div
                        key={idx}
                        onClick={() => openDetail(e.date)}
                        className="p-3 border border-slate-200 rounded-none hover:border-[#2C1EE8] hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <span
                          className={`text-[9.5px] font-bold font-mono uppercase px-1.5 py-0.2 rounded-none border inline-block mb-1.5 ${
                            categoryBadgeStyles[e.category] || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {e.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 uppercase">{e.title}</h4>
                        {e.location && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{e.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-none border border-slate-200">
                    <CalendarDays className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs text-slate-500 font-medium">Tidak ada kegiatan sekolah hari ini.</p>
                  </div>
                )}
              </div>

              {/* Kegiatan Mendatang */}
              <div className="bg-white p-4 rounded-none border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ListTodo className="w-3.5 h-3.5 text-[#2C1EE8]" />
                    <span>Kegiatan Mendatang</span>
                  </h3>
                </div>

                {upcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingEvents.map((e, idx) => {
                      const eventDate = new Date(e.date);
                      const isMulti = !!e.end && e.date !== e.end;
                      return (
                        <div
                          key={idx}
                          onClick={() => openDetail(e.date)}
                          className="flex gap-2.5 items-start cursor-pointer p-2 rounded-none hover:bg-slate-50 border border-slate-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center w-10 h-10 shrink-0 rounded-none bg-blue-50 border border-blue-200 text-center">
                            <span className="text-[9.5px] font-bold text-[#2C1EE8] uppercase leading-none font-mono">
                              {eventDate.toLocaleString("id-ID", { month: "short" })}
                            </span>
                            <span className="text-xs font-bold font-mono text-slate-900 leading-none mt-1">
                              {eventDate.getDate()}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <span
                              className={`text-[9px] font-bold font-mono uppercase px-1 py-0.2 rounded-none border inline-block mb-0.5 ${
                                categoryBadgeStyles[e.category] || "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {e.category}
                            </span>
                            <h4 className="font-bold text-slate-900 text-xs line-clamp-1 uppercase">{e.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500 font-medium">
                              {isMulti && (
                                <span className="text-amber-700 font-bold flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> Multi-hari
                                </span>
                              )}
                              {e.location && <span className="truncate">{e.location}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-none border border-slate-200">
                    Belum ada kegiatan terjadwal berikutnya.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EVENT DETAIL */}
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}>
          {selectedDate && (
            <div className="space-y-3 text-left">
              <div className="pb-2.5 border-b border-slate-100">
                <span className="text-[10px] font-mono font-bold text-[#2C1EE8] uppercase tracking-wider block">
                  Rincian Kegiatan
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 uppercase">
                  {new Date(selectedDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </h3>
              </div>

              {eventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {eventsForDate(selectedDate).map((e, idx) => (
                    <div key={idx} className="p-3 rounded-none border border-slate-200 bg-slate-50 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-xs uppercase">{e.title}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-[9.5px] font-bold font-mono uppercase px-1.5 py-0.2 rounded-none border ${
                              categoryBadgeStyles[e.category] || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {e.category}
                          </span>
                          {isAllowedToAddEvent && e.id && (
                            <button
                              onClick={() => handleDeleteEvent(e.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Hapus Kegiatan"
                              aria-label="Hapus kegiatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-0.5 text-[11px] text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatEventDateRange(e.date, e.end)}</span>
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{e.location}</span>
                          </div>
                        )}
                      </div>

                      {e.description && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">{e.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center bg-slate-50 rounded-none border border-slate-200">
                  <CalendarIcon className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500 font-medium">Tidak ada agenda kegiatan di tanggal ini.</p>

                  {isAllowedToAddEvent && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setNewEvent((prev) => ({ ...prev, start: selectedDate, end: selectedDate }));
                        setShowAddModal(true);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase text-[#2C1EE8] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Buat kegiatan di tanggal ini
                    </button>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-end pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-none text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: ADD EVENT FORM */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
          <form onSubmit={submitNewEvent} className="space-y-3 text-xs text-left">
            <div className="pb-2.5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 uppercase">Tambah Kegiatan Baru</h3>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">Lengkapi data agenda kalender sekolah.</p>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Judul Kegiatan <span className="text-rose-500">*</span></label>
              <input
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleAddChange}
                placeholder="Contoh: Penilaian Akhir Semester"
                className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">Tanggal Mulai <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  name="start"
                  value={newEvent.start}
                  onChange={handleAddChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors font-mono cursor-pointer"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider text-[11px]">Tanggal Selesai</label>
                <input
                  type="date"
                  name="end"
                  value={newEvent.end}
                  onChange={handleAddChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors font-mono cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Kategori Agenda <span className="text-rose-500">*</span></label>
              <select
                name="category"
                value={newEvent.category}
                onChange={handleAddChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors cursor-pointer font-semibold"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="Akademik">Akademik</option>
                <option value="Ujian">Ujian</option>
                <option value="Libur Nasional">Libur Nasional</option>
                {canViewOsisCategory && <option value="OSIS">OSIS</option>}
                <option value="Ekstrakurikuler">Ekstrakurikuler</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Lokasi</label>
              <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleAddChange}
                placeholder="Contoh: Aula / Lab Komputer SMKN 2 Surakarta"
                className="w-full bg-slate-50 border border-slate-200 rounded-none px-3 py-2 text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-bold uppercase tracking-wider">Deskripsi Ringkas</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleAddChange}
                placeholder="Tuliskan keterangan detail kegiatan di sini..."
                className="w-full bg-slate-50 border border-slate-200 rounded-none p-3 text-slate-900 focus:outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors font-normal resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-none font-bold uppercase tracking-wider cursor-pointer transition-colors text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#2C1EE8] hover:bg-[#2013ce] active:bg-[#1d129f] text-white rounded-none font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Agenda"
                )}
              </button>
            </div>
          </form>
        </Modal>
      </main>

      <Footer />
    </div>
  );
}