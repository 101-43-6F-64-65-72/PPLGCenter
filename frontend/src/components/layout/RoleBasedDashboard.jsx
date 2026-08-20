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
  const position = (user?.position || "").toLowerCase();
  const isPplgTeacher = normalizedRole === "teacher" && (position.includes("pengembangan perangkat lunak dan gim") || position.includes("pplg"));

  if (normalizedRole === "admin" || isPplgTeacher) return null; // Admin & PPLG Teachers use /admin page

  return <StudentDashboard user={user} memberships={memberships} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function StudentDashboard({ user, memberships }) {
  const displayName = user?.fullName || user?.name || "Siswa";
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [scheduleMeta, setScheduleMeta] = useState({ activeCategory: "MPU", isKkUnavailable: false, className: "" });
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
        if (schRes?.data) {
          const payload = schRes.data;
          if (Array.isArray(payload)) {
            setTodaySchedules(payload);
          } else if (payload && typeof payload === "object") {
            setTodaySchedules(payload.items || []);
            setScheduleMeta({
              activeCategory: payload.activeCategory || "MPU",
              isKkUnavailable: !!payload.isKkUnavailable,
              className: payload.className || "",
            });
          }
        }
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
    { name: "Pengumuman", desc: "Pengumuman Resmi Jurusan", path: "/pengumuman", icon: Bell },
    { name: "Mading", desc: "Berita & Mading Sekolah", path: "/mading", icon: Newspaper },
    { name: "Kalender", desc: "Jadwal Kegiatan", path: "/kalender", icon: Calendar },
    { name: "Ekstrakurikuler", desc: "Katalog & Pendaftaran", path: "/ekstrakurikuler", icon: Award },
    { name: "Proposal", desc: "Pengajuan Proposal", path: "/proposal", icon: FileText },
    { name: "Booking", desc: "Peminjaman Fasilitas", path: "/fasilitas", icon: Building2 },
    { name: "Profil", desc: "Pengaturan Akun", path: "/profile", icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-slate-900 text-white flex items-center justify-center text-lg font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                  Siswa
                </span>
                {user?.className && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-[#2c1ee8] text-xs font-bold border border-blue-200">
                    {user.className}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {user?.nis ? `NIS: ${user.nis}` : "Selamat datang di Portal Student Center SMKN 2 Surakarta"}
              </p>
            </div>
          </div>

          {(studentDash?.attendancePercentage !== undefined || studentDash?.attendanceRatePercentage !== undefined) && (
            <div className="px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 self-start sm:self-auto">
              Kehadiran: {studentDash.attendancePercentage ?? studentDash.attendanceRatePercentage}%
            </div>
          )}
        </div>

        {/* Membership Chips */}
        {Array.isArray(memberships) && memberships.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ekskul:</span>
            {memberships.map((m) => (
              <span
                key={m.extracurricularId || m.name}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                <Award className="w-3 h-3 text-[#2c1ee8]" />
                {m.name} {m.position && m.position !== "Member" ? `(${m.position})` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── LMS Stats Summary Cards ───────────────────────────────────────── */}
      {studentDash && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tugas Near Deadline</span>
            <span className="text-2xl font-bold text-slate-900 block">
              {studentDash.assignmentsNearDeadlineCount ?? (Array.isArray(studentDash.assignmentsNearDeadline) ? studentDash.assignmentsNearDeadline.length : 0)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Nilai Selesai</span>
            <span className="text-2xl font-bold text-slate-900 block">
              {studentDash.completedAssessmentsCount ?? studentDash.pendingAssignmentsCount ?? 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Materi Terbaru</span>
            <span className="text-2xl font-bold text-[#2c1ee8] block">
              {studentDash.recentMaterialsCount ?? (Array.isArray(studentDash.latestMaterials) ? studentDash.latestMaterials.length : 0)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Kehadiran</span>
            <span className="text-2xl font-bold text-emerald-600 block">
              {studentDash.attendancePercentage ?? studentDash.attendanceRatePercentage ?? 100}%
            </span>
          </div>
        </div>
      )}

      {/* ── Today's Schedule & Upcoming Events Widgets ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Today's Schedule Widget */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2c1ee8]" />
              Jadwal Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long" })})
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-[#2c1ee8] text-[10px] font-bold border border-blue-200 uppercase">
                {scheduleMeta.activeCategory || "MPU"}
              </span>
              <span className="text-xs text-slate-400 font-medium">{todaySchedules.length} Kelas</span>
            </div>
          </div>

          {loadingSchedule ? (
            <p className="text-xs text-slate-400 py-3 text-center">Memuat jadwal...</p>
          ) : scheduleMeta.isKkUnavailable ? (
            <div className="bg-amber-50 rounded-md p-4 text-center text-xs font-bold text-amber-800 border border-amber-200 space-y-1">
              <p className="font-extrabold uppercase tracking-wider text-[11px] text-amber-900">Blok Konsentrasi Keahlian (KK)</p>
              <p className="text-amber-700">Jadwal KK belum tersedia</p>
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="bg-slate-50 rounded-md p-4 text-center text-xs text-slate-500 border border-slate-100">
              Tidak ada jadwal belajar kelas hari ini.
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{sch.subjectName}</span>
                    <span className="text-slate-500">Pengajar: {sch.teacherName}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#2c1ee8] block">{sch.startTime} - {sch.endTime}</span>
                    <span className="text-slate-600 font-medium">{sch.room}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Upcoming Academic Events Widget */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2c1ee8]" />
              Agenda Akademik
            </h2>
            <Link href="/kalender" className="text-xs font-bold text-[#2c1ee8] hover:underline">
              Kalender →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada agenda akademik terdekat.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="p-2.5 rounded-md bg-slate-50 border border-slate-200 space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">{ev.type}</span>
                    <span className="text-slate-400 font-medium">
                      {new Date(ev.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900">{ev.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Menu Grid ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Menu Utama Siswa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className="group bg-white border border-slate-200 rounded-lg p-3.5 hover:border-[#2c1ee8] transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 group-hover:bg-[#2c1ee8] group-hover:text-white flex items-center justify-center mb-2 transition-colors">
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2c1ee8] transition-colors">{item.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">{item.desc}</p>
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
    { name: "Approval Proposal", desc: "Tinjau proposal siswa", path: "/proposal", icon: FileCheck },
    { name: "Ekskul Binaan", desc: "Kelola ekskul binaan", path: "/ekstrakurikuler", icon: Award },
    { name: "Buku Nilai", desc: "Buku nilai & rekap", path: "/guru", icon: CheckSquare },
    { name: "Kalender", desc: "Jadwal kegiatan", path: "/kalender", icon: Calendar },
    { name: "Materi Belajar", desc: "Materi & tugas", path: "/mading", icon: BookOpen },
    { name: "Profil", desc: "Pengaturan akun", path: "/profile", icon: User },
  ];

  const displayBadges = supervisedEkskuls.length > 0 
    ? supervisedEkskuls 
    : (Array.isArray(propAdvisorFor) ? propAdvisorFor : []);

  return (
    <div className="space-y-6">
      {/* ── Welcome Header ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-emerald-700 text-white flex items-center justify-center text-lg font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  Guru
                </span>
                {user?.position && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    {user.position}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {user?.nip ? `NIP: ${user.nip}` : "Portal Tenaga Pendidik SMKN 2 Surakarta"}
              </p>
            </div>
          </div>
        </div>

        {/* Advisor Chips Summary */}
        {displayBadges.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Binaan:</span>
            {displayBadges.map((a) => (
              <span
                key={a.id || a.extracurricularId || a.name}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Pembina {a.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Real-Time KPI Cards (All DB Sourced) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proposal Pending</span>
            <FileCheck className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-bold text-amber-600 block">{teacherDash?.pendingProposalsCount ?? 0}</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ekskul Binaan</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold text-emerald-600 block">{supervisedEkskuls.length || teacherDash?.advisingExtracurricularCount || 0}</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absensi Unopened</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-bold text-rose-600 block">{teacherDash?.unopenedAttendanceSessionsCount ?? 0}</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verifikasi Selesai</span>
            <CheckSquare className="w-4 h-4 text-[#2c1ee8]" />
          </div>
          <span className="text-2xl font-bold text-[#2c1ee8] block">{teacherDash?.completedVerificationCount ?? 0}</span>
        </div>
      </div>

      {/* ── Section Tab: Ekskul Binaan ── */}
      {supervisedEkskuls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Ekstrakurikuler Binaan ({supervisedEkskuls.length})</span>
            </h2>
            <Link href="/ekstrakurikuler" className="text-xs font-bold text-emerald-700 hover:underline">
              Kelola Semua →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {supervisedEkskuls.map((ekskul) => (
              <div
                key={ekskul.id || ekskul.name}
                className="bg-white rounded-lg p-4 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Pembina Utama
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{ekskul.name}</h3>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Anggota Aktif:</span>
                    <span className="font-bold text-slate-900">{ekskul.memberCount ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Proposal Pending:</span>
                    <span className={`font-bold ${ekskul.pendingProposalsCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
                      {ekskul.pendingProposalsCount ?? 0}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href={`/ekstrakurikuler/${ekskul.id}`}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Detail Ekskul →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Today's Teaching Schedule Widget ─────────────────────────────────── */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            Jadwal Mengajar Hari Ini ({new Date().toLocaleDateString("id-ID", { weekday: "long" })})
          </h2>
          <span className="text-xs text-slate-400 font-medium">{todaySchedules.length} Kelas</span>
        </div>

        {loadingSchedule ? (
          <p className="text-xs text-slate-400 py-3 text-center">Memuat jadwal...</p>
        ) : todaySchedules.length === 0 ? (
          <div className="bg-slate-50 rounded-md p-4 text-center text-xs text-slate-500 border border-slate-100">
            Tidak ada jadwal mengajar hari ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todaySchedules.map((sch) => (
              <div
                key={sch.id}
                className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{sch.subjectName}</span>
                  <span className="text-slate-500">Kelas: {sch.className}</span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-bold text-emerald-700 block">{sch.startTime} - {sch.endTime}</span>
                  <span className="text-slate-600 font-medium">{sch.room}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Menu Grid ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Menu Utama Guru</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className="group bg-white border border-slate-200 rounded-lg p-3.5 hover:border-emerald-700 transition-all"
              >
                <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center mb-2 transition-colors">
                  <IconComp className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{item.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">{item.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
