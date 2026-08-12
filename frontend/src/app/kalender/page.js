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

// Simple Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative z-10 border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
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
    if (!category) return "bg-gray-100 text-gray-700 border-gray-200";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-red-50 text-red-700 border-red-200";
    if (cat.includes("ujian") || cat.includes("pts") || cat.includes("pas") || cat.includes("pat")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (cat.includes("osis") || cat.includes("mpk")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (cat.includes("ekstra") || cat.includes("eskul")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-green-50 text-green-700 border-green-200";
  };

  const getCategoryColor = (category) => {
    if (!category) return "bg-gray-400";
    const cat = category.trim().toLowerCase();
    if (cat.includes("libur")) return "bg-red-500";
    if (cat.includes("ujian") || cat.includes("pts")) return "bg-amber-500";
    if (cat.includes("osis")) return "bg-blue-500";
    if (cat.includes("ekstra")) return "bg-purple-500";
    return "bg-green-500";
  };

  const categoryColors = {
    "Libur Nasional": "bg-red-500",
    Akademik: "bg-green-500",
    Ujian: "bg-amber-500",
    OSIS: "bg-blue-500",
    Ekstrakurikuler: "bg-purple-500",
  };

  const categoryBadgeStyles = {
    "Libur Nasional": "bg-red-50 text-red-700 border-red-200",
    Akademik: "bg-green-50 text-green-700 border-green-200",
    Ujian: "bg-amber-50 text-amber-700 border-amber-200",
    OSIS: "bg-blue-50 text-blue-700 border-blue-200",
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

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased">
      <Navbar />

      <main className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <section className="mb-8 pb-6 border-b border-gray-200">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
            <CalendarIcon className="w-3.5 h-3.5" /> Kalender Akademik
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Kalender Kegiatan Sekolah {year}
          </h1>
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            Agenda akademik, jadwal ujian, rapat OSIS, kegiatan ekstrakurikuler, dan hari libur nasional.
          </p>
        </section>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total Kegiatan", count: stats.total, color: "border-l-gray-400" },
            { label: "Libur Nasional", count: stats.libur, color: "border-l-red-400" },
            { label: "Agenda Akademik", count: stats.akademik, color: "border-l-green-400" },
            { label: "Jadwal Ujian", count: stats.ujian, color: "border-l-amber-400" },
            { label: "Ekstrakurikuler", count: stats.ekskul, color: "border-l-purple-400" }
          ].map((item, idx) => (
            <Card key={idx} className={`border-l-2 border-t border-r border-b border-gray-200 rounded-md ${item.color} bg-white`}>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-gray-500">{item.label}</p>
                <p className="text-2xl font-semibold mt-1 text-gray-900">{item.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isUnauthorized ? (
          <LoginRequiredFallback featureName="Kalender Akademik" />
        ) : (
          /* Main 2-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6">

            {/* Search and Filters */}
            <Card className="bg-white p-4 border border-gray-200 rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari kegiatan atau agenda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {["All", "Libur Nasional", "Akademik", "Ujian", ...(canViewOsisCategory ? ["OSIS"] : []), "Ekstrakurikuler"].map((cat) => {
                  const isActive = filter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Search Results Panel */}
            {searchQuery && (
              <Card className="p-4 bg-white border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    Hasil pencarian untuk &quot;{searchQuery}&quot;
                  </h3>
                  <span className="text-xs text-gray-500">
                    {searchResults.length} hasil
                  </span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((e, idx) => (
                      <div
                        key={idx}
                        onClick={() => openDetail(e.date)}
                        className="p-3 rounded-md border border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{e.title}</h4>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${categoryBadgeStyles[e.category] || ""}`}>
                            {e.category}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-gray-500">
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
                          <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                            {e.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-200 rounded-md">
                    Tidak ada kegiatan yang sesuai dengan pencarian Anda.
                  </p>
                )}
              </Card>
            )}

            {/* MAIN CALENDAR GRID */}
            <Card className="bg-white p-5 border border-gray-200 rounded-md">

              {/* Month Header Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={resetToToday} className="px-3 py-1.5 h-8 rounded-md text-xs font-medium cursor-pointer">
                    Hari Ini
                  </Button>
                  <div className="flex border border-gray-300 rounded-md">
                    <button
                      onClick={prevMonth}
                      className="p-1.5 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                      aria-label="Bulan sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-gray-300" />
                    <button
                      onClick={nextMonth}
                      className="p-1.5 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                      aria-label="Bulan berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
                <div className="text-red-600">Min</div>
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div className="text-blue-600">Sab</div>
              </div>

              {/* Days Monthly Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="p-2 aspect-square rounded-md bg-gray-50"
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
                      className={`group p-2 min-h-[85px] sm:min-h-[100px] rounded-md flex flex-col justify-between transition-colors border text-left cursor-pointer ${
                        isToday
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-800 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs sm:text-sm font-semibold ${isToday ? "text-white" : "text-gray-800"}`}>
                          {idx + 1}
                        </span>
                        {hasEvents && (
                          <span className={`text-[10px] font-semibold px-1.5 rounded ${isToday ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"}`}>
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {hasEvents && (
                        <div className="w-full mt-1 space-y-1">
                          {/* Mobile: dots */}
                          <div className="flex flex-wrap gap-1 sm:hidden">
                            {dayEvents.map((e, i) => (
                              <span
                                key={i}
                                className={`inline-block w-1.5 h-1.5 rounded-full ${
                                  isToday ? "bg-white" : getCategoryColor(e.category)
                                }`}
                              />
                            ))}
                          </div>

                          {/* Desktop: event labels */}
                          <div className="hidden sm:block space-y-1">
                            {dayEvents.slice(0, 2).map((e, i) => (
                              <div
                                key={i}
                                className={`text-[10px] leading-snug px-1.5 py-0.5 rounded truncate border ${
                                  isToday
                                    ? "bg-white/15 text-white border-white/20"
                                    : getCategoryBadgeStyle(e.category)
                                }`}
                              >
                                {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className={`text-[10px] pl-0.5 ${isToday ? "text-blue-100" : "text-gray-500"}`}>
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

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block" />
                  <span>Hari Ini</span>
                </div>
                {Object.keys(categoryColors)
                  .filter((cat) => cat !== "OSIS" || canViewOsisCategory)
                  .map((cat) => (
                    <div key={cat} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full inline-block ${categoryColors[cat]}`} />
                      <span>{cat}</span>
                    </div>
                  ))}
              </div>

              {/* Add event button */}
              {isAllowedToAddEvent && (
                <div className="mt-5 pt-4 border-t border-gray-200 flex justify-end">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5 rounded-md cursor-pointer"
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Tambah Agenda
                  </Button>
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* Monthly Highlight Card */}
            <Card className="bg-white p-5 border border-gray-200 rounded-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Tahun Akademik {year}/{year + 1}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-gray-900">
                Portal Kalender SMKN 2 Surakarta
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed mt-1.5 mb-4">
                Klik pada tanggal di kalender untuk melihat rincian agenda lengkap atau mengajukan kegiatan sekolah.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 text-center">
                <div>
                  <span className="block text-[11px] text-gray-500">Bulan Ini</span>
                  <span className="text-lg font-semibold text-gray-900 block">{currentMonthEventsCount} Agenda</span>
                </div>
                <div>
                  <span className="block text-[11px] text-gray-500">Hari Ini</span>
                  <span className="text-lg font-semibold text-gray-900 block">{todayEvents.length} Agenda</span>
                </div>
              </div>
            </Card>

            {/* Agenda Hari Ini */}
            <Card className="bg-white p-5 border border-gray-200 rounded-md">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" /> Agenda Hari Ini
              </h3>

              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((e, idx) => (
                    <div
                      key={idx}
                      onClick={() => openDetail(e.date)}
                      className="p-3 border border-gray-200 rounded-md hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border inline-block mb-1.5 ${categoryBadgeStyles[e.category] || ""}`}>
                        {e.category}
                      </span>
                      <h4 className="font-medium text-gray-900 text-xs line-clamp-1">
                        {e.title}
                      </h4>
                      {e.location && (
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{e.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-md">
                  <CalendarDays className="w-6 h-6 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500">Tidak ada agenda untuk hari ini.</p>
                </div>
              )}
            </Card>

            {/* Kegiatan Mendatang */}
            <Card className="bg-white p-5 border border-gray-200 rounded-md">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <ListTodo className="w-4 h-4 text-gray-400" /> Kegiatan Mendatang
              </h3>

              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((e, idx) => {
                    const eventDate = new Date(e.date);
                    const isMulti = !!e.end && e.date !== e.end;
                    return (
                      <div
                        key={idx}
                        onClick={() => openDetail(e.date)}
                        className="flex gap-3 items-start cursor-pointer pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="flex flex-col items-center justify-center w-10 h-10 shrink-0 rounded-md bg-gray-50 border border-gray-200 text-center">
                          <span className="text-[10px] font-medium text-gray-500 uppercase leading-none">
                            {eventDate.toLocaleString("id-ID", { month: "short" })}
                          </span>
                          <span className="text-sm font-semibold text-gray-800 leading-none mt-1">
                            {eventDate.getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border inline-block mb-1 ${categoryBadgeStyles[e.category] || ""}`}>
                            {e.category}
                          </span>
                          <h4 className="font-medium text-gray-800 text-xs line-clamp-1">
                            {e.title}
                          </h4>
                          <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-gray-500">
                            {isMulti && (
                              <div className="flex items-center gap-1">
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
                <p className="text-xs text-gray-500 text-center py-6">Belum ada kegiatan terjadwal berikutnya.</p>
              )}
            </Card>

          </div>
        </div>

        )}

        {/* MODAL: EVENT DETAIL */}
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)}>
          {selectedDate && (
            <div>
              <div className="pb-3 border-b border-gray-200 mb-4">
                <span className="text-xs font-medium text-blue-700">
                  Detail Kegiatan
                </span>
                <h3 className="text-base font-semibold text-gray-900 mt-1">
                  {new Date(selectedDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </h3>
              </div>

              {eventsForDate(selectedDate).length > 0 ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {eventsForDate(selectedDate).map((e, idx) => (
                    <div key={idx} className="p-3 rounded-md border border-gray-200">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{e.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${categoryBadgeStyles[e.category] || ""}`}>
                            {e.category}
                          </span>
                          {isAllowedToAddEvent && e.id && (
                            <button
                              onClick={() => handleDeleteEvent(e.id)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus Kegiatan"
                              aria-label="Hapus kegiatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{formatEventDateRange(e.date, e.end)}</span>
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{e.location}</span>
                          </div>
                        )}
                      </div>

                      {e.description && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-600 leading-relaxed">{e.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-gray-200 rounded-md">
                  <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Tidak ada agenda kegiatan di tanggal ini.</p>

                  {isAllowedToAddEvent && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setNewEvent((prev) => ({ ...prev, start: selectedDate }));
                        setShowAddModal(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Buat kegiatan baru
                    </button>
                  )}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => setShowDetailModal(false)} className="rounded-md cursor-pointer">
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: ADD EVENT FORM */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
          <form onSubmit={submitNewEvent} className="space-y-4">
            <div className="pb-2 border-b border-gray-200 mb-3">
              <h3 className="text-base font-semibold text-gray-900">Tambah Kegiatan Baru</h3>
              <p className="text-xs text-gray-500">Silakan lengkapi formulir di bawah ini.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Judul Kegiatan</label>
              <input
                type="text"
                name="title"
                value={newEvent.title}
                onChange={handleAddChange}
                placeholder="Contoh: Rapat Koordinasi Kurikulum"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  name="start"
                  value={newEvent.start}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  name="end"
                  value={newEvent.end}
                  onChange={handleAddChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategori Agenda</label>
              <select
                name="category"
                value={newEvent.category}
                onChange={handleAddChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                <option value="Libur Nasional">Libur Nasional</option>
                <option value="Akademik">Akademik</option>
                <option value="Ujian">Ujian</option>
                {canViewOsisCategory && <option value="OSIS">OSIS</option>}
                <option value="Ekstrakurikuler">Ekstrakurikuler</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi</label>
              <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleAddChange}
                placeholder="Contoh: Aula SMKN 2 Surakarta"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi Ringkas</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleAddChange}
                placeholder="Tuliskan keterangan detail kegiatan di sini..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting} className="rounded-md cursor-pointer">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-md cursor-pointer flex items-center gap-2">
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