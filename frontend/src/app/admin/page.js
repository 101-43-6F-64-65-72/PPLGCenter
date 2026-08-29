"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import Sidebar from "@/components/layout/Sidebar";
import AdminStatCards from "@/components/admin/AdminStatCards";
import AdminFacilityTab from "@/components/admin/AdminFacilityTab";
import AdminAnnouncementsTab from "@/components/admin/AdminAnnouncementsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminDepartmentsTab from "@/components/admin/AdminDepartmentsTab";
import AdminClassesTab from "@/components/admin/AdminClassesTab";
import AdminStudentsTab from "@/components/admin/AdminStudentsTab";
import AdminTeachersTab from "@/components/admin/AdminTeachersTab";
import AdminAcademicYearsTab from "@/components/admin/AdminAcademicYearsTab";
import AdminSemestersTab from "@/components/admin/AdminSemestersTab";
import AdminSubjectsTab from "@/components/admin/AdminSubjectsTab";
import AdminTeacherSubjectsTab from "@/components/admin/AdminTeacherSubjectsTab";
import AdminClassSubjectsTab from "@/components/admin/AdminClassSubjectsTab";
import AdminSchedulesTab from "@/components/admin/AdminSchedulesTab";
import AdminAcademicEventsTab from "@/components/admin/AdminAcademicEventsTab";
import AdminAttendanceTab from "@/components/admin/AdminAttendanceTab";
import AdminMaterialsTab from "@/components/admin/AdminMaterialsTab";
import AdminAssignmentsTab from "@/components/admin/AdminAssignmentsTab";
import AdminSubmissionReviewTab from "@/components/admin/AdminSubmissionReviewTab";
import AdminGradeCategoryTab from "@/components/admin/AdminGradeCategoryTab";
import AdminGradeScaleTab from "@/components/admin/AdminGradeScaleTab";
import AdminQuizTab from "@/components/admin/AdminQuizTab";
import PasswordResetAdminTab from "@/components/admin/PasswordResetAdminTab";
import AdminFeedbackTab from "@/components/admin/AdminFeedbackTab";
import { ShieldAlert, Settings, Plus, Upload, GraduationCap, BookOpen, Briefcase, Layers, Calendar, Sparkles, Mail, Zap, Search, X } from "lucide-react";
import Link from "next/link";

export default function AdminPanelPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.ADMIN]}>
      <AdminPanelContent />
    </AuthGuard>
  );
}

function AdminPanelContent() {
  const router = useRouter();
  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef(null);

  // All Admin Modules Definition for Global Search
  const ALL_MODULES = React.useMemo(() => [
    { id: "overview", name: "Dashboard Overview", category: "RINGKASAN", icon: Layers, keywords: "dashboard ringkasan statistik kpi" },
    { id: "students", name: "Master Siswa", category: "MASTER & AKADEMIK", icon: GraduationCap, keywords: "siswa murid student nisn kelas data siswa import csv" },
    { id: "teachers", name: "Master Guru", category: "MASTER & AKADEMIK", icon: BookOpen, keywords: "guru pengajar teacher nip mata pelajaran" },
    { id: "departments", name: "Master Jurusan", category: "MASTER & AKADEMIK", icon: Briefcase, keywords: "jurusan program keahlian pplg rpl" },
    { id: "classes", name: "Master Kelas", category: "MASTER & AKADEMIK", icon: Layers, keywords: "kelas rombel x xi xii pplg" },
    { id: "subjects", name: "Mata Pelajaran", category: "MASTER & AKADEMIK", icon: BookOpen, keywords: "mapel pelajaran kurikulum materi" },
    { id: "teacher-subjects", name: "Penugasan Guru", category: "MASTER & AKADEMIK", icon: Briefcase, keywords: "penugasan guru ajar mapel" },
    { id: "class-subjects", name: "Mapel Kelas", category: "MASTER & AKADEMIK", icon: Layers, keywords: "mapel per kelas kurikulum" },
    { id: "schedules", name: "Jadwal Pelajaran", category: "MASTER & AKADEMIK", icon: Calendar, keywords: "jadwal pelajaran roster waktu jam mengajar" },
    { id: "academic-events", name: "Kalender Akademik", category: "MASTER & AKADEMIK", icon: Calendar, keywords: "kalender agenda kegiatan libur ujian event" },
    { id: "attendance", name: "Absensi Pelajaran", category: "MASTER & AKADEMIK", icon: Layers, keywords: "absensi kehadiran presensi siswa sakit izin alpha" },
    { id: "materials", name: "Materi Pelajaran", category: "MASTER & AKADEMIK", icon: BookOpen, keywords: "materi modul dokumen upload materi bahan ajar" },
    { id: "assignments", name: "Tugas & Submisi", category: "MASTER & AKADEMIK", icon: BookOpen, keywords: "tugas pr assignment submisi review nilai tugas" },
    { id: "quiz", name: "Kontrol Kuis RPL", category: "MASTER & AKADEMIK", icon: Zap, keywords: "kuis quiz harian soal ai generator topik daily leaderboard" },
    { id: "grade-categories", name: "Kategori Penilaian", category: "MASTER & AKADEMIK", icon: Layers, keywords: "kategori penilaian bobot tugas uts uas" },
    { id: "grade-scales", name: "Skala Nilai", category: "MASTER & AKADEMIK", icon: Layers, keywords: "skala nilai predikat a b c d kkm" },
    { id: "academic-years", name: "Tahun Akademik", category: "MASTER & AKADEMIK", icon: Calendar, keywords: "tahun ajaran akademik periode" },
    { id: "semesters", name: "Master Semester", category: "MASTER & AKADEMIK", icon: Calendar, keywords: "semester ganjil genap" },
    { id: "users", name: "Kelola Akun User", category: "MANAJEMEN & SISTEM", icon: GraduationCap, keywords: "user akun login role akses password admin guru siswa" },
    { id: "facilities", name: "Fasilitas Lab PPLG", category: "MANAJEMEN & SISTEM", icon: Briefcase, keywords: "fasilitas lab sarpras booking pinjam lab komputer rpl server" },
    { id: "announcements", name: "Mading & Pengumuman", category: "MANAJEMEN & SISTEM", icon: Sparkles, keywords: "pengumuman mading berita informasi sekolah artikel broadcast" },
    { id: "feedback", name: "Umpan Balik Siswa", category: "MANAJEMEN & SISTEM", icon: Sparkles, keywords: "umpan balik saran masukan kritik respon siswa" },
    { id: "password-reset", name: "Reset Password", category: "MANAJEMEN & SISTEM", icon: ShieldAlert, keywords: "reset password kata sandi lupa terkunci" },
    { id: "email-debug", path: "/admin/email-debug", name: "Email Debugger", category: "MANAJEMEN & SISTEM", icon: Mail, keywords: "email smtp notifikasi kirim test debug replyz" },
  ], []);

  // Keyboard Shortcut: Ctrl+K or / to Focus Search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!globalSearch.trim()) return [];
    const query = globalSearch.toLowerCase().trim();
    return ALL_MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query) ||
        m.keywords.toLowerCase().includes(query)
    );
  }, [globalSearch, ALL_MODULES]);

  function handleSelectModule(mod) {
    if (mod.path) {
      router.push(mod.path);
    } else if (mod.id) {
      setActiveTab(mod.id);
    }
    setGlobalSearch("");
    setIsSearchFocused(false);
  }

  function handleSelectAssignmentForReview(assignment) {
    setSelectedAssignmentForReview(assignment);
    setActiveTab("submission-review");
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans selection:bg-[#2C1EE8] selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Layout containing Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-[1400px] mx-auto pt-20 lg:pt-24 min-h-[calc(100vh-6rem)] gap-6 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Role-based Sidebar Navigation */}
        <div className="hidden lg:block">
          <Sidebar role="Admin" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content Area */}
        <main className="flex-1 py-6 sm:py-8 overflow-y-auto space-y-6 min-w-0">
          {/* Header Card with Quick Search */}
          <div className="bg-white rounded-none border border-slate-200 p-5 sm:p-6 shadow-xs text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-[#2C1EE8] uppercase tracking-wider mb-1.5 bg-blue-50 px-2.5 py-0.5 rounded-none border border-blue-200">
                  <Sparkles className="w-3 h-3 text-[#2C1EE8]" />
                  PANEL KONTROL ADMINISTRASI PPLG CENTER
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-slate-900">
                  Panel Control Center
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-[#2C1EE8] text-white text-xs font-bold uppercase tracking-wider shadow-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-200" />
                  <span>Admin System</span>
                </span>
              </div>
            </div>

            {/* Quick Search & Command Bar */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari modul atau menu admin (Siswa, Guru, Jadwal, Kuis, User, Email)..."
                  value={globalSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-none text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#2C1EE8] outline-none transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {globalSearch ? (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch("")}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded-none shadow-2xs">
                      Ctrl+K
                    </kbd>
                  )}
                </div>
              </div>

              {/* Instant Search Results Dropdown */}
              {isSearchFocused && globalSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-lg z-30 max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-none animate-in fade-in duration-100">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">
                      Modul "{globalSearch}" tidak ditemukan.
                    </div>
                  ) : (
                    searchResults.map((mod) => {
                      const ModIcon = mod.icon || Layers;
                      return (
                        <button
                          key={mod.id || mod.path}
                          type="button"
                          onMouseDown={() => handleSelectModule(mod)}
                          className="w-full p-3 hover:bg-blue-50/80 flex items-center justify-between text-left transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 group-hover:bg-[#2C1EE8] group-hover:text-white text-slate-600 rounded-none transition-colors">
                              <ModIcon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-slate-900 group-hover:text-[#2C1EE8] block uppercase">
                                {mod.name}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {mod.category}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold font-mono text-[#2C1EE8] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                            Buka Modul →
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Mobile Tab Select Dropdown (For Responsive Mobile Access) */}
            <div className="lg:hidden">
              <select
                suppressHydrationWarning={true}
                value={activeTab}
                onChange={(e) => {
                  if (e.target.value === "email-debug") {
                    router.push("/admin/email-debug");
                  } else {
                    setActiveTab(e.target.value);
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-none py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#2c1ee8] shadow-xs transition"
              >
                <optgroup label="RINGKASAN">
                  <option value="overview">Dashboard Overview</option>
                </optgroup>

                <optgroup label="MASTER DATA & AKADEMIK">
                  <option value="students">Master Siswa</option>
                  <option value="teachers">Master Guru</option>
                  <option value="departments">Master Jurusan</option>
                  <option value="classes">Master Kelas</option>
                  <option value="subjects">Mata Pelajaran</option>
                  <option value="teacher-subjects">Penugasan Guru</option>
                  <option value="class-subjects">Mapel Kelas</option>
                  <option value="schedules">Jadwal Pelajaran</option>
                  <option value="academic-events">Kalender Akademik</option>
                  <option value="attendance">Absensi Pelajaran</option>
                  <option value="materials">Materi Pelajaran</option>
                  <option value="assignments">Tugas & Submisi</option>
                  <option value="quiz">Kontrol Kuis RPL</option>
                  <option value="grade-categories">Kategori Penilaian</option>
                  <option value="grade-scales">Skala Nilai</option>
                  <option value="academic-years">Tahun Akademik</option>
                  <option value="semesters">Master Semester</option>
                </optgroup>

                <optgroup label="MANAJEMEN & SISTEM">
                  <option value="users">Kelola Akun User</option>
                  <option value="facilities">Fasilitas Lab PPLG</option>
                  <option value="announcements">Mading & Pengumuman</option>
                  <option value="feedback">Umpan Balik Siswa</option>
                  <option value="password-reset">Reset Password</option>
                  <option value="email-debug">⚡ Email Debugger</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Dynamic Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <AdminStatCards />

              {/* Quick Actions Bar */}
              <div className="bg-white p-5 rounded-none border border-slate-200 shadow-xs space-y-3 text-left">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  AKSI CEPAT ADMIN
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-3 py-2 rounded-none bg-slate-50 hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Siswa</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("teachers")}
                    className="px-3 py-2 rounded-none bg-slate-50 hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Guru</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("schedules")}
                    className="px-3 py-2 rounded-none bg-slate-50 hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Buat Jadwal</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("quiz")}
                    className="px-3 py-2 rounded-none bg-slate-50 hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Kontrol Kuis</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("classes")}
                    className="px-3 py-2 rounded-none bg-slate-50 hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Kelas</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-3 py-2 rounded-none bg-slate-50 hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Import CSV</span>
                  </button>

                  <Link
                    href="/admin/email-debug"
                    className="px-3 py-2 rounded-none bg-blue-50 hover:bg-[#2C1EE8] hover:text-white text-[#2C1EE8] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 shadow-xs transition-colors cursor-pointer group"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Email Debugger</span>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Facility Quick Section */}
                <div>
                  <AdminFacilityTab isQuickView={true} onViewAll={() => setActiveTab("facilities")} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "students" && <AdminStudentsTab />}
          {activeTab === "teachers" && <AdminTeachersTab />}
          {activeTab === "departments" && <AdminDepartmentsTab />}
          {activeTab === "classes" && <AdminClassesTab />}
          {activeTab === "subjects" && <AdminSubjectsTab />}
          {activeTab === "teacher-subjects" && <AdminTeacherSubjectsTab />}
          {activeTab === "class-subjects" && <AdminClassSubjectsTab />}
          {activeTab === "schedules" && <AdminSchedulesTab />}
          {activeTab === "academic-events" && <AdminAcademicEventsTab />}
          {activeTab === "attendance" && <AdminAttendanceTab />}
          {activeTab === "materials" && <AdminMaterialsTab />}
          {activeTab === "assignments" && <AdminAssignmentsTab onSelectAssignmentForReview={handleSelectAssignmentForReview} />}
          {activeTab === "submission-review" && <AdminSubmissionReviewTab assignment={selectedAssignmentForReview} onBack={() => setActiveTab("assignments")} />}
          {activeTab === "quiz" && <AdminQuizTab />}
          {activeTab === "grade-categories" && <AdminGradeCategoryTab />}
          {activeTab === "grade-scales" && <AdminGradeScaleTab />}
          {activeTab === "academic-years" && <AdminAcademicYearsTab />}
          {activeTab === "semesters" && <AdminSemestersTab />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "facilities" && <AdminFacilityTab />}
          {activeTab === "announcements" && <AdminAnnouncementsTab />}
          {activeTab === "feedback" && <AdminFeedbackTab />}
          {activeTab === "password-reset" && <PasswordResetAdminTab />}
        </main>
      </div>

      <Footer />
    </div>
  );
}
