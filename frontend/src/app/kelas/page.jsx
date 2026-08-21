"use client";

import React, { useState, useEffect, useCallback } from "react";
import classTreeService from "@/services/classTreeService";
import schoolClassService from "@/services/schoolClassService";
import userService from "@/services/userService";
import { scheduleService } from "@/services/scheduleService";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssignPositionModal from "@/components/kelas/AssignPositionModal";
import AddDivisionModal from "@/components/kelas/AddDivisionModal";
import { WEEKLY_AGENDA_DATA } from "@/data/weeklyAgendaData";
import { resolveImageUrl } from "@/lib/utils";
import {
  SCHEDULE_MODES,
  TIME_SLOTS_NORMAL,
  TIME_SLOTS_UPACARA,
  TIME_SLOTS_JUMAT,
} from "@/constants/timeSlotModes";
import {
  Crown,
  Users,
  ShieldCheck,
  PlusCircle,
  Calendar,
  Layers,
  Trash2,
  Edit3,
  Clock,
  Coffee,
  Bookmark,
  Check,
  X,
  BookOpen,
  UserCheck,
  Sun,
  Building2,
  Sparkles,
  Flag,
  User,
  MapPin
} from "lucide-react";

export default function KelasPage() {
  const { role, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [activeTab, setActiveTab] = useState("struktur"); // "struktur" | "anggota" | "jadwal" | "mingguan"

  // Schedule Modes state: "normal" | "upacara"
  const [scheduleMode, setScheduleMode] = useState(SCHEDULE_MODES.NORMAL);
  const [agendaSemesterFilter, setAgendaSemesterFilter] = useState("Ganjil");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Data states
  const [tree, setTree] = useState([]);
  const [activeLeadership, setActiveLeadership] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Clock state for live schedule highlighting
  const [currentTime, setCurrentTime] = useState(new Date());

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  // Default day filter is TODAY (fallback to "Senin" on weekends)
  const getInitialDayFilter = () => {
    const today = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()];
    return daysOfWeek.includes(today) ? today : "Senin";
  };

  // Day Filter State ("Semua" | "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat")
  const [scheduleDayFilter, setScheduleDayFilter] = useState(() => getInitialDayFilter());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // refresh every 10s
    return () => clearInterval(timer);
  }, []);

  const getIndoDayName = (dateObj = currentTime) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[dateObj.getDay()];
  };



  const isSlotActiveNow = (dayName, timeRangeStr) => {
    if (!dayName || !timeRangeStr) return false;
    const currentDay = getIndoDayName(currentTime);
    if (currentDay.toLowerCase() !== dayName.toLowerCase()) return false;

    const parts = timeRangeStr.split("-");
    if (parts.length !== 2) return false;

    const parseMin = (tStr) => {
      const clean = tStr.trim().replace(":", ".");
      const [h, m] = clean.split(".").map((n) => parseInt(n, 10));
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };

    const startMin = parseMin(parts[0]);
    const endMin = parseMin(parts[1]);
    if (startMin === null || endMin === null) return false;

    const currentMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currentMin >= startMin && currentMin < endMin;
  };

  const formatTimeRange = (tStr) => {
    if (!tStr) return "";
    return tStr.replace(/\./g, ":");
  };

  // Helper to check if a weekly agenda row is active today
  const isWeeklyAgendaActiveNow = (row, dateObj = currentTime) => {
    if (!row || !row.date || !row.month) return false;

    const monthNamesIndo = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentMonthName = monthNamesIndo[dateObj.getMonth()].toLowerCase();
    const currentDateNum = dateObj.getDate();

    // Check month match (e.g., "Agustus" or "Agustus/September")
    const rowMonths = row.month.split("/").map((m) => m.trim().toLowerCase());
    const matchMonth = rowMonths.includes(currentMonthName);
    if (!matchMonth) return false;

    // Parse date range "17-21"
    const dateParts = row.date.split("-").map((d) => parseInt(d.trim(), 10));
    if (dateParts.length !== 2 || isNaN(dateParts[0]) || isNaN(dateParts[1])) return false;

    const [startDate, endDate] = dateParts;

    if (startDate <= endDate) {
      return currentDateNum >= startDate && currentDateNum <= endDate;
    } else {
      return currentDateNum >= startDate || currentDateNum <= endDate;
    }
  };

  // Custom agenda notes state for Admin & Teacher
  const [customNotes, setCustomNotes] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState({ name: "", type: "StudentPosition", divisionId: null });
  const [addDivModalOpen, setAddDivModalOpen] = useState(false);

  const userRole = (role || user?.role || "").toLowerCase();
  const isAdmin = userRole === "admin";
  const isTeacher = userRole === "teacher" || userRole === "guru";
  const canManage = isAdmin || isTeacher;

  const selectedClass = classes.find((c) => String(c.id || c.Id) === String(selectedClassId));
  const selectedClassName = selectedClass?.name || selectedClass?.Name || "";

  // Check if class is XI or XII (eligible for Jadwal Mingguan Agenda)
  const isUpperGradeClass =
    selectedClassName.startsWith("XI ") ||
    selectedClassName.startsWith("XI-") ||
    selectedClassName.startsWith("XII ") ||
    selectedClassName.startsWith("XII-");

  // Load custom notes from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pplg_custom_agenda_notes");
      if (saved) {
        setCustomNotes(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed to load custom agenda notes:", err);
    }
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await schoolClassService.getClasses();
      const items = res?.items || res?.data?.items || res || [];
      setClasses(items);

      if (items.length > 0 && !selectedClassId) {
        const userClassId = user?.classId || user?.studentProfile?.classId || user?.ClassId;
        const matchingUserClass = items.find((c) => String(c.id || c.Id) === String(userClassId));
        if (matchingUserClass) {
          setSelectedClassId(matchingUserClass.id || matchingUserClass.Id);
        } else {
          setSelectedClassId(items[0].id || items[0].Id);
        }
      }
    } catch (err) {
      console.error("Failed to load school classes:", err);
    }
  };

  const loadClassDetails = useCallback(async (classId) => {
    if (!classId) return;
    try {
      setLoading(true);
      const [treeRes, leadRes, studentsRes, schedRes] = await Promise.allSettled([
        classTreeService.getDivisionTree(classId),
        classTreeService.getActiveLeadership(classId),
        userService.getUsers({ classId, role: "Student", pageSize: 100 }),
        scheduleService.getAll({ classId }),
      ]);

      if (treeRes.status === "fulfilled") {
        const rawTree = treeRes.value?.data ?? treeRes.value ?? [];
        setTree(Array.isArray(rawTree) ? rawTree : []);
      }
      if (leadRes.status === "fulfilled") {
        setActiveLeadership(leadRes.value?.data ?? leadRes.value ?? null);
      }
      if (studentsRes.status === "fulfilled") {
        const rawStudents = studentsRes.value?.data ?? studentsRes.value ?? [];
        let list = Array.isArray(rawStudents) ? rawStudents : Array.isArray(rawStudents?.items) ? rawStudents.items : [];
        list = list
          .filter((s) => String(s.classId || s.ClassId || "") === String(classId))
          .sort((a, b) => String(a.nis || a.NIS || a.fullName).localeCompare(String(b.nis || b.NIS || b.fullName)));
        setClassStudents(list);
      }
      if (schedRes.status === "fulfilled") {
        const rawSched = schedRes.value?.data ?? schedRes.value ?? [];
        const items = Array.isArray(rawSched) ? rawSched : Array.isArray(rawSched?.items) ? rawSched.items : [];
        setSchedules(items);
      }
    } catch (err) {
      console.error("Error loading class details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetails(selectedClassId);
    }
  }, [selectedClassId, loadClassDetails]);

  const handleOpenAssign = (name, type, divId = null) => {
    if (!canManage) return;
    setAssignTarget({ name, type, divisionId: divId });
    setAssignModalOpen(true);
  };

  const handleDeleteDivision = async (divId) => {
    if (!canManage) return;
    if (!confirm("Apakah Anda yakin ingin menghapus divisi/seksi khusus ini?")) return;
    try {
      await classTreeService.deleteDivision(divId);
      loadClassDetails(selectedClassId);
    } catch (err) {
      console.error("Failed to delete division:", err);
      alert("Gagal menghapus divisi.");
    }
  };

  // Mandatory divisions extraction
  const findLeaderByName = (nameStr) => {
    if (!tree || tree.length === 0) return null;
    const target = tree.find((n) => n.name?.toLowerCase().includes(nameStr.toLowerCase()));
    if (!target) return null;
    return {
      divisionId: target.id,
      name: target.leaderStudentName || "Belum Ditentukan",
    };
  };

  const ketuaLeader = findLeaderByName("ketua kelas");
  const wakilLeader = findLeaderByName("wakil ketua");
  const sekretaris1 = findLeaderByName("sekretaris 1");
  const sekretaris2 = findLeaderByName("sekretaris 2");
  const bendahara1 = findLeaderByName("bendahara 1");
  const bendahara2 = findLeaderByName("bendahara 2");

  const mandatoryNames = ["ketua kelas", "wakil ketua", "sekretaris 1", "sekretaris 2", "bendahara 1", "bendahara 2"];
  const customDivisions = tree.filter((n) => !mandatoryNames.includes(n.name?.toLowerCase()));

  // Helper to map C# DayOfWeek or String to Day Name
  const getScheduleDayName = (s) => {
    const raw = s?.dayOfWeek ?? s?.DayOfWeek ?? s?.day;
    if (typeof raw === "number") {
      const dayMap = { 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu", 7: "Minggu" };
      return dayMap[raw] || "";
    }
    const val = String(raw || "").trim().toLowerCase();
    if (val.includes("senin") || val.includes("mon")) return "Senin";
    if (val.includes("selasa") || val.includes("tue")) return "Selasa";
    if (val.includes("rabu") || val.includes("wed")) return "Rabu";
    if (val.includes("kamis") || val.includes("thu")) return "Kamis";
    if (val.includes("jumat") || val.includes("fri")) return "Jumat";
    return "";
  };

  const getSchedulesForDay = (dayName) => {
    if (!Array.isArray(schedules)) return [];
    return schedules
      .filter((s) => getScheduleDayName(s).toLowerCase() === dayName.toLowerCase())
      .sort((a, b) => (a.startTime || a.StartTime || "").localeCompare(b.startTime || b.StartTime || ""));
  };

  // Robust Schedule Item Lookup for Jam ke-1..12
  const findSchedItemForSlot = (dayScheds, slotPeriod) => {
    if (!dayScheds || dayScheds.length === 0) return null;
    const byPeriod = dayScheds.find((s) => (s.periodNumber || s.PeriodNumber) === slotPeriod);
    if (byPeriod) return byPeriod;
    if (slotPeriod <= dayScheds.length) {
      return dayScheds[slotPeriod - 1];
    }
    return null;
  };

  // Weekly Agenda rows for selected XI/XII class
  const weeklyAgendaList = WEEKLY_AGENDA_DATA.filter(
    (a) => a.class === selectedClassName && a.semester === agendaSemesterFilter
  );

  // Edit Keterangan Handlers for Admin & Guru
  const handleStartEditNote = (noteKey, currentNote) => {
    if (!canManage) return;
    setEditingKey(noteKey);
    setEditingText(currentNote || "");
  };

  const handleSaveNote = (noteKey) => {
    const updated = { ...customNotes, [noteKey]: editingText };
    setCustomNotes(updated);
    setEditingKey(null);
    try {
      localStorage.setItem("pplg_custom_agenda_notes", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save note to localStorage:", err);
    }
  };

  // Filtered Students
  const filteredStudents = classStudents.filter((s) => {
    const name = s.fullName || s.FullName || s.name || "";
    const nis = s.nis || s.NIS || "";
    const query = studentSearchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || nis.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8">
        {/* Top Hero Section Header Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-[32px] border border-slate-200/80 p-6 sm:p-10 shadow-xs relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#2C1EE8] text-[11px] font-mono font-extrabold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>AKADEMIK & KESISWAAN PPLG</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Kelas & Jadwal Pelajaran
                </h1>
                {selectedClassName && (
                  <span className="text-xs font-black text-[#2C1EE8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {selectedClassName}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 max-w-2xl">
                Struktur organisasi kepengurusan kelas, direktori siswa aktif, dan jadwal kegiatan belajar mengajar (KBM) harian.
              </p>
            </div>

            {/* Class Selector (Admin/Teacher Only) or Student Class Badge */}
            {canManage ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl self-start md:self-auto shrink-0 shadow-2xs">
                <span className="text-xs font-bold text-slate-500 pl-2">Pilih Kelas:</span>
                <select
                  id="kelas-selector-dropdown"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="bg-white border border-slate-200 text-[#2C1EE8] font-extrabold rounded-xl px-3.5 py-2 text-xs shadow-2xs focus:border-[#2C1EE8] focus:ring-2 focus:ring-blue-100 outline-hidden cursor-pointer transition-all"
                >
                  {classes.map((c) => (
                    <option key={c.id || c.Id} value={c.id || c.Id}>
                      {c.name || c.Name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200 px-4 py-2.5 rounded-2xl self-start md:self-auto shrink-0 shadow-2xs">
                <span className="text-xs font-bold text-slate-600">Kelas Terdaftar:</span>
                <span className="text-xs font-black text-[#2C1EE8]">
                  {selectedClassName || "Kelas Siswa"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Simplified Real-Time Status & Mode Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/80 px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              <strong className="text-slate-900 font-bold">
                {getIndoDayName(currentTime)}, {currentTime.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </strong>
              <span className="text-slate-400 mx-1.5">·</span>
              <span className="font-mono text-slate-600">{currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              Mode {scheduleMode === SCHEDULE_MODES.NORMAL ? "Normal" : "Upacara"}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              {canManage ? "Admin / Guru" : "Siswa"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("struktur")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "struktur"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#2C1EE8]" />
            <span>Struktur Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("anggota")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "anggota"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#2C1EE8]" />
            <span>Daftar Siswa ({classStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("jadwal")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "jadwal"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#2C1EE8]" />
            <span>Jadwal Harian</span>
          </button>

          {isUpperGradeClass && (
            <button
              type="button"
              onClick={() => setActiveTab("mingguan")}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "mingguan"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
              <span>Agenda Rotasi ({selectedClassName})</span>
            </button>
          )}
        </div>

        {/* TAB 1: VISUAL TREE HIERARCHY */}
        {activeTab === "struktur" && (
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Struktur Organisasi Kelas {selectedClassName}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Bagan hierarki pengurus kelas dari Wali Kelas hingga Seksi Divisi.
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => setAddDivModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2C1EE8] hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] self-start sm:self-auto"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Tambah Divisi</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-slate-400 text-xs py-12 text-center">Memuat struktur hierarki...</div>
            ) : (
              <div className="flex flex-col items-center w-full py-2 space-y-4">
                {/* WALI KELAS */}
                <div className="flex flex-col items-center">
                  <div className="w-64 sm:w-72 bg-gradient-to-b from-indigo-50/90 via-white to-white border border-indigo-200 rounded-xl p-4 shadow-2xs text-center relative">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                      Wali Kelas
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1.5">
                      {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "Belum Ditentukan"}
                    </h3>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Wali Kelas", "WaliKelas")}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-[#2C1EE8] hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{selectedClass?.homeroomTeacherName ? "Ganti" : "+ Assign"}</span>
                      </button>
                    )}
                  </div>
                  <div className="w-0.5 h-6 bg-indigo-200" />
                </div>

                {/* KETUA KELAS */}
                <div className="flex flex-col items-center">
                  <div className="w-64 sm:w-72 bg-gradient-to-b from-amber-50/90 via-white to-white border border-amber-300/80 rounded-xl p-4 shadow-2xs text-center relative">
                    <div className="flex items-center justify-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                        Ketua Kelas
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-1.5">
                      {ketuaLeader ? ketuaLeader.name : "Belum Ditentukan"}
                    </h3>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Ketua Kelas", "StudentPosition")}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{ketuaLeader ? "Ganti" : "+ Assign"}</span>
                      </button>
                    )}
                  </div>
                  <div className="w-0.5 h-6 bg-amber-200" />
                </div>

                {/* WAKIL KETUA KELAS */}
                <div className="flex flex-col items-center">
                  <div className="w-64 sm:w-72 bg-gradient-to-b from-blue-50/90 via-white to-white border border-blue-200 rounded-xl p-4 shadow-2xs text-center relative">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                      Wakil Ketua Kelas
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1.5">
                      {wakilLeader ? wakilLeader.name : "Belum Ditentukan"}
                    </h3>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Wakil Ketua Kelas", "StudentPosition", wakilLeader?.divisionId)}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{wakilLeader ? "Ganti" : "+ Assign"}</span>
                      </button>
                    )}
                  </div>
                  <div className="w-0.5 h-6 bg-blue-200" />
                </div>

                {/* SEKRETARIS & BENDAHARA */}
                <div className="w-full max-w-3xl border-t border-slate-200 pt-4">
                  <h4 className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Sekretaris & Bendahara
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Sekretaris 1</span>
                      <p className="font-extrabold text-slate-900 text-xs truncate">{sekretaris1 ? sekretaris1.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Sekretaris 1", "StudentPosition", sekretaris1?.divisionId)}
                          className="mt-1 text-[10px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {sekretaris1 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Sekretaris 2</span>
                      <p className="font-extrabold text-slate-900 text-xs truncate">{sekretaris2 ? sekretaris2.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Sekretaris 2", "StudentPosition", sekretaris2?.divisionId)}
                          className="mt-1 text-[10px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {sekretaris2 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-teal-700 uppercase block mb-1">Bendahara 1</span>
                      <p className="font-extrabold text-slate-900 text-xs truncate">{bendahara1 ? bendahara1.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Bendahara 1", "StudentPosition", bendahara1?.divisionId)}
                          className="mt-1 text-[10px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {bendahara1 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-teal-700 uppercase block mb-1">Bendahara 2</span>
                      <p className="font-extrabold text-slate-900 text-xs truncate">{bendahara2 ? bendahara2.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Bendahara 2", "StudentPosition", bendahara2?.divisionId)}
                          className="mt-1 text-[10px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {bendahara2 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CUSTOM DIVISIONS */}
                {customDivisions.length > 0 && (
                  <div className="w-full max-w-3xl border-t border-slate-200 pt-4 space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Divisi / Seksi Khusus ({customDivisions.length})
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {customDivisions.map((div) => (
                        <div key={div.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs truncate">{div.name}</span>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDivision(div.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 text-[10px]">Ketua:</span>
                            <span className="font-bold text-[#2C1EE8]">{div.leaderStudentName || "-"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANGGOTA SISWA KELAS */}
        {activeTab === "anggota" && (
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2C1EE8]" />
                  <span>Daftar Siswa Kelas {selectedClassName}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {classStudents.length} siswa aktif terdaftar pada kelas {selectedClassName}.
                </p>
              </div>

              {/* Student Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari nama / NIS..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8]"
                />
                <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loading ? (
              <div className="text-slate-400 text-xs py-12 text-center">Memuat data siswa...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-slate-400 text-xs py-12 text-center border border-dashed border-slate-200 rounded-xl">
                Tidak ada data siswa ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStudents.map((s, idx) => {
                  const sId = s.id || s.Id;
                  const name = s.fullName || s.FullName || s.name || "Siswa";
                  const nis = s.nis || s.NIS || "-";
                  const nisn = s.nisn || s.NISN || "-";

                  const photoUrl =
                    s.photoUrl ||
                    s.avatarUrl ||
                    s.profilePictureUrl ||
                    s.avatar ||
                    s.profilePicture ||
                    s.studentProfile?.profilePictureUrl ||
                    s.studentProfile?.photoUrl;
                  const hasPhoto = Boolean(photoUrl && typeof photoUrl === "string" && photoUrl.trim() !== "");

                  return (
                    <div
                      key={sId}
                      className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center gap-3 shadow-2xs hover:border-blue-300 transition-all"
                    >
                      {/* Avatar with Absen Number Badge */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200/80 bg-slate-100 flex items-center justify-center relative">
                          {hasPhoto ? (
                            <img
                              src={resolveImageUrl(photoUrl)}
                              alt={name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallbackEl = e.target.nextElementSibling;
                                if (fallbackEl) fallbackEl.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-blue-50 text-[#2C1EE8] font-black text-xs flex items-center justify-center ${
                              hasPhoto ? "hidden" : "flex"
                            }`}
                          >
                            {name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        </div>

                        <span
                          className="absolute -top-1.5 -left-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-[#2C1EE8] text-white font-mono text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs z-10"
                          title={`Absen ${idx + 1}`}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                          NIS: {nis}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JADWAL PELAJARAN HARIAN (STREAMLINED & HIGHLY SCANNABLE) */}
        {activeTab === "jadwal" && (
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            {/* Mode Switch Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Jadwal KBM — {selectedClassName}
                </h2>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.NORMAL)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleMode === SCHEDULE_MODES.NORMAL
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mode Normal (Senin–Kamis)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.UPACARA)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleMode === SCHEDULE_MODES.UPACARA
                      ? "bg-white text-amber-900 shadow-2xs border border-amber-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hari Upacara
                </button>
              </div>
            </div>

            {/* Day Filter Bar (All Devices) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Filter Hari:</span>
              {["Semua", ...daysOfWeek].map((day) => {
                const isToday = day !== "Semua" && getIndoDayName(currentTime).toLowerCase() === day.toLowerCase();
                const isSelected = scheduleDayFilter === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setScheduleDayFilter(day)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#2C1EE8] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{day}</span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* Schedule Container by Day */}
            {loading ? (
              <div className="text-slate-400 text-xs py-12 text-center">Memuat jadwal KBM...</div>
            ) : (
              <div
                className={
                  scheduleDayFilter === "Semua"
                    ? "flex gap-4 overflow-x-auto pb-4 scrollbar-thin items-start"
                    : "w-full max-w-4xl mx-auto"
                }
              >
                {daysOfWeek
                  .filter((day) => scheduleDayFilter === "Semua" || scheduleDayFilter === day)
                  .map((day) => {
                    const dayScheds = getSchedulesForDay(day);
                    const isMonday = day === "Senin";
                    const isFriday = day === "Jumat";
                    const isToday = getIndoDayName(currentTime).toLowerCase() === day.toLowerCase();

                    let timeSlots = TIME_SLOTS_NORMAL;
                    if (isFriday) {
                      timeSlots = TIME_SLOTS_JUMAT;
                    } else if (isMonday && scheduleMode === SCHEDULE_MODES.UPACARA) {
                      timeSlots = TIME_SLOTS_UPACARA;
                    }

                    return (
                      <div
                        key={day}
                        className={`rounded-2xl p-4 space-y-3 transition-all ${
                          scheduleDayFilter === "Semua"
                            ? "min-w-[310px] sm:min-w-[330px] lg:min-w-[350px] flex-1 shrink-0"
                            : "w-full"
                        } ${
                          isToday
                            ? "bg-gradient-to-b from-blue-50/50 via-white to-white border-2 border-blue-200/90 shadow-2xs"
                            : "bg-white border border-slate-200/80"
                        }`}
                      >
                      {/* Compact Day Header */}
                      <div className="pb-1.5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <span>{day}</span>
                          {isToday && (
                            <span className="w-2 h-2 rounded-full bg-[#2C1EE8] animate-pulse" title="Hari Ini" />
                          )}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {timeSlots.length} slot
                        </span>
                      </div>

                      {/* Time Slots List */}
                      <div className="space-y-2">
                        {timeSlots.map((slot, idx) => {
                          const isActiveNow = isSlotActiveNow(day, slot.time);

                          // 1. Ceremony Special Event Slot
                          if (slot.type === "ceremony") {
                            return (
                              <div
                                key={`ceremony-${idx}`}
                                className={`p-2.5 rounded-xl border text-xs text-center space-y-0.5 ${
                                  isActiveNow
                                    ? "bg-amber-100/90 border-amber-500 text-amber-950 font-bold shadow-2xs"
                                    : "bg-amber-50/60 border-amber-200/80 text-amber-900"
                                }`}
                              >
                                {isActiveNow && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-800 uppercase tracking-wider mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                    Sedang Berlangsung
                                  </span>
                                )}
                                <span className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 text-amber-900">
                                  <Flag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  <span>UPACARA BENDERA</span>
                                </span>
                                <span className="text-[10px] font-mono opacity-80 block">{formatTimeRange(slot.time)}</span>
                              </div>
                            );
                          }

                          // 2. Character Building Special Event Slot
                          if (slot.type === "character") {
                            return (
                              <div
                                key={`char-${idx}`}
                                className={`p-2.5 rounded-xl border text-xs text-center space-y-0.5 ${
                                  isActiveNow
                                    ? "bg-emerald-100/90 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                                    : "bg-emerald-50/60 border-emerald-200/80 text-emerald-900"
                                }`}
                              >
                                {isActiveNow && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 uppercase tracking-wider mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                    Sedang Berlangsung
                                  </span>
                                )}
                                <span className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 text-emerald-900">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>PENGEMBANGAN KARAKTER</span>
                                </span>
                                <span className="text-[10px] font-mono opacity-80 block">{formatTimeRange(slot.time)}</span>
                              </div>
                            );
                          }

                          // 3. Compact Break / Ishoma Separator
                          if (slot.type === "break") {
                            return (
                              <div
                                key={`break-${idx}`}
                                className={`py-1 px-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between transition-all ${
                                  isActiveNow
                                    ? "bg-blue-50 border-[#2C1EE8] text-[#2C1EE8] font-bold"
                                    : "bg-slate-50/80 border-slate-200/60 text-slate-500"
                                }`}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Coffee className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{slot.label}</span>
                                </span>
                                <span>{formatTimeRange(slot.time)}</span>
                              </div>
                            );
                          }

                          // 4. Class Period Slot (Simplified & Scannable)
                          const schedItem = findSchedItemForSlot(dayScheds, slot.period);

                          const rawSubjectCode =
                            schedItem?.subjectCode ||
                            schedItem?.SubjectCode ||
                            schedItem?.subject?.code ||
                            "";

                          const rawSubjectName =
                            schedItem?.subjectName ||
                            schedItem?.SubjectName ||
                            schedItem?.subject?.name ||
                            "";

                          const teacherName =
                            schedItem?.teacherName ||
                            schedItem?.TeacherName ||
                            schedItem?.teacher?.fullName ||
                            schedItem?.teacher?.name ||
                            "";

                          const roomName =
                            schedItem?.room ||
                            schedItem?.Room ||
                            schedItem?.roomName ||
                            "";

                          const displaySubject = rawSubjectName || rawSubjectCode || "KOSONG";
                          const isKosong = displaySubject.toUpperCase() === "KOSONG";

                          // Compact Kosong Slot
                          if (isKosong) {
                            return (
                              <div
                                key={`period-${slot.period}-${idx}`}
                                className="py-1.5 px-2.5 rounded-lg border border-dashed border-slate-200/70 bg-slate-50/30 text-slate-400 text-xs flex items-center justify-between"
                              >
                                <span className="italic text-[11px]">Kosong</span>
                                <span className="font-mono text-[10px]">{formatTimeRange(slot.time)}</span>
                              </div>
                            );
                          }

                          // Lesson Card
                          return (
                            <div
                              key={`period-${slot.period}-${idx}`}
                              className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                                isActiveNow
                                  ? "bg-blue-50/90 border-2 border-[#2C1EE8] shadow-xs"
                                  : "bg-white border-slate-200/70 hover:border-slate-300"
                              }`}
                            >
                              {/* Live Highlight Tag ONLY when active now */}
                              {isActiveNow && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#2C1EE8] uppercase tracking-wider mb-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2C1EE8] animate-ping" />
                                  Sedang Berlangsung
                                </span>
                              )}

                              {/* Time Range */}
                              <div className="text-[11px] font-mono font-bold text-slate-500">
                                {formatTimeRange(slot.time)}
                              </div>

                              {/* Subject Name */}
                              <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                                {displaySubject}
                              </h4>

                              {/* Teacher & Room (combined secondary line with vector icons) */}
                              {(teacherName || roomName) && (
                                <div className="text-[11px] text-slate-500 font-medium truncate pt-0.5 flex items-center gap-1.5">
                                  {teacherName && (
                                    <span className="inline-flex items-center gap-1">
                                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{teacherName}</span>
                                    </span>
                                  )}
                                  {teacherName && roomName && <span className="text-slate-300">•</span>}
                                  {roomName && (
                                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{roomName}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: JADWAL MINGGUAN AGENDA (KELAS XI & XII) */}
        {activeTab === "mingguan" && isUpperGradeClass && (
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amber-600" />
                  <span>Agenda Rotasi Mingguan — {selectedClassName}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Jadwal rotasi mingguan (KK / MPU / PKL / ASAS) kalender akademik 2026/2027.
                </p>
              </div>

              {/* Semester Filter Switch */}
              <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200 flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Ganjil")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    agendaSemesterFilter === "Ganjil"
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ganjil
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Genap")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    agendaSemesterFilter === "Genap"
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Genap
                </button>
              </div>
            </div>

            {/* Agenda Table */}
            <div className="overflow-hidden border border-slate-200/90 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Minggu</th>
                    <th className="p-3">Bulan</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyAgendaList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-400 text-xs">
                        Tidak ada agenda rotasi mingguan ditemukan.
                      </td>
                    </tr>
                  ) : (
                    weeklyAgendaList.map((row, idx) => {
                      const noteKey = `${selectedClassName}_${row.semester}_w${row.week}`;
                      const noteValue = customNotes[noteKey] !== undefined ? customNotes[noteKey] : row.note;
                      const isEditing = editingKey === noteKey;
                      const isActiveNow = isWeeklyAgendaActiveNow(row);

                      const isKK = row.code === "KK";
                      const isMPU = row.code === "MPU";
                      const isPKL = row.code === "PKL";
                      const isExam = row.code === "ASAS" || row.code === "ASAT" || row.code === "PSAS" || row.code === "TKA";

                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            isActiveNow
                              ? "bg-blue-50/90 border-l-4 border-l-[#2C1EE8] font-bold shadow-2xs"
                              : "hover:bg-slate-50/80"
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className={isActiveNow ? "text-[#2C1EE8] font-black" : "text-slate-800"}>
                                W{row.week}
                              </span>
                              {isActiveNow && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-[#2C1EE8] text-white font-mono font-black px-2 py-0.5 rounded-full uppercase animate-pulse shadow-xs shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  MINGGU INI
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`p-3 font-semibold ${isActiveNow ? "text-slate-900 font-bold" : "text-slate-700"}`}>
                            {row.month}
                          </td>
                          <td className={`p-3 font-mono ${isActiveNow ? "text-[#2C1EE8] font-bold" : "text-slate-500"}`}>
                            {row.date}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border inline-block ${
                                isKK
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : isMPU
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : isPKL
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isExam
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {row.code}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 text-xs">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="bg-white border border-[#2C1EE8] text-slate-900 rounded-lg px-2.5 py-1 text-xs outline-none flex-1 font-sans"
                                  placeholder="Ketik keterangan..."
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveNote(noteKey)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingKey(null)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 group">
                                <span className={noteValue ? "text-slate-800 font-medium" : "text-slate-400 italic"}>
                                  {noteValue || "-"}
                                </span>
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditNote(noteKey, noteValue)}
                                    className="opacity-60 group-hover:opacity-100 p-0.5 text-amber-600 hover:text-amber-700 rounded cursor-pointer transition-all shrink-0"
                                    title="Edit Keterangan"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Assign Position Modal */}
      {selectedClass && (
        <AssignPositionModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          schoolClass={selectedClass}
          positionName={assignTarget.name}
          positionType={assignTarget.type}
          divisionId={assignTarget.divisionId}
          currentLeadership={activeLeadership}
          onSuccess={() => loadClassDetails(selectedClassId)}
        />
      )}

      {/* Add Custom Division Modal */}
      {selectedClass && (
        <AddDivisionModal
          isOpen={addDivModalOpen}
          onClose={() => setAddDivModalOpen(false)}
          schoolClass={selectedClass}
          onSuccess={() => loadClassDetails(selectedClassId)}
        />
      )}

      <Footer />
    </div>
  );
}
