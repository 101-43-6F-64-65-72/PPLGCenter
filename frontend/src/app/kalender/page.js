"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  Loader2
} from "lucide-react";

// Simple premium Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-6 relative z-10 border border-gray-100/50 transform transition-all animate-in fade-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
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

// Helper: Format event date range beautifully for Indonesian locale
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
    userRole === "osis" || 
    role === "Admin" || 
    role === "Guru" || 
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
      console.error("Gagal memuat data kegiatan kalender:", err);
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
    if (!category) return "bg-slate-100 text-slate-800 border-slate-200";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-red-50 text-red-700 border-red-200/80";
    if (cat.includes("ujian") || cat.includes("pts") || cat.includes("pas") || cat.includes("pat")) return "bg-amber-50 text-amber-700 border-amber-200/80";
    if (cat.includes("osis") || cat.includes("mpk")) return "bg-blue-50 text-blue-700 border-blue-200/80";
    if (cat.includes("ekstra") || cat.includes("eskul")) return "bg-purple-50 text-purple-700 border-purple-200/80";
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  };

  const getCategoryColor = (category) => {
    if (!category) return "bg-slate-400";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-red-500";
    if (cat.includes("ujian") || cat.includes("pts")) return "bg-amber-500";
    if (cat.includes("osis")) return "bg-blue-500";
    if (cat.includes("ekstra")) return "bg-purple-500";
    return "bg-emerald-500";
  };

  const categoryColors = {
    "Libur Nasional": "bg-red-500",
    Akademik: "bg-emerald-500",
    Ujian: "bg-amber-500",
    OSIS: "bg-blue-500",
    Ekstrakurikuler: "bg-purple-500",
  };

  const categoryBadgeStyles = {
    "Libur Nasional": "bg-red-50 text-red-700 border-red-100",
    Akademik: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Ujian: "bg-amber-50 text-amber-700 border-amber-100",
    OSIS: "bg-blue-50 text-blue-700 border-blue-100",
    Ekstrakurikuler: "bg-purple-50 text-purple-700 border-purple-100",
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
        title: newEvent.title,
        description: newEvent.description || null,
        startDate: new Date(newEvent.start).toISOString(),
        endDate: new Date(newEvent.end || newEvent.start).toISOString(),
        location: newEvent.location || "Sekolah",
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
    setCurrentMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedDate(formatDate(current));
  };

  // Filter & Search Logic
  const filteredEvents = useMemo(() => {
    return filter === "All" ? events : events.filter((e) => e.category === filter);
  }, [events, filter]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (e.location && e.location.toLowerCase().includes(query)) ||
        e.category.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

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
    return events.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return (
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear()
      );
    }).length;
  }, [events, currentMonth]);

  // Open Detail Modal
  const openDetail = (dateStr) => {
    setSelectedDate(dateStr);
    setShowDetailModal(true);
  };

  // Today Events computed list
  const todayEvents = useMemo(() => {
    const todayStr = formatDate(today);
    return events.filter((e) => isEventOnDate(e, todayStr));
  }, [events, today, isEventOnDate]);

  // Upcoming events sorted chronologically (excluding past events)
  const upcomingEvents = useMemo(() => {
    const todayStr = formatDate(today);
    return events
      .filter((e) => {
        const checkDate = e.end || e.date;
        return checkDate >= todayStr;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [events, today]);

  // Statistics Computations
  const stats = useMemo(() => {
    return {
      total: events.length,
      libur: events.filter((e) => e.category === "Libur Nasional").length,
      akademik: events.filter((e) => e.category === "Akademik").length,
      ujian: events.filter((e) => e.category === "Ujian").length,
      ekskul: events.filter((e) => e.category === "Ekstrakurikuler").length,
    };
  }, [events]);

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="min-h-screen bg-gray-50/50 text-gray-900 font-sans antialiased selection:bg-blue-100 selection:text-[#2c1ee8]">
      <Navbar />

      <main className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Modern Premium Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1c1294] via-[#2c1ee8] to-[#5a6fff] text-white py-12 px-6 sm:px-10 lg:px-12 rounded-3xl mb-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_45%)]" />
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/10 mb-4 uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" /> Portal Kalender Akademik
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
              Kalender Kegiatan Sekolah {year}
            </h1>
            <p className="text-base sm:text-lg text-blue-50/90 leading-relaxed font-normal">
              Akses informasi seluruh agenda akademik, jadwal ujian, rapat OSIS, kegiatan ekstrakurikuler, dan hari libur nasional dalam satu sistem yang responsif dan interaktif.
            </p>
          </div>
        </section>

        {/* Dynamic Interactive Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Kegiatan", count: stats.total, color: "border-l-blue-600 text-blue-600", desc: "Semua agenda" },
            { label: "Libur Nasional", count: stats.libur, color: "border-l-red-500 text-red-500", desc: "Hari non-efektif" },
            { label: "Agenda Akademik", count: stats.akademik, color: "border-l-emerald-500 text-emerald-500", desc: "Belajar & mengajar" },
            { label: "Jadwal Ujian", count: stats.ujian, color: "border-l-amber-500 text-amber-500", desc: "Evaluasi & tes" },
            { label: "Ekstrakurikuler", count: stats.ekskul, color: "border-l-purple-500 text-purple-500", desc: "Kegiatan siswa" }
          ].map((item, idx) => (
            <Card key={idx} className="border-l-4 border-t-0 border-r-0 border-b-0 border-l-gray-350 hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</h4>
                  <p className="text-3xl font-black mt-1 leading-tight tracking-tight text-gray-800">{item.count}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-2 font-medium">{item.desc}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {isUnauthorized ? (
          <LoginRequiredFallback featureName="Kalender Akademik" />
        ) : (
          /* Main 2-Column Responsive Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Filters, Search, and Main Calendar Grid (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header controls, Search and Filters Container */}
            <Card className="bg-white p-5 shadow-xs border border-gray-100 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Search Input Bar */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari kegiatan atau agenda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2 border border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] focus:border-transparent transition-all text-sm shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter chips Label / Trigger */}
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider shrink-0">
                  <Info className="w-4 h-4 text-gray-300" />
                  <span>Kategori Filter</span>
                </div>
              </div>

              {/* Horizontal Scrollable Category Filter Chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {["All", "Libur Nasional", "Akademik", "Ujian", "OSIS", "Ekstrakurikuler"].map((cat) => {
                  const isActive = filter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-[#2c1ee8] text-white border-[#2c1ee8] shadow-md shadow-blue-500/10 scale-102"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Display Search Results Panel when searching */}
            {searchQuery && (
              <Card className="p-6 bg-blue-50/20 border border-blue-100 shadow-sm rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                    <Search className="h-4.5 w-4.5 text-[#2c1ee8]" />
                    Hasil Pencarian untuk &quot;{searchQuery}&quot;
                  </h3>
                  <span className="text-xs bg-blue-100/75 text-[#2c1ee8] font-bold px-3 py-1 rounded-full border border-blue-200/50">
                    {searchResults.length} Cocok
                  </span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((e, idx) => (
                      <div
                        key={idx}
                        onClick={() => openDetail(e.date)}
                        className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-gray-900 group-hover:text-[#2c1ee8] transition-colors line-clamp-1">{e.title}</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${categoryBadgeStyles[e.category] || ""}`}>
                            {e.category}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatEventDateRange(e.date, e.end)}</span>
                          </div>
                          {e.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{e.location}</span>
                            </div>
                          )}
                        </div>
                        {e.description && (
                          <p className="mt-2 text-xs text-gray-500 line-clamp-2 italic bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                            {e.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8 bg-white border border-dashed border-gray-200 rounded-xl">
                    Tidak ada kegiatan yang sesuai dengan pencarian Anda.
                  </p>
                )}
              </Card>
            )}

            {/* MAIN CALENDAR GRID CARD */}
            <Card className="bg-white p-6 shadow-sm border border-gray-100 rounded-3xl">
              
              {/* Main Calendar Month Header Controls */}
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">Gunakan navigasi untuk mengubah bulan</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={resetToToday} className="px-3 py-1.5 h-8.5 rounded-xl text-xs font-semibold cursor-pointer">
                    Hari Ini
                  </Button>
                  <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200/50">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                      aria-label="Bulan sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
                      aria-label="Bulan berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                <div className="text-red-500">Min</div>
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div className="text-blue-600">Sab</div>
              </div>

              {/* Days Monthly Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty cells prepending first day of month */}
                {Array.from({ length: startDay }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="p-2 aspect-square rounded-xl bg-gray-50/20 border border-dashed border-gray-100"
                  />
                ))}

                {/* Actual day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), idx + 1);
                  const dateStr = formatDate(dateObj);
                  const isToday = dateStr === formatDate(today);
                  
                  // Day events
                  const dayEvents = eventsForDate(dateStr);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => openDetail(dateStr)}
                      className={`group p-2 min-h-[85px] sm:min-h-[105px] rounded-2xl flex flex-col justify-between transition-all duration-300 border text-left relative overflow-hidden cursor-pointer ${
                        isToday
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                          : "bg-white text-slate-800 border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      {/* Day Number Label */}
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs sm:text-sm font-extrabold ${isToday ? "text-white scale-105" : "text-slate-800"}`}>
                          {idx + 1}
                        </span>
                        {hasEvents && (
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${isToday ? "bg-white text-blue-700" : "bg-[#2c1ee8] text-white"}`}>
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Display Dots/Pills based on Event status */}
                      {hasEvents && (
                        <div className="w-full mt-1 space-y-1">
                          {/* Mobile visual indicators: dots */}
                          <div className="flex flex-wrap gap-1 sm:hidden">
                            {dayEvents.map((e, i) => (
                              <span
                                key={i}
                                className={`inline-block w-2 h-2 rounded-full ${
                                  isToday ? "bg-white" : getCategoryColor(e.category)
                                }`}
                              />
                            ))}
                          </div>

                          {/* Desktop premium indicators: event capsules */}
                          <div className="hidden sm:block space-y-1">
                            {dayEvents.slice(0, 2).map((e, i) => (
                              <div
                                key={i}
                                className={`text-[10px] leading-snug px-1.5 py-0.5 rounded-md truncate border font-bold ${
                                  isToday
                                    ? "bg-white/20 text-white border-white/20"
                                    : getCategoryBadgeStyle(e.category)
                                }`}
                              >
                                {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className={`text-[9px] font-bold pl-0.5 ${isToday ? "text-blue-100" : "text-slate-500"}`}>
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

              {/* Main Calendar Legend */}
              <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap gap-4 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-600 rounded-full inline-block shadow-sm" />
                  <span>Hari Ini</span>
                </div>
                {Object.keys(categoryColors).map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full inline-block ${categoryColors[cat]}`} />
                    <span>{cat}</span>
                  </div>
                ))}
              </div>

              {/* Add event button if role permissions allow */}
              {isAllowedToAddEvent && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5 rounded-xl cursor-pointer"
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Tambah Agenda
                  </Button>
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT COLUMN: Sidebar (Monthly Highlight, Today's Events, Upcoming Events) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* MONTHLY HIGHLIGHT & INFORMATION CARD */}
            <Card className="bg-gradient-to-br from-slate-900 via-blue-950 to-[#2c1ee8] p-5.5 shadow-md border border-slate-800 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                  Tahun Akademik {year}/{year + 1}
                </span>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Aktif
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug relative z-10">
                Portal Kalender SMKN 2 Surakarta
              </h3>
              
              <p className="text-xs text-slate-300 leading-relaxed font-normal mt-1.5 mb-4 relative z-10">
                Klik pada tanggal di kalender utama untuk melihat rincian agenda lengkap atau mengajukan kegiatan sekolah.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-3.5 border-t border-white/15 text-center relative z-10">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Bulan Ini</span>
                  <span className="text-xl font-black text-white mt-0.5 block">{currentMonthEventsCount} Agenda</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                  <span className="block text-[10px] text-blue-200 font-bold uppercase tracking-wider">Hari Ini</span>
                  <span className="text-xl font-black text-white mt-0.5 block">{todayEvents.length} Agenda</span>
                </div>
              </div>
            </Card>

            {/* EVENT HARI INI CARD */}
            <Card className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-50/50 text-[#2c1ee8] px-3 py-1.5 rounded-bl-xl border-l border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider">
                Hari Ini
              </div>
              
              <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase flex items-center gap-2 mb-4">
                <Clock className="w-4.5 h-4.5 text-[#2c1ee8]" /> Agenda Hari Ini
              </h3>

              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((e, idx) => (
                    <div
                      key={idx}
                      onClick={() => openDetail(e.date)}
                      className="group p-3 border border-gray-100 rounded-xl bg-gray-50/30 hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-200 cursor-pointer"
                    >
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border inline-block mb-1.5 ${categoryBadgeStyles[e.category] || ""}`}>
                        {e.category}
                      </span>
                      <h4 className="font-bold text-gray-900 group-hover:text-[#2c1ee8] transition-all text-xs line-clamp-1 leading-snug">
                        {e.title}
                      </h4>
                      {e.location && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{e.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl bg-gray-50/10">
                  <CalendarDays className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Tidak ada agenda untuk hari ini.</p>
                </div>
              )}
            </Card>

            {/* UPCOMING EVENTS LIST CARD */}
            <Card className="bg-white p-5 shadow-sm border border-gray-100 rounded-2xl">
              <h3 className="text-sm font-black text-gray-800 tracking-tight uppercase flex items-center gap-2 mb-4">
                <ListTodo className="w-4.5 h-4.5 text-blue-600" /> Kegiatan Mendatang
              </h3>

              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((e, idx) => {
                    const eventDate = new Date(e.date);
                    const isMulti = !!e.end && e.date !== e.end;
                    return (
                      <div
                        key={idx}
                        onClick={() => openDetail(e.date)}
                        className="group flex gap-3.5 items-start cursor-pointer pb-3.5 border-b border-gray-50 last:border-0 last:pb-0"
                      >
                        {/* Compact Date Badge */}
                        <div className="flex flex-col items-center justify-center w-11 h-11 shrink-0 rounded-xl bg-gray-50 border border-gray-100 text-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase leading-none">
                            {eventDate.toLocaleString("id-ID", { month: "short" })}
                          </span>
                          <span className="text-base font-extrabold text-gray-800 leading-none mt-1">
                            {eventDate.getDate()}
                          </span>
                        </div>

                        {/* Title and location info */}
                        <div className="min-w-0 flex-1">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border inline-block mb-1 ${categoryBadgeStyles[e.category] || ""}`}>
                            {e.category}
                          </span>
                          <h4 className="font-bold text-gray-800 group-hover:text-[#2c1ee8] transition-colors text-xs line-clamp-1 leading-snug">
                            {e.title}
                          </h4>
                          <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-gray-400">
                            {isMulti && (
                              <div className="flex items-center gap-1 font-semibold text-[#2c1ee8]/80">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Multi-hari</span>
                              </div>
                            )}
                            {e.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{e.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">Belum ada kegiatan terjadwal berikutnya.</p>
              )}
            </Card>

          </div>
        </div>

        )}

        {/* MODAL: EVENT DETAILS OVERLAY WIDGET */}
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}>
          {selectedDate && (
            <div>
              <div className="pb-3 border-b border-gray-100 mb-4">
                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Detail Kegiatan
                </span>
                <h3 className="text-lg font-black text-gray-800 tracking-tight mt-2">
                  {new Date(selectedDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </h3>
              </div>

              {eventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {eventsForDate(selectedDate).map((e, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-extrabold text-gray-900 text-sm leading-snug">{e.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${categoryBadgeStyles[e.category] || ""}`}>
                            {e.category}
                          </span>
                          {isAllowedToAddEvent && e.id && (
                            <button
                              onClick={() => handleDeleteEvent(e.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus Kegiatan"
                              aria-label="Hapus kegiatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{formatEventDateRange(e.date, e.end)}</span>
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{e.location}</span>
                          </div>
                        )}
                      </div>

                      {e.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <p className="text-xs text-gray-600 leading-relaxed italic">{e.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                  <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Tidak ada agenda kegiatan di tanggal ini.</p>
                  
                  {isAllowedToAddEvent && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setNewEvent((prev) => ({ ...prev, start: selectedDate }));
                        setShowAddModal(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#2c1ee8] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Buat kegiatan baru
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowDetailModal(false)} className="rounded-xl cursor-pointer">
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: ADD EVENT FORM OVERLAY */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
          <form onSubmit={submitNewEvent} className="space-y-4">
            <div className="pb-2 border-b border-gray-100 mb-3">
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Tambah Kegiatan Baru</h3>
              <p className="text-xs text-gray-400">Silakan lengkapi formulir di bawah ini.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Judul Kegiatan</label>
              <input
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleAddChange}
                placeholder="Contoh: Rapat Koordinasi Kurikulum"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  name="start"
                  value={newEvent.start}
                  onChange={handleAddChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  name="end"
                  value={newEvent.end}
                  onChange={handleAddChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kategori Agenda</label>
              <select
                name="category"
                value={newEvent.category}
                onChange={handleAddChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="Libur Nasional">Libur Nasional</option>
                <option value="Akademik">Akademik</option>
                <option value="Ujian">Ujian</option>
                <option value="OSIS">OSIS</option>
                <option value="Ekstrakurikuler">Ekstrakurikuler</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lokasi</label>
              <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleAddChange}
                placeholder="Contoh: Aula SMKN 2 Surakarta"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Ringkas</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleAddChange}
                placeholder="Tuliskan keterangan detail kegiatan di sini..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c1ee8] transition-all bg-gray-50/50 hover:bg-gray-50 focus:bg-white"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting} className="rounded-xl cursor-pointer">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl cursor-pointer flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Agenda"
                )}
              </Button>
            </div>
          </form>
        </Modal>

      </main>
    </div>
  );
}