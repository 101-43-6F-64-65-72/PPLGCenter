import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Newspaper, Calendar, Award, FileText, Building2, User,
  FileCheck, CheckSquare, BookOpen, Clock, MapPin, Sparkles, Users
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { scheduleService } from "@/services/scheduleService";
import { academicEventService } from "@/services/academicEventService";
import { dashboardService } from "@/services/dashboardService";
import { extracurricularService } from "@/services/extracurricularService";

export default function RoleBasedDashboard() {
  const { user, role, memberships, advisorFor } = useAuth();

  const normalizedRole = (role || user?.role || "Student").toLowerCase();

  if (normalizedRole === "admin") return null; // Admin uses /admin page

  if (normalizedRole === "teacher") {
    return <TeacherDashboard user={user} advisorFor={advisorFor} />;
  }

  return <StudentDashboard user={user} memberships={memberships} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function StudentDashboard({ user, memberships }) {
  const displayName = user?.fullName || user?.name || "Siswa";
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [studentDash, setStudentDash] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [schRes, evRes, dashRes] = await Promise.all([
          scheduleService.getStudentToday(),
          academicEventService.getUpcoming(3),
          dashboardService.getStudentDashboard(),
        ]);
        if (schRes?.data) setTodaySchedules(schRes.data);
        if (evRes?.data) setUpcomingEvents(evRes.data);
        if (dashRes?.data) setStudentDash(dashRes.data);
      } catch (err) {
        console.error("Dashboard widget load failed:", err);
      } finally {
        setLoadingSchedule(false);
      }
    }
    loadData();
  }, []);

  const menuItems = [
    { name: "Mading", desc: "Baca pengumuman & berita terbaru", path: "/mading", icon: Newspaper, color: "bg-blue-50 text-[#2c1ee8]" },
    { name: "Kalender", desc: "Jadwal kegiatan sekolah", path: "/kalender", icon: Calendar, color: "bg-emerald-50 text-emerald-600" },
    { name: "Ekstrakurikuler", desc: "Lihat & daftar ekskul", path: "/ekstrakurikuler", icon: Award, color: "bg-violet-50 text-violet-600" },
    { name: "Proposal", desc: "Ajukan proposal kegiatan", path: "/proposal", icon: FileText, color: "bg-amber-50 text-amber-600" },
    { name: "Booking", desc: "Booking fasilitas sekolah", path: "/fasilitas", icon: Building2, color: "bg-rose-50 text-rose-600" },
    { name: "Profil", desc: "Lihat & perbarui profil", path: "/profile", icon: User, color: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#2c1ee8] to-indigo-700 rounded-[28px] p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black border border-white/30 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">Selamat datang kembali,</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold border border-white/20">
                <User className="w-3.5 h-3.5" />
                Siswa
              </span>
              {user?.className && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold border border-white/20">
                  {user.className}
                </span>
              )}
              {user?.nis && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-semibold border border-white/15">
                  NIS: {user.nis}
                </span>
              )}
              {(studentDash?.attendancePercentage !== undefined || studentDash?.attendanceRatePercentage !== undefined) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-xs font-black text-emerald-200 border border-emerald-400/30">
                  Kehadiran: {studentDash.attendancePercentage ?? studentDash.attendanceRatePercentage}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Membership Chips */}
        {Array.isArray(memberships) && memberships.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/20">
            <p className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">Keanggotaan Ekstrakurikuler</p>
            <div className="flex flex-wrap gap-2">
              {memberships.map((m) => (
                <span
                  key={m.extracurricularId || m.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/15 border border-white/25 text-xs font-bold backdrop-blur-sm"
                >
                  <Award className="w-3.5 h-3.5 opacity-80" />
                  {m.name}
                  {m.position && m.position !== "Member" && (
                    <span className="opacity-70">· {m.position}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── LMS Stats Summary Cards ───────────────────────────────────────── */}
      {studentDash && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Tugas Mendekati Deadline</p>
            <p className="text-2xl font-black text-rose-600">
              {studentDash.assignmentsNearDeadlineCount ?? (Array.isArray(studentDash.assignmentsNearDeadline) ? studentDash.assignmentsNearDeadline.length : 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Asesmen / Nilai Selesai</p>
            <p className="text-2xl font-black text-amber-600">
              {studentDash.completedAssessmentsCount ?? studentDash.pendingAssignmentsCount ?? 0}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Materi Baru Terbit</p>
            <p className="text-2xl font-black text-[#2c1ee8]">
              {studentDash.recentMaterialsCount ?? (Array.isArray(studentDash.latestMaterials) ? studentDash.latestMaterials.length : 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase">Persentase Kehadiran</p>
            <p className="text-2xl font-black text-emerald-600">
              {studentDash.attendancePercentage ?? studentDash.attendanceRatePercentage ?? 100}%
            </p>
          </div>
        </div>
      )}

      {/* ── Today's Schedule & Upcoming Events Widgets ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule Widget */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[28px] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2c1ee8]" />
              Jadwal Belajar Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long" })})
            </h2>
            <span className="text-[11px] font-bold text-gray-400">Hari ini belajar apa</span>
          </div>

          {loadingSchedule ? (
            <p className="text-xs text-gray-400 py-4 text-center">Memuat jadwal belajar...</p>
          ) : todaySchedules.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-1 border border-gray-100">
              <Sparkles className="w-6 h-6 text-gray-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-700">Tidak ada jadwal belajar hari ini</p>
              <p className="text-[11px] text-gray-400">Selamat beristirahat atau belajar mandiri!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-4 hover:border-blue-200 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-[#2c1ee8] text-[10px] font-black uppercase">
                        {sch.subjectCode}
                      </span>
                      <h4 className="text-xs font-black text-gray-900">{sch.subjectName}</h4>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">Pengajar: {sch.teacherName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-[#2c1ee8] block">{sch.startTime} - {sch.endTime}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {sch.room}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Academic Events Widget */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[28px] border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Event Terdekat
            </h2>
            <Link href="/kalender" className="text-[11px] font-bold text-[#2c1ee8] hover:underline">
              Lihat Kalender →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">Belum ada agenda akademik terdekat.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                      {ev.type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {new Date(ev.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">{ev.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Menu Grid ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Menu Siswa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className="group bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${item.color} transition-transform group-hover:scale-110 duration-200`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-gray-900 group-hover:text-[#2c1ee8] transition-colors">{item.name}</h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function TeacherDashboard({ user, advisorFor: propAdvisorFor }) {
  const displayName = user?.fullName || user?.name || "Guru";
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [teacherDash, setTeacherDash] = useState(null);
  const [supervisedEkskuls, setSupervisedEkskuls] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [schRes, dashRes, supRes] = await Promise.all([
          scheduleService.getTeacherToday().catch(() => ({ data: [] })),
          dashboardService.getTeacherDashboard().catch(() => ({ data: null })),
          extracurricularService.getSupervisedByMe().catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          if (schRes?.data) setTodaySchedules(schRes.data);
          if (dashRes?.data) setTeacherDash(dashRes.data);
          
          const liveSupervised = supRes?.data || dashRes?.data?.advisingExtracurriculars || [];
          setSupervisedEkskuls(liveSupervised);
        }
      } catch (err) {
        console.error("Teacher dashboard load failed:", err);
      } finally {
        if (isMounted) setLoadingSchedule(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const menuItems = [
    { name: "Approval Proposal", desc: "Tinjau & setujui proposal siswa", path: "/proposal", icon: FileCheck, color: "bg-blue-50 text-[#2c1ee8]" },
    { name: "Ekskul Binaan", desc: "Kelola ekskul & organisasi binaan", path: "/ekstrakurikuler", icon: Award, color: "bg-emerald-50 text-emerald-600" },
    { name: "Buku Nilai", desc: "Kelola & rekap nilai kelas", path: "/guru", icon: CheckSquare, color: "bg-violet-50 text-violet-600" },
    { name: "Kalender", desc: "Jadwal kegiatan sekolah", path: "/kalender", icon: Calendar, color: "bg-amber-50 text-amber-600" },
    { name: "Materi Belajar", desc: "Kelola materi & tugas", path: "/mading", icon: BookOpen, color: "bg-rose-50 text-rose-600" },
    { name: "Profil", desc: "Lihat & perbarui profil", path: "/profile", icon: User, color: "bg-slate-100 text-slate-600" },
  ];

  const displayBadges = supervisedEkskuls.length > 0 
    ? supervisedEkskuls 
    : (Array.isArray(propAdvisorFor) ? propAdvisorFor : []);

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[28px] p-6 sm:p-8 text-white shadow-lg shadow-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black border border-white/30 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-white/70">Selamat datang,</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold border border-white/20">
                <BookOpen className="w-3.5 h-3.5" />
                Guru
              </span>
              
              {displayBadges.slice(0, 3).map((a) => (
                <span
                  key={a.id || a.extracurricularId || a.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-100 text-xs font-bold border border-emerald-300/40"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-300" />
                  Pembina {a.name}
                </span>
              ))}
              {displayBadges.length > 3 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 text-emerald-200 text-xs font-bold border border-emerald-300/30">
                  +{displayBadges.length - 3} lainnya
                </span>
              )}

              {user?.position && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold border border-white/20">
                  {user.position}
                </span>
              )}
              {user?.nip && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-semibold border border-white/15">
                  NIP: {user.nip}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Advisor Chips Summary */}
        {displayBadges.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/20">
            <p className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">Unit Kegiatan Binaan Saya</p>
            <div className="flex flex-wrap gap-2">
              {displayBadges.map((a) => (
                <span
                  key={a.id || a.extracurricularId || a.name}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/15 border border-white/25 text-xs font-bold backdrop-blur-sm"
                >
                  <Award className="w-4 h-4 opacity-90 text-amber-300" />
                  Pembina {a.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Real-Time KPI Cards (All DB Sourced) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Proposal Menunggu ACC</p>
            <FileCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{teacherDash?.pendingProposalsCount ?? 0}</p>
          <p className="text-[10px] text-gray-400 font-medium">Proposal dari unit binaan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ekskul Binaan Saya</p>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{supervisedEkskuls.length || teacherDash?.advisingExtracurricularCount || 0}</p>
          <p className="text-[10px] text-gray-400 font-medium">Organisasi / Ekskul aktif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Absensi Belum Dibuka</p>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{teacherDash?.unopenedAttendanceSessionsCount ?? 0}</p>
          <p className="text-[10px] text-gray-400 font-medium">Sesi kelas hari ini</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-1.5 border-l-4 border-l-[#2c1ee8]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Verifikasi Selesai</p>
            <CheckSquare className="w-4 h-4 text-[#2c1ee8]" />
          </div>
          <p className="text-2xl font-black text-[#2c1ee8]">{teacherDash?.completedVerificationCount ?? 0}</p>
          <p className="text-[10px] text-gray-400 font-medium">Proposal telah direview</p>
        </div>
      </div>

      {/* ── Section Tab: Ekskul Binaan (Rendered whenever teacher supervises at least 1 org) ── */}
      {supervisedEkskuls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-emerald-600" />
              <span>Daftar Organisasi / Ekstrakurikuler Binaan ({supervisedEkskuls.length})</span>
            </h2>
            <Link href="/ekstrakurikuler" className="text-xs font-bold text-emerald-700 hover:underline">
              Kelola Semua Ekskul →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {supervisedEkskuls.map((ekskul) => (
              <div
                key={ekskul.id || ekskul.name}
                className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4 border-l-4 border-l-emerald-600"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase border border-emerald-200">
                      Pembina Utama
                    </span>
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-black text-gray-900">{ekskul.name}</h3>
                  <p className="text-xs text-gray-500 font-medium line-clamp-2">
                    {ekskul.description || `Unit kegiatan sekolah ${ekskul.name}.`}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      Anggota Aktif:
                    </span>
                    <span className="font-extrabold text-gray-900">{ekskul.memberCount ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                      Proposal Pending:
                    </span>
                    <span className={`font-extrabold ${ekskul.pendingProposalsCount > 0 ? "text-amber-600" : "text-gray-900"}`}>
                      {ekskul.pendingProposalsCount ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Total Verifikasi:
                    </span>
                    <span className="font-extrabold text-gray-900">{ekskul.completedReviewCount ?? 0}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Status: Aktif
                  </span>
                  <Link
                    href={`/ekstrakurikuler/${ekskul.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    <span>Detail Ekskul</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's Teaching Schedule Widget ─────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Jadwal Mengajar Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long" })})
          </h2>
          <span className="text-[11px] font-bold text-gray-400">Total: {todaySchedules.length} Kelas</span>
        </div>

        {loadingSchedule ? (
          <p className="text-xs text-gray-400 py-4 text-center">Memuat jadwal mengajar...</p>
        ) : todaySchedules.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 text-center space-y-1 border border-gray-100">
            <Sparkles className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs font-bold text-gray-700">Tidak ada jadwal mengajar hari ini</p>
            <p className="text-[11px] text-gray-400">Anda tidak memiliki kelas yang dijadwalkan hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySchedules.map((sch) => (
              <div
                key={sch.id}
                className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Kelas: {sch.className}
                  </span>
                  <h4 className="text-xs font-black text-gray-900">{sch.subjectName}</h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-700 block">{sch.startTime} - {sch.endTime}</span>
                  <span className="text-[10px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    {sch.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Menu Grid ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Menu Guru</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className="group bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${item.color} transition-transform group-hover:scale-110 duration-200`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-gray-900 group-hover:text-emerald-700 transition-colors">{item.name}</h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
