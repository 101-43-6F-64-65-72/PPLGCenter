"use client";

import React, { useState, useEffect, useCallback } from "react";
import classTreeService from "@/services/classTreeService";
import schoolClassService from "@/services/schoolClassService";
import userService from "@/services/userService";
import { scheduleService } from "@/services/scheduleService";
import useAuth from "@/hooks/useAuth";
import AuthGuard from "@/components/layout/AuthGuard";
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
  Bookmark,
  Check,
  X,
  Flag,
  User,
  MapPin,
  Search,
  Printer,
  GraduationCap,
  Clock,
  BookOpen,
  Coffee,
  Sparkles,
  ChevronRight,
  Shield,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react";

function KelasPage() {
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

  const [scheduleDayFilter, setScheduleDayFilter] = useState(() => getInitialDayFilter());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
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

  const isWeeklyAgendaActiveNow = (row, dateObj = currentTime) => {
    if (!row || !row.date || !row.month) return false;

    const monthNamesIndo = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const currentMonthName = monthNamesIndo[dateObj.getMonth()].toLowerCase();
    const currentDateNum = dateObj.getDate();

    const rowMonths = row.month.split("/").map((m) => m.trim().toLowerCase());
    const matchMonth = rowMonths.includes(currentMonthName);
    if (!matchMonth) return false;

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

  // Role Permissions
  const userRoleStr = String(role || user?.role || "").toLowerCase();
  const isAdmin = userRoleStr === "admin" || userRoleStr === "1";
  const isTeacher = userRoleStr === "teacher" || userRoleStr === "guru" || userRoleStr === "2";
  const isStudent = userRoleStr === "student" || userRoleStr === "siswa" || userRoleStr === "3";
  const canManage = isAdmin || isTeacher;

  // Selected Class details
  const selectedClass = classes.find((c) => String(c.id || c.Id) === String(selectedClassId));
  const selectedClassName = selectedClass?.name || selectedClass?.Name || "PPLG";

  const isUpperGradeClass =
    selectedClassName.includes("11") ||
    selectedClassName.includes("12") ||
    selectedClassName.includes("XI") ||
    selectedClassName.includes("XII");

  // Fetch all classes
  const fetchClasses = useCallback(async () => {
    try {
      const res = schoolClassService.getAll
        ? await schoolClassService.getAll()
        : await schoolClassService.getAllClasses();
      const raw = res?.data ?? res ?? [];
      const items = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];

      let filteredItems = items;

      if (isStudent && user) {
        const studentClassId = user.classId || user.ClassId || user.studentProfile?.classId;
        const studentClassName = user.className || user.ClassName || user.studentProfile?.className;

        const myClassList = items.filter((c) => {
          const cId = c.id || c.Id;
          const cName = c.name || c.Name;
          if (studentClassId && String(cId) === String(studentClassId)) return true;
          if (studentClassName && String(cName).toLowerCase() === String(studentClassName).toLowerCase()) return true;
          return false;
        });

        if (myClassList.length > 0) {
          filteredItems = myClassList;
        }
      }

      setClasses(filteredItems);

      if (filteredItems.length > 0) {
        const userClassId = user?.classId || user?.ClassId || user?.studentProfile?.classId;
        const matchingUserClass = filteredItems.find((c) => String(c.id || c.Id) === String(userClassId));
        if (matchingUserClass) {
          setSelectedClassId(matchingUserClass.id || matchingUserClass.Id);
        } else {
          setSelectedClassId(filteredItems[0].id || filteredItems[0].Id);
        }
      }
    } catch (err) {
      console.error("Failed to load school classes:", err);
    }
  }, [user, isStudent]);

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
  }, [fetchClasses]);

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
    if (!confirm("Apakah Anda yakin ingin menghapus divisi ini?")) return;
    try {
      await classTreeService.deleteDivision(divId);
      loadClassDetails(selectedClassId);
    } catch (err) {
      console.error("Failed to delete division:", err);
      alert("Gagal menghapus divisi.");
    }
  };

  // Extract leadership roles
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

  // Schedule helpers
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

  const findSchedItemForSlot = (dayScheds, slotPeriod) => {
    if (!dayScheds || dayScheds.length === 0) return null;
    const byPeriod = dayScheds.find((s) => (s.periodNumber || s.PeriodNumber) === slotPeriod);
    if (byPeriod) return byPeriod;
    if (slotPeriod <= dayScheds.length) {
      return dayScheds[slotPeriod - 1];
    }
    return null;
  };

  // Find currently active subject right now
  const getCurrentActiveSubject = () => {
    const today = getIndoDayName(currentTime);
    if (!daysOfWeek.includes(today)) return null;

    const isFriday = today === "Jumat";
    const isMonday = today === "Senin";
    let slots = TIME_SLOTS_NORMAL;
    if (isFriday) slots = TIME_SLOTS_JUMAT;
    else if (isMonday && scheduleMode === SCHEDULE_MODES.UPACARA) slots = TIME_SLOTS_UPACARA;

    const dayScheds = getSchedulesForDay(today);

    for (const slot of slots) {
      if (isSlotActiveNow(today, slot.time)) {
        if (slot.type === "ceremony") return { title: "Upacara Bendera", room: "Lapangan", teacher: "-" };
        if (slot.type === "character") return { title: "Pembiasaan Karakter & Literasi", room: "Ruang Kelas", teacher: "-" };
        if (slot.type === "break" || slot.type === "prayer") return { title: "Waktu Istirahat / Ibadah", room: "-", teacher: "-" };

        const sched = findSchedItemForSlot(dayScheds, slot.period);
        if (sched) {
          return {
            title: sched.subjectName || sched.SubjectName || sched.subjectCode || "Pelajaran Kejuruan",
            room: sched.room || sched.Room || "Kelas",
            teacher: sched.teacherName || sched.TeacherName || "-"
          };
        }
        return { title: "Jam KBM Berlangsung", room: "Ruang Kelas", teacher: "-" };
      }
    }
    return null;
  };

  const currentActiveLesson = getCurrentActiveSubject();

  // Weekly Agenda rows for selected XI/XII class
  const weeklyAgendaList = WEEKLY_AGENDA_DATA.filter(
    (a) => a.class === selectedClassName && a.semester === agendaSemesterFilter
  );

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

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white">
      {/* Print-specific stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 6mm 8mm;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, footer, .no-print, #ai-chat-modal, [id*="ai-chat"], [class*="AiChat"], [class*="Mascot"], [class*="Toaster"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          main {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Navbar />
      </div>

      {/* DEDICATED OFFICIAL PRINT-ONLY TIMETABLE (HIDDEN ON SCREEN, SHOWN ON PRINT) */}
      <div className="hidden print:block print-container w-full text-black">
        <div className="border-b border-black pb-2 mb-2 flex items-center justify-between">
          <div>
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-600">
              SMK NEGERI 2 SURAKARTA · REKAYASA PERANGKAT LUNAK
            </h4>
            <h1 className="text-sm font-black uppercase tracking-tight text-black mt-0.5">
              JADWAL PELAJARAN — KELAS {selectedClassName}
            </h1>
            <p className="text-[9px] text-slate-600">
              Tahun Ajaran 2026/2027 · Mode {scheduleMode === SCHEDULE_MODES.NORMAL ? "Normal (Senin-Kamis)" : "Upacara (Senin)"}
            </p>
          </div>

          <div className="text-right text-[9px]">
            <p className="font-bold">
              Wali Kelas: <span className="font-normal">{selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "-"}</span>
            </p>
            <p className="text-slate-500">
              Dicetak: {currentTime.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Printable Matrix Table */}
        <table className="w-full border-collapse border border-black text-[9px] table-fixed">
          <thead>
            <tr className="bg-slate-100 text-black font-bold border-b border-black">
              <th className="border border-black p-1 w-14 text-center">Waktu</th>
              {daysOfWeek.map((day) => (
                <th key={`print-th-${day}`} className="border border-black p-1 text-center uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 11 }).map((_, periodIdx) => {
              const periodNum = periodIdx + 1;
              const refSlot = TIME_SLOTS_NORMAL.find((s) => s.period === periodNum);
              const refTime = refSlot ? refSlot.time : `Jam ${periodNum}`;

              return (
                <tr key={`print-tr-${periodNum}`} className="border-b border-black">
                  <td className="border border-black p-1 font-mono font-bold text-center bg-slate-50 text-[8px]">
                    <div>Ke-{periodNum}</div>
                    <div className="text-slate-500 text-[7.5px] font-normal">{formatTimeRange(refTime)}</div>
                  </td>

                  {daysOfWeek.map((day) => {
                    const dayScheds = getSchedulesForDay(day);
                    const isMonday = day === "Senin";
                    const isFriday = day === "Jumat";

                    let daySlots = TIME_SLOTS_NORMAL;
                    if (isFriday) daySlots = TIME_SLOTS_JUMAT;
                    else if (isMonday && scheduleMode === SCHEDULE_MODES.UPACARA) daySlots = TIME_SLOTS_UPACARA;

                    const schedItem = findSchedItemForSlot(dayScheds, periodNum);
                    const rawSubjectName = schedItem?.subjectName || schedItem?.SubjectName || schedItem?.subjectCode || "";
                    const teacherName = schedItem?.teacherName || schedItem?.TeacherName || "";
                    const roomName = schedItem?.room || schedItem?.Room || "";

                    const displaySubject = rawSubjectName || "";
                    const isKosong = !displaySubject || displaySubject.toLowerCase() === "kosong";

                    return (
                      <td
                        key={`print-cell-${day}-${periodNum}`}
                        className={`border border-black p-1 align-top ${isKosong ? "bg-white text-slate-400 text-center italic text-[8px]" : "bg-white"}`}
                      >
                        {isKosong ? (
                          <span>-</span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-bold text-black leading-tight">{displaySubject}</div>
                            {teacherName && <div className="text-[8px] text-slate-700">{teacherName}</div>}
                            {roomName && <div className="text-[7.5px] font-mono text-slate-500">[{roomName}]</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Print Footer Signatures */}
        <div className="mt-4 pt-2 flex items-start justify-between text-[9px] text-slate-700">
          <div className="text-center w-48">
            <p>Mengetahui,</p>
            <p className="font-bold">Wali Kelas {selectedClassName}</p>
            <div className="h-10" />
            <p className="font-bold underline">
              {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "( ................................................ )"}
            </p>
          </div>

          <div className="text-center w-48">
            <p>Surakarta, {currentTime.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="font-bold">Ketua Kelas</p>
            <div className="h-10" />
            <p className="font-bold underline">
              {ketuaLeader ? ketuaLeader.name : "( ................................................ )"}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STANDARD ULTRA-CLEAN BALANCED SCREEN LAYOUT
          (Sharp corners, soft subtle 1px slate-200 borders, clean aesthetics)
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="no-print flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
        
        {/* ── 1. Hero Header & Classroom Overview ── */}
        <div className="bg-white border border-slate-200 rounded-none p-6 sm:p-7 shadow-xs space-y-5 text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#2C1EE8] text-white text-[10px] font-black uppercase tracking-widest rounded-none">
                  Kelas & Akademik
                </span>
                <span className="text-xs font-bold text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-500">SMK Negeri 2 Surakarta</span>
              </div>

              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
                  {selectedClassName || "Kelas Siswa"}
                </h1>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  PPLG / RPL
                </span>
              </div>
            </div>

            {/* Class Switcher for Admin/Teacher or Badge for Students */}
            {isStudent || classes.length <= 1 ? (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-none shrink-0">
                <div className="w-8 h-8 rounded-none bg-[#2C1EE8] text-white flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kelas Terdaftar</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{selectedClassName}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-none shrink-0">
                {classes.map((c) => {
                  const cId = c.id || c.Id;
                  const cName = c.name || c.Name;
                  const isSelected = String(cId) === String(selectedClassId);

                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => setSelectedClassId(cId)}
                      className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                          : "bg-white text-slate-700 hover:bg-slate-200 border-slate-200"
                      }`}
                    >
                      {cName}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3 Quick Stat Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            {/* Wali Kelas */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-none flex items-center gap-3">
              <div className="w-9 h-9 rounded-none bg-white border border-slate-200 flex items-center justify-center text-[#2C1EE8] shrink-0 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Wali Kelas</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "Belum Ditentukan"}
                </p>
              </div>
            </div>

            {/* Total Siswa */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-none flex items-center gap-3">
              <div className="w-9 h-9 rounded-none bg-white border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Anggota Terdaftar</span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  {classStudents.length} Siswa Aktif
                </p>
              </div>
            </div>

            {/* Status KBM Sekarang */}
            <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-none flex items-center gap-3">
              <div className="w-9 h-9 rounded-none bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" />
                  KBM Saat Ini ({getIndoDayName(currentTime)})
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {currentActiveLesson ? currentActiveLesson.title : "Di Luar Jam KBM / Istirahat"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Tab Navigation & Top Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-200 rounded-none p-1.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("struktur")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center gap-2 border ${
                activeTab === "struktur"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-transparent"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Struktur Organisasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("anggota")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center gap-2 border ${
                activeTab === "anggota"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-transparent"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar Siswa ({classStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jadwal")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center gap-2 border ${
                activeTab === "jadwal"
                  ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                  : "bg-white text-slate-700 hover:bg-slate-100 border-transparent"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal Pelajaran</span>
            </button>

            {isUpperGradeClass && (
              <button
                type="button"
                onClick={() => setActiveTab("mingguan")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center gap-2 border ${
                  activeTab === "mingguan"
                    ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                    : "bg-white text-slate-700 hover:bg-slate-100 border-transparent"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Agenda Rotasi</span>
              </button>
            )}
          </div>

          {/* Quick Action Button for active tab */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto px-1">
            {activeTab === "jadwal" && (
              <button
                type="button"
                onClick={handlePrintSchedule}
                className="px-3.5 py-2 rounded-none bg-slate-900 hover:bg-[#2317be] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Cetak Jadwal Pelajaran Resmi"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>Cetak Jadwal</span>
              </button>
            )}

            {canManage && activeTab === "struktur" && (
              <button
                type="button"
                onClick={() => setAddDivModalOpen(true)}
                className="px-3.5 py-2 rounded-none bg-[#2C1EE8] hover:bg-[#2317be] active:bg-[#1d129f] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah Divisi</span>
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: STRUKTUR ORGANISASI KELAS (BAGAN RESMI)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "struktur" && (
          <div className="bg-white border border-slate-200 rounded-none p-6 sm:p-7 shadow-xs space-y-7 text-left">
            <div className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  Struktur Organisasi Kelas {selectedClassName}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Hierarki kepengurusan kelas resmi dari Wali Kelas, Dewan Pengurus Inti, hingga Seksi Bidang.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-[#2C1EE8] bg-blue-50 border border-blue-200 px-3 py-1 rounded-none self-start sm:self-auto">
                Periode 2026/2027
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-5 h-5 border border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat struktur organisasi...</p>
              </div>
            ) : (
              <div className="space-y-7">
                {/* 1. Wali Kelas (Top Tier) */}
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-none p-4 text-center space-y-1.5 shadow-2xs">
                  <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-none inline-block">
                    Wali Kelas
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "Belum Ditentukan"}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    Pembimbing Akademik & Karakter Siswa
                  </p>
                  {canManage && (
                    <div className="pt-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Wali Kelas", "WaliKelas")}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold rounded-none border border-slate-200 transition-colors cursor-pointer"
                      >
                        {selectedClass?.homeroomTeacherName ? "Ganti Wali Kelas" : "+ Tentukan Wali Kelas"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                <div className="w-px h-5 bg-slate-300 mx-auto" />

                {/* 2. Pengurus Inti: Ketua & Wakil (Executive Tier) */}
                <div className="space-y-2.5">
                  <h4 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    Dewan Pimpinan Inti
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
                    {/* Ketua Kelas */}
                    <div className="bg-white border border-slate-200 rounded-none p-4 text-center space-y-1.5 shadow-2xs relative">
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase tracking-widest rounded-none inline-flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-700" />
                        Ketua Kelas
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {ketuaLeader ? ketuaLeader.name : "Belum Ditentukan"}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">Penanggung Jawab Kelas</p>
                      {canManage && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAssign("Ketua Kelas", "StudentPosition")}
                            className="text-xs text-[#2C1EE8] font-bold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            {ketuaLeader ? "Ganti Siswa" : "+ Tentukan Siswa"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Wakil Ketua Kelas */}
                    <div className="bg-white border border-slate-200 rounded-none p-4 text-center space-y-1.5 shadow-2xs relative">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-[#2C1EE8] border border-blue-200 text-[10px] font-bold uppercase tracking-widest rounded-none inline-flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#2C1EE8]" />
                        Wakil Ketua
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {wakilLeader ? wakilLeader.name : "Belum Ditentukan"}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">Koordinasi & Operasional</p>
                      {canManage && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAssign("Wakil Ketua Kelas", "StudentPosition", wakilLeader?.divisionId)}
                            className="text-xs text-[#2C1EE8] font-bold uppercase tracking-wider hover:underline cursor-pointer"
                          >
                            {wakilLeader ? "Ganti Siswa" : "+ Tentukan Siswa"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="w-px h-5 bg-slate-300 mx-auto" />

                {/* 3. Sekretaris & Bendahara (Operational Tier) */}
                <div className="space-y-2.5">
                  <h4 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    Administrasi & Finansial
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
                    {/* Sekretaris 1 */}
                    <div className="bg-white border border-slate-200 rounded-none p-3 text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sekretaris 1</span>
                      <p className="font-bold text-slate-900 text-xs truncate">{sekretaris1 ? sekretaris1.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Sekretaris 1", "StudentPosition", sekretaris1?.divisionId)}
                          className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {sekretaris1 ? "Ganti" : "+ Tentukan"}
                        </button>
                      )}
                    </div>

                    {/* Sekretaris 2 */}
                    <div className="bg-white border border-slate-200 rounded-none p-3 text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sekretaris 2</span>
                      <p className="font-bold text-slate-900 text-xs truncate">{sekretaris2 ? sekretaris2.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Sekretaris 2", "StudentPosition", sekretaris2?.divisionId)}
                          className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {sekretaris2 ? "Ganti" : "+ Tentukan"}
                        </button>
                      )}
                    </div>

                    {/* Bendahara 1 */}
                    <div className="bg-white border border-slate-200 rounded-none p-3 text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bendahara 1</span>
                      <p className="font-bold text-slate-900 text-xs truncate">{bendahara1 ? bendahara1.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Bendahara 1", "StudentPosition", bendahara1?.divisionId)}
                          className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {bendahara1 ? "Ganti" : "+ Tentukan"}
                        </button>
                      )}
                    </div>

                    {/* Bendahara 2 */}
                    <div className="bg-white border border-slate-200 rounded-none p-3 text-center space-y-1 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Bendahara 2</span>
                      <p className="font-bold text-slate-900 text-xs truncate">{bendahara2 ? bendahara2.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Bendahara 2", "StudentPosition", bendahara2?.divisionId)}
                          className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {bendahara2 ? "Ganti" : "+ Tentukan"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Seksi Bidang & Divisi Khusus */}
                {customDivisions.length > 0 && (
                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <h4 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                      Seksi Bidang & Divisi Khusus
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {customDivisions.map((div) => (
                        <div
                          key={div.id}
                          className="bg-white border border-slate-200 rounded-none p-3.5 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{div.name}</span>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDivision(div.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                title="Hapus divisi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium text-[11px]">Koordinator:</span>
                            <span className="font-bold text-[#2C1EE8]">{div.leaderStudentName || "Belum Ditentukan"}</span>
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

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: DAFTAR SISWA (DIREKTORI ANGGOTA KELAS)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "anggota" && (
          <div className="bg-white border border-slate-200 rounded-none p-6 sm:p-7 shadow-xs space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  Direktori Siswa ({filteredStudents.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Daftar seluruh siswa aktif yang terdaftar di kelas {selectedClassName}.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cari nama atau NIS..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-none pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:bg-white transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-900 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-5 h-5 border border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat direktori siswa...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-300 rounded-none space-y-2">
                <p className="text-xs sm:text-sm font-bold text-slate-700">Tidak ada siswa yang sesuai pencarian.</p>
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery("")}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                      className="bg-white border border-slate-200 rounded-none p-3.5 flex items-center gap-3 shadow-2xs hover:border-[#2C1EE8] hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Avatar with Absen Number */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-none overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative">
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
                            className={`w-full h-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center ${
                              hasPhoto ? "hidden" : "flex"
                            }`}
                          >
                            {name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        </div>

                        <span
                          className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-none bg-[#2C1EE8] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-none z-10"
                          title={`Absen ${idx + 1}`}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Student Details */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>NIS: {nis}</span>
                          {nisn && nisn !== "-" && (
                            <>
                              <span>·</span>
                              <span className="truncate">NISN: {nisn}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: JADWAL PELAJARAN (LIVE TIMETABLE TRACKER)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "jadwal" && (
          <div className="bg-white border border-slate-200 rounded-none p-6 sm:p-7 shadow-xs space-y-5 text-left">
            {/* Day Filter Pills & Mode Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              {/* Day Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {["Semua", ...daysOfWeek].map((day) => {
                  const isToday = day !== "Semua" && getIndoDayName(currentTime).toLowerCase() === day.toLowerCase();
                  const isSelected = scheduleDayFilter === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setScheduleDayFilter(day)}
                      className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                          : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <span>{day}</span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse" title="Hari Ini" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mode Toggle */}
              <div className="p-1 bg-slate-100 border border-slate-200 rounded-none flex items-center gap-1 self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.NORMAL)}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    scheduleMode === SCHEDULE_MODES.NORMAL
                      ? "bg-white text-slate-900 border-slate-300 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Mode Normal
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.UPACARA)}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    scheduleMode === SCHEDULE_MODES.UPACARA
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Hari Upacara (Senin)
                </button>
              </div>
            </div>

            {/* Timetable List Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-5 h-5 border border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat jadwal pelajaran...</p>
              </div>
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
                    if (isFriday) timeSlots = TIME_SLOTS_JUMAT;
                    else if (isMonday && scheduleMode === SCHEDULE_MODES.UPACARA) timeSlots = TIME_SLOTS_UPACARA;

                    return (
                      <div
                        key={day}
                        className={`rounded-none p-4 space-y-2.5 transition-colors ${
                          scheduleDayFilter === "Semua"
                            ? "min-w-[300px] sm:min-w-[320px] flex-1 shrink-0"
                            : "w-full"
                        } ${
                          isToday
                            ? "bg-white border-2 border-[#2C1EE8] shadow-xs"
                            : "bg-white border border-slate-200 shadow-2xs"
                        }`}
                      >
                        {/* Day Header */}
                        <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <span>{day}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 bg-[#2C1EE8] text-white text-[9px] font-bold uppercase rounded-none">
                                Hari Ini
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {timeSlots.length} Jam Pelajaran
                          </span>
                        </div>

                        {/* Slots Stack */}
                        <div className="space-y-1.5">
                          {timeSlots.map((slot, idx) => {
                            const isActiveNow = isSlotActiveNow(day, slot.time);

                            // Ceremony
                            if (slot.type === "ceremony") {
                              return (
                                <div
                                  key={`ceremony-${idx}`}
                                  className={`p-2.5 rounded-none border text-center space-y-0.5 ${
                                    isActiveNow
                                      ? "bg-amber-100 border-amber-500 text-amber-950 font-bold"
                                      : "bg-amber-50/60 border-amber-200 text-amber-900"
                                  }`}
                                >
                                  {isActiveNow && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 uppercase tracking-widest mb-0.5">
                                      <span className="w-1.5 h-1.5 rounded-none bg-amber-600 animate-ping" />
                                      Sedang Berlangsung
                                    </span>
                                  )}
                                  <span className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                                    <Flag className="w-3.5 h-3.5 text-amber-700" />
                                    <span>UPACARA BENDERA</span>
                                  </span>
                                  <span className="text-[10px] font-mono font-bold opacity-80 block">
                                    {formatTimeRange(slot.time)}
                                  </span>
                                </div>
                              );
                            }

                            // Character Building
                            if (slot.type === "character") {
                              return (
                                <div
                                  key={`char-${idx}`}
                                  className={`p-2.5 rounded-none border text-center space-y-0.5 ${
                                    isActiveNow
                                      ? "bg-emerald-100 border-emerald-500 text-emerald-950 font-bold"
                                      : "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                  }`}
                                >
                                  {isActiveNow && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-0.5">
                                      <span className="w-1.5 h-1.5 rounded-none bg-emerald-600 animate-ping" />
                                      Sedang Berlangsung
                                    </span>
                                  )}
                                  <span className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>PEMBIASAAN KARAKTER & LITERASI</span>
                                  </span>
                                  <span className="text-[10px] font-mono font-bold opacity-80 block">
                                    {formatTimeRange(slot.time)}
                                  </span>
                                </div>
                              );
                            }

                            // Breaks
                            if (slot.type === "break" || slot.type === "prayer") {
                              return (
                                <div
                                  key={`break-${idx}`}
                                  className={`p-2 rounded-none border text-center space-y-0.5 ${
                                    isActiveNow
                                      ? "bg-blue-50 border-blue-300 text-[#2C1EE8] font-bold"
                                      : "bg-slate-50 border-slate-200 text-slate-600"
                                  }`}
                                >
                                  <span className="font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5">
                                    <Coffee className="w-3 h-3" />
                                    <span>{slot.label || "ISTIRAHAT"}</span>
                                  </span>
                                  <span className="text-[9px] font-mono opacity-80 block">
                                    {formatTimeRange(slot.time)}
                                  </span>
                                </div>
                              );
                            }

                            // Regular Subject Slot
                            const schedItem = findSchedItemForSlot(dayScheds, slot.period);
                            const rawSubjectName = schedItem?.subjectName || schedItem?.SubjectName || schedItem?.subjectCode || "";
                            const teacherName = schedItem?.teacherName || schedItem?.TeacherName || "";
                            const roomName = schedItem?.room || schedItem?.Room || "";

                            const displaySubject = rawSubjectName || "";
                            const isKosong = !displaySubject || displaySubject.toLowerCase() === "kosong";

                            return (
                              <div
                                key={`period-${slot.period}`}
                                className={`p-2.5 rounded-none border transition-colors space-y-1 ${
                                  isActiveNow
                                    ? "bg-blue-50/50 border-2 border-[#2C1EE8]"
                                    : "bg-white border-slate-100 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Jam Ke-{slot.period}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    {isActiveNow && (
                                      <span className="px-1.5 py-0.2 bg-[#2C1EE8] text-white text-[8.5px] font-bold uppercase rounded-none flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-none bg-white animate-ping" />
                                        Aktif
                                      </span>
                                    )}
                                    <span className="text-[9.5px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-none">
                                      {formatTimeRange(slot.time)}
                                    </span>
                                  </div>
                                </div>

                                {isKosong ? (
                                  <p className="text-xs font-semibold text-slate-300 italic">
                                    Tidak ada mata pelajaran
                                  </p>
                                ) : (
                                  <div className="space-y-0.5">
                                    <h4 className="font-bold text-xs text-slate-900 leading-tight">
                                      {displaySubject}
                                    </h4>

                                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 pt-0.5">
                                      {teacherName && (
                                        <span className="font-medium text-slate-600 truncate">
                                          {teacherName}
                                        </span>
                                      )}
                                      {roomName && (
                                        <span className="font-mono font-bold text-[#2C1EE8] bg-blue-50 px-1.5 py-0.2 rounded-none border border-blue-100 shrink-0">
                                          {roomName}
                                        </span>
                                      )}
                                    </div>
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

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4: AGENDA ROTASI (KELAS XI & XII)
        ══════════════════════════════════════════════════════════════════════ */}
        {isUpperGradeClass && activeTab === "mingguan" && (
          <div className="bg-white border border-slate-200 rounded-none p-6 sm:p-7 shadow-xs space-y-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  Agenda Rotasi & Kalender Akademik Kelas {selectedClassName}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Jadwal rotasi mingguan pembelajaran teori, praktik proyek industri, dan PKL.
                </p>
              </div>

              {/* Semester Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-none self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Ganjil")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    agendaSemesterFilter === "Ganjil"
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "text-slate-700 hover:bg-slate-200 border-transparent"
                  }`}
                >
                  Semester Ganjil
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Genap")}
                  className={`px-3 py-1 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    agendaSemesterFilter === "Genap"
                      ? "bg-[#2C1EE8] text-white border-[#2C1EE8]"
                      : "text-slate-700 hover:bg-slate-200 border-transparent"
                  }`}
                >
                  Semester Genap
                </button>
              </div>
            </div>

            {weeklyAgendaList.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 border border-dashed border-slate-300 rounded-none">
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  Belum ada data agenda rotasi mingguan untuk {selectedClassName} ({agendaSemesterFilter}).
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {weeklyAgendaList.map((row, idx) => {
                  const weekNum = row.week ?? row.weekNumber ?? (idx + 1);
                  const isActiveNow = isWeeklyAgendaActiveNow(row, currentTime);
                  const noteKey = `${row.class}_${row.semester}_${weekNum}`;
                  
                  const getCodeDescription = (code) => {
                    if (!code) return "Pembelajaran Reguler";
                    const c = code.toUpperCase();
                    if (c === "KK") return "Konsentrasi Keahlian (Praktik Produktif RPL)";
                    if (c === "MPU") return "Mata Pelajaran Umum (Teori)";
                    if (c === "PKL") return "Praktik Kerja Lapangan (Industri)";
                    if (c === "ASAS") return "Asesmen Sumatif Akhir Semester";
                    if (c === "ASAT") return "Asesmen Sumatif Akhir Tahun";
                    if (c === "LIBUR") return "Libur Akhir Semester";
                    if (c === "LBID") return "Libur Idulfitri / Cuti Bersama";
                    return `Sesi ${code}`;
                  };

                  const defaultDescription = row.note || getCodeDescription(row.code);
                  const currentNote = customNotes[noteKey] || defaultDescription;
                  const isEditingThis = editingKey === noteKey;

                  return (
                    <div
                      key={`agenda-${idx}`}
                      className={`p-3.5 rounded-none border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActiveNow
                          ? "bg-blue-50/40 border-2 border-[#2C1EE8]"
                          : "bg-white border-slate-200 shadow-2xs hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-none bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          M{weekNum}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              Minggu Ke-{weekNum}
                            </span>
                            {row.code && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] font-mono font-bold uppercase rounded-none border border-slate-200">
                                {row.code}
                              </span>
                            )}
                            {isActiveNow && (
                              <span className="px-1.5 py-0.2 bg-[#2C1EE8] text-white text-[8.5px] font-bold uppercase rounded-none">
                                Minggu Ini
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-400">
                            {row.date} {row.month} 2026
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 max-w-md sm:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Agenda / Keterangan</span>
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 mt-1 justify-end">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="px-2.5 py-1 bg-white border border-slate-300 rounded-none text-xs font-semibold text-slate-900 outline-none w-full max-w-xs focus:border-[#2C1EE8]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNote(noteKey)}
                              className="p-1 bg-[#2C1EE8] text-white rounded-none cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              className="p-1 bg-slate-200 text-slate-700 rounded-none cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 sm:justify-end mt-0.5">
                            <p className="text-xs font-medium text-slate-800">{currentNote}</p>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleStartEditNote(noteKey, currentNote)}
                                className="text-slate-400 hover:text-[#2C1EE8] p-1 transition-colors cursor-pointer"
                                title="Edit Keterangan"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <div className="no-print">
        <Footer />
      </div>

      {/* Modals */}
      {assignModalOpen && (
        <AssignPositionModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          targetPosition={assignTarget.name}
          positionType={assignTarget.type}
          divisionId={assignTarget.divisionId}
          classId={selectedClassId}
          onSuccess={() => {
            loadClassDetails(selectedClassId);
            setAssignModalOpen(false);
          }}
        />
      )}

      {addDivModalOpen && (
        <AddDivisionModal
          isOpen={addDivModalOpen}
          onClose={() => setAddDivModalOpen(false)}
          classId={selectedClassId}
          onSuccess={() => {
            loadClassDetails(selectedClassId);
            setAddDivModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <KelasPage />
    </AuthGuard>
  );
}
