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
  X
} from "lucide-react";

export default function KelasPage() {
  const { role, user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [activeTab, setActiveTab] = useState("struktur"); // "struktur" | "anggota" | "jadwal" | "mingguan"

  // Schedule Modes state: "normal" | "upacara"
  const [scheduleMode, setScheduleMode] = useState(SCHEDULE_MODES.NORMAL);
  const [agendaSemesterFilter, setAgendaSemesterFilter] = useState("Ganjil");

  // Data states
  const [tree, setTree] = useState([]);
  const [activeLeadership, setActiveLeadership] = useState(null);
  const [classStudents, setClassStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

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

      if (treeRes.status === "fulfilled") setTree(treeRes.value || []);
      if (leadRes.status === "fulfilled") setActiveLeadership(leadRes.value || null);

      if (studentsRes.status === "fulfilled") {
        const raw = studentsRes.value?.data ?? studentsRes.value;
        let list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
        list = list
          .filter((s) => String(s.classId || s.ClassId || "") === String(classId))
          .sort((a, b) => String(a.nis || a.NIS || a.fullName).localeCompare(String(b.nis || b.NIS || b.fullName)));
        setClassStudents(list);
      }

      if (schedRes.status === "fulfilled") {
        const raw = schedRes.value?.data ?? schedRes.value;
        let list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
        setSchedules(list);
      }
    } catch (err) {
      console.error("Failed to load class details:", err);
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

  // If user switches to Class X while on "mingguan" tab, switch back to "struktur"
  useEffect(() => {
    if (!isUpperGradeClass && activeTab === "mingguan") {
      setActiveTab("struktur");
    }
  }, [isUpperGradeClass, activeTab]);

  const handleOpenAssign = (name, type, divisionId = null) => {
    if (!canManage) return;
    setAssignTarget({ name, type, divisionId });
    setAssignModalOpen(true);
  };

  const handleDeleteDivision = async (divisionId) => {
    if (!canManage) return;
    if (!confirm("Apakah Anda yakin ingin menghapus divisi ini?")) return;
    try {
      await classTreeService.deleteDivision(divisionId);
      loadClassDetails(selectedClassId);
    } catch (err) {
      alert(err?.message || "Gagal menghapus divisi.");
    }
  };

  const getPositionLeader = (positionTitle) => {
    const foundNode = tree.find(
      (n) => n.name?.toLowerCase() === positionTitle.toLowerCase()
    );
    if (foundNode?.leaderStudentName) {
      return { id: foundNode.leaderStudentId, name: foundNode.leaderStudentName, divisionId: foundNode.id };
    }
    return null;
  };

  const ketuaLeader = activeLeadership?.classLeaderStudentName
    ? { id: activeLeadership.classLeaderStudentId, name: activeLeadership.classLeaderStudentName }
    : getPositionLeader("Ketua Kelas");

  const wakilLeader = getPositionLeader("Wakil Ketua Kelas");
  const sekretaris1 = getPositionLeader("Sekretaris 1");
  const sekretaris2 = getPositionLeader("Sekretaris 2");
  const bendahara1 = getPositionLeader("Bendahara 1");
  const bendahara2 = getPositionLeader("Bendahara 2");

  const mandatoryNames = ["ketua kelas", "wakil ketua kelas", "sekretaris 1", "sekretaris 2", "bendahara 1", "bendahara 2"];
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

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const getSchedulesForDay = (dayName) => {
    if (!Array.isArray(schedules)) return [];
    return schedules
      .filter((s) => getScheduleDayName(s).toLowerCase() === dayName.toLowerCase())
      .sort((a, b) => (a.startTime || a.StartTime || "").localeCompare(b.startTime || b.StartTime || ""));
  };

  // Robust Schedule Item Lookup for Jam ke-1..12
  const findSchedItemForSlot = (dayScheds, slotPeriod) => {
    if (!dayScheds || dayScheds.length === 0) return null;
    // 1. Match by period number if present
    const byPeriod = dayScheds.find((s) => (s.periodNumber || s.PeriodNumber) === slotPeriod);
    if (byPeriod) return byPeriod;

    // 2. Match by index position in ordered dayScheds
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-6">
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full mb-2">
              Portal Akademik & Organisasi Kelas PPLG
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Manajemen Kelas & Jadwal Pelajaran
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Hierarki pengurus kelas, daftar 36 siswa, alokasi jam KBM harian, dan agenda rotasi mingguan.
            </p>
          </div>

          {/* Class Selector Dropdown Header */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-3 self-start md:self-auto shadow-lg">
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap pl-1">Pilih Kelas:</span>
            <select
              id="kelas-selector-dropdown"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-900 border border-indigo-500/40 text-indigo-300 rounded-xl px-4 py-2 text-sm font-extrabold outline-none focus:border-indigo-400 cursor-pointer"
            >
              {classes.map((c) => {
                const cId = c.id || c.Id;
                return (
                  <option key={cId} value={cId}>
                    {c.name || c.Name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Status Permission Banner */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${canManage ? "text-emerald-400" : "text-cyan-400"}`} />
            <span className="text-slate-300 font-medium">
              Mode Akses: <strong className="text-white">{canManage ? "Admin / Guru (Full Edit & Custom Keterangan)" : "Siswa (Read-Only Viewer)"}</strong>
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {selectedClass ? `${selectedClassName} • Total ${classStudents.length} Siswa` : ""}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("struktur")}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "struktur"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            🌳 Hierarki Tree Pengurus Kelas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("anggota")}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "anggota"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            👥 Anggota Siswa Kelas ({classStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("jadwal")}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "jadwal"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            📅 Jadwal Pelajaran Harian
          </button>

          {/* TAB 4: JADWAL MINGGUAN AGENDA (HANYA UNTUK KELAS XI & XII) */}
          {isUpperGradeClass && (
            <button
              type="button"
              onClick={() => setActiveTab("mingguan")}
              className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "mingguan"
                  ? "border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-xl"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              🗓️ Agenda Rotasi Mingguan ({selectedClassName})
            </button>
          )}
        </div>

        {/* TAB 1: VISUAL TREE HIERARCHY */}
        {activeTab === "struktur" && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Struktur Organisasi Kelas {selectedClassName}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bagan hierarki jabatan pengurus kelas dari Wali Kelas hingga Seksi Divisi.
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => setAddDivModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 cursor-pointer transition-all self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Divisi / Seksi</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-slate-400 text-xs py-16 text-center">Memuat struktur hierarki kelas...</div>
            ) : (
              <div className="flex flex-col items-center w-full py-4 space-y-6">

                {/* ROOT LEVEL 0: WALI KELAS */}
                <div className="flex flex-col items-center">
                  <div className="w-72 bg-gradient-to-b from-indigo-900/80 to-slate-900 border-2 border-indigo-500/60 rounded-2xl p-4 shadow-xl text-center relative group">
                    <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase border border-indigo-500/30">
                      Wali Kelas
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-2">
                      {selectedClass?.homeroomTeacherName || activeLeadership?.homeroomTeacherName || "Belum Ditentukan"}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Penanggung Jawab Kelas</p>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Wali Kelas", "WaliKelas")}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{selectedClass?.homeroomTeacherName ? "Ganti Wali Kelas" : "+ Assign Wali Kelas"}</span>
                      </button>
                    )}
                  </div>
                  <div className="w-0.5 h-8 bg-indigo-500/40" />
                </div>

                {/* LEVEL 1: KETUA KELAS */}
                <div className="flex flex-col items-center">
                  <div className="w-72 bg-gradient-to-b from-amber-950/70 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-xl text-center relative group">
                    <div className="flex items-center justify-center gap-1">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                        Ketua Kelas
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-2">
                      {ketuaLeader ? ketuaLeader.name : "Belum Ditentukan"}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pemimpin Operasional Kelas</p>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Ketua Kelas", "StudentPosition")}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{ketuaLeader ? "Ganti Ketua" : "+ Assign Ketua Kelas"}</span>
                      </button>
                    )}
                  </div>
                  <div className="w-0.5 h-8 bg-amber-500/40" />
                </div>

                {/* LEVEL 2: WAKIL KETUA KELAS */}
                <div className="flex flex-col items-center">
                  <div className="w-72 bg-gradient-to-b from-blue-950/70 to-slate-900 border-2 border-blue-500/60 rounded-2xl p-4 shadow-xl text-center relative group">
                    <span className="px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase border border-blue-500/30">
                      Wakil Ketua Kelas
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-2">
                      {wakilLeader ? wakilLeader.name : "Belum Ditentukan"}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Wakil Pemimpin Kelas</p>

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleOpenAssign("Wakil Ketua Kelas", "StudentPosition", wakilLeader?.divisionId)}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{wakilLeader ? "Ganti Wakil" : "+ Assign Wakil"}</span>
                      </button>
                    )}
                  </div>
                  <div className="w-0.5 h-8 bg-blue-500/40" />
                </div>

                {/* LEVEL 3: MANDATORY CORE DIVISIONS */}
                <div className="w-full max-w-4xl border-t-2 border-slate-700 pt-6">
                  <h4 className="text-center text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                    Sekretaris & Bendahara Kelas
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Sekretaris 1</span>
                      <p className="font-bold text-white text-xs sm:text-sm">{sekretaris1 ? sekretaris1.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Sekretaris 1", "StudentPosition", sekretaris1?.divisionId)}
                          className="mt-2 text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          {sekretaris1 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Sekretaris 2</span>
                      <p className="font-bold text-white text-xs sm:text-sm">{sekretaris2 ? sekretaris2.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Sekretaris 2", "StudentPosition", sekretaris2?.divisionId)}
                          className="mt-2 text-[11px] text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          {sekretaris2 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-900 border border-teal-500/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">Bendahara 1</span>
                      <p className="font-bold text-white text-xs sm:text-sm">{bendahara1 ? bendahara1.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Bendahara 1", "StudentPosition", bendahara1?.divisionId)}
                          className="mt-2 text-[11px] text-teal-400 font-bold hover:underline cursor-pointer"
                        >
                          {bendahara1 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-900 border border-teal-500/40 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-1">Bendahara 2</span>
                      <p className="font-bold text-white text-xs sm:text-sm">{bendahara2 ? bendahara2.name : "Kosong"}</p>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign("Bendahara 2", "StudentPosition", bendahara2?.divisionId)}
                          className="mt-2 text-[11px] text-teal-400 font-bold hover:underline cursor-pointer"
                        >
                          {bendahara2 ? "Ganti" : "+ Assign"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* LEVEL 4: CUSTOM DIVISIONS */}
                <div className="w-full max-w-4xl border-t border-slate-800 pt-6 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Divisi / Seksi Kerja Khusus Kelas ({customDivisions.length})
                  </h4>

                  {customDivisions.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-700/60 rounded-xl">
                      Belum ada divisi / seksi khusus yang ditambahkan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customDivisions.map((div) => (
                        <div
                          key={div.id}
                          className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-4 space-y-2 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs sm:text-sm">{div.name}</span>
                            {canManage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteDivision(div.id)}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {div.description && <p className="text-[11px] text-slate-400 line-clamp-1">{div.description}</p>}
                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[10px]">Ketua Seksi:</span>
                            <span className="font-bold text-cyan-400">{div.leaderStudentName || "Belum Ditetapkan"}</span>
                          </div>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssign(div.name, "Division", div.id)}
                              className="w-full mt-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 font-bold text-cyan-400 rounded-lg cursor-pointer"
                            >
                              Ganti Penanggung Jawab
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANGGOTA SISWA KELAS */}
        {activeTab === "anggota" && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Daftar Anggota Siswa Kelas {selectedClassName}</span>
              </h2>
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
                {classStudents.length} Siswa Terdaftar
              </span>
            </div>

            {loading ? (
              <div className="text-slate-400 text-xs py-12 text-center">Memuat data siswa kelas...</div>
            ) : classStudents.length === 0 ? (
              <div className="text-slate-400 text-xs py-12 text-center border border-dashed border-slate-700 rounded-xl">
                Tidak ada data siswa terdaftar untuk kelas {selectedClassName}.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classStudents.map((s, idx) => {
                  const sId = s.id || s.Id;
                  const name = s.fullName || s.FullName || s.name;
                  const nis = s.nis || s.NIS || "-";
                  const nisn = s.nisn || s.NISN || "-";

                  return (
                    <div
                      key={sId}
                      className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-white text-xs sm:text-sm truncate">{name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          NIS: {nis} • NISN: {nisn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JADWAL PELAJARAN HARIAN (DAILY TIMETABLE + SCHEDULE MODE TOGGLE) */}
        {activeTab === "jadwal" && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-6">
            {/* Header + Schedule Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <span>Jadwal Pelajaran Harian — {selectedClassName}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Alokasi jam KBM harian dari Senin hingga Jumat.
                </p>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-700/80 flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.NORMAL)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    scheduleMode === SCHEDULE_MODES.NORMAL
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ☀️ Mode Normal (Senin–Kamis)
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode(SCHEDULE_MODES.UPACARA)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    scheduleMode === SCHEDULE_MODES.UPACARA
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🏛️ Mode Upacara (Hari Upacara)
                </button>
              </div>
            </div>

            {/* Mode Banner Info */}
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300 font-medium">
                  Alokasi Jam Aktif:{" "}
                  <strong className="text-indigo-300">
                    {scheduleMode === SCHEDULE_MODES.NORMAL
                      ? "Senin–Kamis 07.00 - 17.00 (Mode Regular KBM)"
                      : "Senin 07.00 - 16.00 (Mode Hari Upacara Bendera)"}
                  </strong>
                </span>
              </div>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md text-[11px]">
                ⭐ Jumat 07.00–08.15: Pengembangan Karakter
              </span>
            </div>

            {/* Schedule Grid by Day */}
            {loading ? (
              <div className="text-slate-400 text-xs py-12 text-center">Memuat jadwal pelajaran...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {daysOfWeek.map((day) => {
                  const dayScheds = getSchedulesForDay(day);
                  const isMonday = day === "Senin";
                  const isFriday = day === "Jumat";

                  // Select appropriate time slots allocation
                  let timeSlots = TIME_SLOTS_NORMAL;
                  if (isFriday) {
                    timeSlots = TIME_SLOTS_JUMAT;
                  } else if (isMonday && scheduleMode === SCHEDULE_MODES.UPACARA) {
                    timeSlots = TIME_SLOTS_UPACARA;
                  }

                  return (
                    <div key={day} className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-4 space-y-3">
                      <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                        <h3 className="font-extrabold text-indigo-400 text-sm flex items-center gap-1.5">
                          <span>{day}</span>
                          {isFriday && <span className="text-[10px] text-emerald-400 font-normal">⭐</span>}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-md">
                          {timeSlots.length} Alokasi
                        </span>
                      </div>

                      <div className="space-y-2">
                        {timeSlots.map((slot, idx) => {
                          if (slot.type === "ceremony") {
                            return (
                              <div key={`ceremony-${idx}`} className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-0.5 text-center">
                                <span className="font-black block text-[11px] uppercase tracking-wider">🚩 UPACARA BENDERA</span>
                                <span className="text-[10px] text-amber-400/80 font-mono block">{slot.time}</span>
                              </div>
                            );
                          }

                          if (slot.type === "character") {
                            return (
                              <div key={`char-${idx}`} className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-0.5 text-center">
                                <span className="font-black block text-[11px] uppercase tracking-wider">⭐ PENGEMBANGAN KARAKTER</span>
                                <span className="text-[10px] text-emerald-400/80 font-mono block">{slot.time}</span>
                              </div>
                            );
                          }

                          if (slot.type === "break") {
                            return (
                              <div key={`break-${idx}`} className="py-1 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Coffee className="w-3 h-3 text-slate-500" />
                                  <span>{slot.label}</span>
                                </span>
                                <span>{slot.time}</span>
                              </div>
                            );
                          }

                          // Class Period Slot: match with fetched schedule data by period number or index
                          const schedItem = findSchedItemForSlot(dayScheds, slot.period);

                          const rawCode = schedItem
                            ? (schedItem.subjectCode || schedItem.SubjectCode || schedItem.subjectName || schedItem.SubjectName || schedItem.subject?.code || schedItem.subject?.name || "")
                            : "KOSONG";

                          const cleanCode = rawCode.trim().toUpperCase() || "KOSONG";
                          const isKosong = cleanCode === "KOSONG";

                          return (
                            <div
                              key={`period-${slot.period}-${idx}`}
                              className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                                isKosong
                                  ? "bg-slate-950/30 border-slate-800/60 text-slate-600"
                                  : "bg-slate-800/90 border-indigo-500/30 text-white shadow-xs"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                                <span className={isKosong ? "text-slate-500" : "text-indigo-300"}>Jam ke-{slot.period}</span>
                                <span className="text-slate-400 text-[10px]">{slot.time}</span>
                              </div>
                              <h4 className={`font-black text-xs ${isKosong ? "text-slate-600 italic" : "text-white"}`}>
                                {cleanCode}
                              </h4>
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

        {/* TAB 4: JADWAL MINGGUAN AGENDA (HANYA DITAMPILKAN UNTUK KELAS XI & XII) */}
        {activeTab === "mingguan" && isUpperGradeClass && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400" />
                  <span>Agenda Rotasi Mingguan — {selectedClassName}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Jadwal rotasi mingguan (KK / MPU / PKL / ASAS) sesuai kalender akademik 2026/2027.
                  {canManage && <span className="text-amber-400 font-bold ml-1">• Admin & Guru dapat mengedit kolom Keterangan.</span>}
                </p>
              </div>

              {/* Semester Filter Switch */}
              <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-700 flex items-center gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Ganjil")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    agendaSemesterFilter === "Ganjil"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Semester Ganjil
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaSemesterFilter("Genap")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    agendaSemesterFilter === "Genap"
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Semester Genap
                </button>
              </div>
            </div>

            {/* Agenda Table */}
            <div className="overflow-x-auto border border-slate-700/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                    <th className="p-3.5">Minggu ke-</th>
                    <th className="p-3.5">Bulan</th>
                    <th className="p-3.5">Tanggal</th>
                    <th className="p-3.5">Kode Agenda</th>
                    <th className="p-3.5">Keterangan {canManage && <span className="text-amber-400 font-normal lowercase">(bisa diedit)</span>}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {weeklyAgendaList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 text-xs">
                        Tidak ada agenda rotasi mingguan ditemukan untuk semester ini.
                      </td>
                    </tr>
                  ) : (
                    weeklyAgendaList.map((row, idx) => {
                      const noteKey = `${selectedClassName}_${row.semester}_w${row.week}`;
                      const noteValue = customNotes[noteKey] !== undefined ? customNotes[noteKey] : row.note;
                      const isEditing = editingKey === noteKey;

                      const isKK = row.code === "KK";
                      const isMPU = row.code === "MPU";
                      const isPKL = row.code === "PKL";
                      const isExam = row.code === "ASAS" || row.code === "ASAT" || row.code === "PSAS" || row.code === "TKA";

                      return (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-300">Minggu {row.week}</td>
                          <td className="p-3.5 text-slate-200 font-semibold">{row.month}</td>
                          <td className="p-3.5 font-mono text-slate-400">{row.date}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black border inline-block ${
                                isKK
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                  : isMPU
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : isPKL
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : isExam
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : "bg-slate-700/40 text-slate-400 border-slate-600/40"
                              }`}
                            >
                              {row.code}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300 text-xs">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="bg-slate-900 border border-indigo-500 text-white rounded-lg px-2.5 py-1 text-xs outline-none flex-1 font-sans"
                                  placeholder="Ketik keterangan agenda..."
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveNote(noteKey)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md cursor-pointer"
                                  title="Simpan"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingKey(null)}
                                  className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 group">
                                <span className={noteValue ? "text-slate-200 font-medium" : "text-slate-500 italic"}>
                                  {noteValue || "-"}
                                </span>
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditNote(noteKey, noteValue)}
                                    className="opacity-60 group-hover:opacity-100 p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-md cursor-pointer transition-all shrink-0"
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
