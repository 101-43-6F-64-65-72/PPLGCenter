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
  Edit3,
  Coffee,
  Bookmark,
  Check,
  X,
  Flag,
  User,
  MapPin,
  Search,
  Printer,
  GraduationCap,
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

  const userRole = (role || user?.role || "").toString().toLowerCase();
  const isStudent = userRole === "student" || user?.role === 2 || userRole === "2" || userRole === "siswa";
  const isAdmin = userRole === "admin" || user?.role === 0 || userRole === "0";
  const isTeacher = userRole === "teacher" || userRole === "guru" || user?.role === 1 || userRole === "1";
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

  const fetchClasses = useCallback(async () => {
    try {
      const res = await schoolClassService.getClasses();
      const items = res?.items || res?.data?.items || res || [];

      let filteredItems = items;
      if (isStudent) {
        const userClassId = user?.classId || user?.ClassId || user?.studentProfile?.classId;
        const userClassName =
          user?.className ||
          user?.ClassName ||
          user?.studentProfile?.schoolClass?.name ||
          user?.studentProfile?.className;

        const myClassList = items.filter((c) => {
          const cId = c.id || c.Id;
          const cName = (c.name || c.Name || "").toLowerCase().trim();
          const matchesId = userClassId && String(cId) === String(userClassId);
          const matchesName = userClassName && cName === userClassName.toLowerCase().trim();
          return matchesId || matchesName;
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
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
        <div className="border-b-2 border-black pb-2 mb-2 flex items-center justify-between">
          <div>
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
              SMK NEGERI 2 SURAKARTA · PPLG CENTER
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
        <table className="w-full border-collapse border border-slate-400 text-[9px] table-fixed">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
              <th className="border border-slate-400 p-1 w-14 text-center">Waktu</th>
              {daysOfWeek.map((day) => (
                <th key={`print-th-${day}`} className="border border-slate-400 p-1 text-center uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS_NORMAL.map((normalSlot, slotIdx) => {
              const isBreak = normalSlot.type === "break";

              if (isBreak) {
                return (
                  <tr key={`print-break-${slotIdx}`} className="bg-slate-100 text-center font-bold text-[8px] text-slate-700">
                    <td className="border border-slate-400 p-0.5 font-mono">{formatTimeRange(normalSlot.time)}</td>
                    <td colSpan={5} className="border border-slate-400 p-0.5 uppercase tracking-widest bg-slate-100">
                      {normalSlot.label}
                    </td>
                  </tr>
                );
              }

              const periodNum = normalSlot.period;

              return (
                <tr key={`print-row-${periodNum}-${slotIdx}`}>
                  <td className="border border-slate-400 p-0.5 text-center font-mono font-bold bg-slate-50">
                    <div className="text-[9px]">{formatTimeRange(normalSlot.time)}</div>
                    <div className="text-[7.5px] text-slate-500">Jam {periodNum}</div>
                  </td>

                  {daysOfWeek.map((day) => {
                    const dayScheds = getSchedulesForDay(day);
                    const isMonday = day === "Senin";
                    const isFriday = day === "Jumat";

                    let daySlots = TIME_SLOTS_NORMAL;
                    if (isFriday) daySlots = TIME_SLOTS_JUMAT;
                    else if (isMonday && scheduleMode === SCHEDULE_MODES.UPACARA) daySlots = TIME_SLOTS_UPACARA;

                    const daySlot = daySlots.find((s) => s.period === periodNum);
                    const schedItem = findSchedItemForSlot(dayScheds, periodNum);

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

                    const displaySubject = rawSubjectName || rawSubjectCode || "";
                    const isKosong = !displaySubject || displaySubject.toLowerCase() === "kosong";

                    return (
                      <td
                        key={`print-cell-${day}-${periodNum}`}
                        className={`border border-slate-400 p-0.5 align-top ${isKosong ? "bg-white text-slate-400 text-center italic text-[8px]" : "bg-white"
                          }`}
                      >
                        {isKosong ? (
                          <span>-</span>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 leading-none">
                              {displaySubject}
                            </div>
                            {teacherName && (
                              <div className="text-[8px] text-slate-700 leading-tight">
                                {teacherName}
                              </div>
                            )}
                            {roomName && (
                              <div className="text-[7.5px] font-mono text-slate-500">
                                [{roomName}]
                              </div>
                            )}
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
        <div className="mt-3 pt-2 flex items-start justify-between text-[9px] text-slate-700">
          <div className="text-center w-48">
            <p>Mengetahui,</p>
            <p className="font-bold">Wali Kelas {selectedClassName}</p>
            <div className="h-8" />
            <p className="font-bold underline">
              {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "( ................................................ )"}
            </p>
          </div>

          <div className="text-center w-48">
            <p>Surakarta, {currentTime.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p className="font-bold">Ketua Kelas</p>
            <div className="h-8" />
            <p className="font-bold underline">
              {ketuaLeader ? ketuaLeader.name : "( ................................................ )"}
            </p>
          </div>
        </div>
      </div>

      {/* STANDARD SCREEN LAYOUT */}
      <main className="no-print flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-6">
        {/* Clean Hero Header & Class Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#2C1EE8] text-[11px] font-extrabold uppercase tracking-wider">
                Kelas & Akademik
              </span>
              <span className="text-xs font-bold text-slate-400">·</span>
              <span className="text-xs font-bold text-slate-600">
                Wali Kelas: <strong className="text-slate-900">{selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "Belum Ditentukan"}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {selectedClassName || "Kelas Siswa"}
            </h1>
          </div>

          {/* Class Switcher or Registered Student Class Badge */}
          {isStudent || classes.length <= 1 ? (
            <div className="flex items-center gap-2 bg-blue-50/90 border border-blue-200/80 px-4 py-2.5 rounded-2xl text-xs font-bold text-[#2C1EE8] shrink-0">
              <GraduationCap className="w-4 h-4 text-[#2C1EE8]" />
              <span>Kelas Terdaftar: <strong>{selectedClassName || "Kelas Anda"}</strong></span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 shrink-0">
              {classes.map((c) => {
                const cId = c.id || c.Id;
                const cName = c.name || c.Name;
                const isSelected = String(cId) === String(selectedClassId);

                return (
                  <button
                    key={cId}
                    type="button"
                    onClick={() => setSelectedClassId(cId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${isSelected
                      ? "bg-[#2C1EE8] text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                      }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Toolbar Tabs */}
        <div className="p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("struktur")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "struktur"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <span>Struktur Organisasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("anggota")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "anggota"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
            >
              <Users className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <span>Daftar Siswa ({classStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jadwal")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "jadwal"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#2C1EE8]" />
              <span>Jadwal Pelajaran</span>
            </button>

            {isUpperGradeClass && (
              <button
                type="button"
                onClick={() => setActiveTab("mingguan")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "mingguan"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span>Agenda Rotasi</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "jadwal" && (
              <button
                type="button"
                onClick={handlePrintSchedule}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-[#2C1EE8] hover:text-[#2C1EE8] transition shadow-2xs cursor-pointer"
                title="Cetak Jadwal Pelajaran (Print / Simpan PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-[#2C1EE8]" />
                <span>Cetak Jadwal</span>
              </button>
            )}

            {canManage && activeTab === "struktur" && (
              <button
                type="button"
                onClick={() => setAddDivModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2C1EE8] text-white text-xs font-bold hover:bg-[#2013ce] active:scale-[0.98] transition shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah Divisi</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: STRUKTUR ORGANISASI KELAS */}
        {activeTab === "struktur" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-7">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pengurus Kelas {selectedClassName}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bagan kepengurusan kelas dari Wali Kelas, Pengurus Inti, hingga Seksi Bidang.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">
                Memuat struktur kepengurusan...
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Wali Kelas */}
                <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-1.5 shadow-2xs">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#2C1EE8] border border-blue-100 text-[10px] font-extrabold uppercase tracking-wider inline-block">
                    Wali Kelas
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "Belum Ditentukan"}
                  </h3>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleOpenAssign("Wali Kelas", "WaliKelas")}
                      className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer pt-1"
                    >
                      {selectedClass?.homeroomTeacherName ? "Ganti Wali Kelas" : "+ Tentukan Wali Kelas"}
                    </button>
                  )}
                </div>

                {/* 2. Pimpinan Inti */}
                <div className="space-y-3">
                  <h4 className="text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Pengurus Inti
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {/* Ketua */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wider inline-block">
                        Ketua Kelas
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {ketuaLeader ? ketuaLeader.name : "Belum Ditentukan"}
                      </h4>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Ketua Kelas", "StudentPosition")}
                          className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {ketuaLeader ? "Ganti" : "+ Tentukan"}
                        </button>
                      )}
                    </div>

                    {/* Wakil */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs space-y-1">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider inline-block">
                        Wakil Ketua
                      </span>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {wakilLeader ? wakilLeader.name : "Belum Ditentukan"}
                      </h4>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Wakil Ketua Kelas", "StudentPosition", wakilLeader?.divisionId)}
                          className="text-[11px] text-[#2C1EE8] font-bold hover:underline cursor-pointer"
                        >
                          {wakilLeader ? "Ganti" : "+ Tentukan"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Sekretaris & Bendahara */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekretaris 1</span>
                    <p className="font-extrabold text-slate-900 text-xs truncate">{sekretaris1 ? sekretaris1.name : "Kosong"}</p>
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

                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekretaris 2</span>
                    <p className="font-extrabold text-slate-900 text-xs truncate">{sekretaris2 ? sekretaris2.name : "Kosong"}</p>
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

                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bendahara 1</span>
                    <p className="font-extrabold text-slate-900 text-xs truncate">{bendahara1 ? bendahara1.name : "Kosong"}</p>
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

                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-center shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bendahara 2</span>
                    <p className="font-extrabold text-slate-900 text-xs truncate">{bendahara2 ? bendahara2.name : "Kosong"}</p>
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

                {/* 4. Seksi Bidang */}
                {customDivisions.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Seksi Bidang & Divisi Khusus
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {customDivisions.map((div) => (
                        <div
                          key={div.id}
                          className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs truncate">{div.name}</span>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDivision(div.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition cursor-pointer"
                                title="Hapus divisi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400 text-[11px]">Koordinator:</span>
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

        {/* TAB 2: DAFTAR SISWA */}
        {activeTab === "anggota" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Daftar Siswa ({filteredStudents.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Direktori siswa aktif terdaftar di kelas {selectedClassName}.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari nama atau NIS..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#2C1EE8] focus:bg-white transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">
                Memuat data siswa...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">Tidak ada siswa yang sesuai</p>
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery("")}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 cursor-pointer"
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
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs hover:border-[#2C1EE8] hover:shadow-md transition-all duration-300"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative">
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
                            className={`w-full h-full bg-blue-50 text-[#2C1EE8] font-black text-xs flex items-center justify-center ${hasPhoto ? "hidden" : "flex"
                              }`}
                          >
                            {name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                        </div>

                        <span
                          className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2C1EE8] text-white font-mono text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs z-10"
                          title={`Absen ${idx + 1}`}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                          <span>NIS: {nis}</span>
                          {nisn && nisn !== "-" && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 truncate">NISN: {nisn}</span>
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

        {/* TAB 3: JADWAL PELAJARAN */}
        {activeTab === "jadwal" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            {/* Header with Day Filters & Mode Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              {/* Day Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {["Semua", ...daysOfWeek].map((day) => {
                  const isToday = day !== "Semua" && getIndoDayName(currentTime).toLowerCase() === day.toLowerCase();
                  const isSelected = scheduleDayFilter === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setScheduleDayFilter(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${isSelected
                        ? "bg-[#2C1EE8] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      <span>{day}</span>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Mode Toggle */}
              <div className="p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.NORMAL)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${scheduleMode === SCHEDULE_MODES.NORMAL
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Mode Normal
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.UPACARA)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${scheduleMode === SCHEDULE_MODES.UPACARA
                    ? "bg-white text-blue-900 shadow-2xs border border-blue-200"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Hari Upacara (Senin)
                </button>
              </div>
            </div>

            {/* Schedule Container */}
            {loading ? (
              <div className="text-center py-16 text-slate-400 text-xs font-medium">
                Memuat jadwal pelajaran...
              </div>
            ) : (
              <div
                className={
                  scheduleDayFilter === "Semua"
                    ? "flex gap-4 overflow-x-auto pb-4 scrollbar-thin items-start"
                    : "w-full max-w-3xl mx-auto"
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
                        className={`rounded-2xl p-4 space-y-2.5 transition-all ${scheduleDayFilter === "Semua"
                          ? "min-w-[310px] sm:min-w-[330px] lg:min-w-[340px] flex-1 shrink-0"
                          : "w-full"
                          } ${isToday
                            ? "bg-gradient-to-b from-blue-50/40 via-white to-white border-2 border-blue-200/90 shadow-2xs"
                            : "bg-white border border-slate-200/80"
                          }`}
                      >
                        {/* Day Header */}
                        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                            <span>{day}</span>
                            {isToday && (
                              <span className="w-2 h-2 rounded-full bg-[#2C1EE8] animate-pulse" title="Hari Ini" />
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                            {timeSlots.length} Slot
                          </span>
                        </div>

                        {/* Slots */}
                        <div className="space-y-1.5">
                          {timeSlots.map((slot, idx) => {
                            const isActiveNow = isSlotActiveNow(day, slot.time);

                            // Ceremony
                            if (slot.type === "ceremony") {
                              return (
                                <div
                                  key={`ceremony-${idx}`}
                                  className={`p-2 rounded-xl border text-xs text-center space-y-0.5 ${isActiveNow
                                    ? "bg-amber-100/90 border-amber-500 text-amber-950 font-bold shadow-2xs"
                                    : "bg-amber-50/60 border-amber-200 text-amber-900"
                                    }`}
                                >
                                  {isActiveNow && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-800 uppercase tracking-wider mb-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                      Sedang Berlangsung
                                    </span>
                                  )}
                                  <span className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 text-amber-900">
                                    <Flag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                    <span>UPACARA BENDERA</span>
                                  </span>
                                  <span className="text-[10px] font-mono opacity-80 block">{formatTimeRange(slot.time)}</span>
                                </div>
                              );
                            }

                            // Character Building
                            if (slot.type === "character") {
                              return (
                                <div
                                  key={`char-${idx}`}
                                  className={`p-2 rounded-xl border text-xs text-center space-y-0.5 ${isActiveNow
                                    ? "bg-emerald-100/90 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                                    : "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                    }`}
                                >
                                  {isActiveNow && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-800 uppercase tracking-wider mb-0.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                                      Sedang Berlangsung
                                    </span>
                                  )}
                                  <span className="font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 text-emerald-900">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>PENGEMBANGAN KARAKTER</span>
                                  </span>
                                  <span className="text-[10px] font-mono opacity-80 block">{formatTimeRange(slot.time)}</span>
                                </div>
                              );
                            }

                            // Break / Ishoma
                            if (slot.type === "break") {
                              return (
                                <div
                                  key={`break-${idx}`}
                                  className={`py-1 px-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between transition-all ${isActiveNow
                                    ? "bg-blue-50 border-[#2C1EE8] text-[#2C1EE8] font-bold"
                                    : "bg-slate-50 border-slate-200/60 text-slate-500"
                                    }`}
                                >
                                  <span className="flex items-center gap-1.5 font-sans font-semibold">
                                    <Coffee className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{slot.label}</span>
                                  </span>
                                  <span>{formatTimeRange(slot.time)}</span>
                                </div>
                              );
                            }

                            // Class Period Slot
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

                            const displaySubject = rawSubjectName || rawSubjectCode || "Kosong";
                            const isKosong = displaySubject.toLowerCase() === "kosong";

                            if (isKosong) {
                              return (
                                <div
                                  key={`period-${slot.period}-${idx}`}
                                  className="py-1 px-2.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 text-slate-400 text-xs flex items-center justify-between"
                                >
                                  <span className="italic text-[11px]">Jam Kosong</span>
                                  <span className="font-mono text-[10px]">{formatTimeRange(slot.time)}</span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`period-${slot.period}-${idx}`}
                                className={`p-2.5 rounded-xl border text-xs space-y-0.5 transition-all ${isActiveNow
                                  ? "bg-blue-50/90 border-2 border-[#2C1EE8] shadow-xs"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                                  }`}
                              >
                                {isActiveNow && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#2C1EE8] uppercase tracking-wider mb-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#2C1EE8] animate-ping" />
                                    Sedang Berlangsung
                                  </span>
                                )}

                                <div className="text-[10px] font-mono font-bold text-slate-400">
                                  {formatTimeRange(slot.time)}
                                </div>

                                <h4 className="font-bold text-slate-900 text-xs leading-snug">
                                  {displaySubject}
                                </h4>

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
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Agenda Rotasi Mingguan
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Jadwal rotasi mingguan (KK / MPU / PKL / ASAS) kalender akademik 2026/2027.
                </p>
              </div>

              {/* Semester Filter Switch */}
              <div className="p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Ganjil")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${agendaSemesterFilter === "Ganjil"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Semester Ganjil
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Genap")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${agendaSemesterFilter === "Genap"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Semester Genap
                </button>
              </div>
            </div>

            {/* Agenda Table */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px] tracking-wider">
                    <th className="p-3">Minggu</th>
                    <th className="p-3">Bulan</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Kode Kegiatan</th>
                    <th className="p-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyAgendaList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 text-xs font-medium">
                        Tidak ada agenda rotasi mingguan ditemukan untuk semester ini.
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
                          className={`transition-colors ${isActiveNow
                            ? "bg-blue-50/80 border-l-4 border-l-[#2C1EE8] font-bold"
                            : "hover:bg-slate-50"
                            }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <span className={isActiveNow ? "text-[#2C1EE8] font-black" : "text-slate-800"}>
                                W{row.week}
                              </span>
                              {isActiveNow && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-[#2C1EE8] text-white font-mono font-black px-2 py-0.5 rounded-full uppercase shadow-xs shrink-0">
                                  Minggu Ini
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
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border inline-block ${isKK
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

      <div className="no-print">
        <Footer />
      </div>
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
