"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/layout/AuthGuard";
import { USER_ROLES } from "@/constants/userRoles";
import Sidebar from "@/components/layout/Sidebar";
import AdminStatCards from "@/components/admin/AdminStatCards";
import AdminProposalTab from "@/components/admin/AdminProposalTab";
import AdminFacilityTab from "@/components/admin/AdminFacilityTab";
import AdminAnnouncementsTab from "@/components/admin/AdminAnnouncementsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminDepartmentsTab from "@/components/admin/AdminDepartmentsTab";
import AdminClassesTab from "@/components/admin/AdminClassesTab";
import AdminExtracurricularsTab from "@/components/admin/AdminExtracurricularsTab";
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
import PasswordResetAdminTab from "@/components/admin/PasswordResetAdminTab";
import { ShieldAlert, Settings, Plus, Upload, GraduationCap, BookOpen, Briefcase, Layers, Calendar } from "lucide-react";

export default function AdminPanelPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.ADMIN]}>
      <AdminPanelContent />
    </AuthGuard>
  );
}

function AdminPanelContent() {
  // 'overview' | 'students' | 'teachers' | 'departments' | 'classes' | 'subjects' | 'teacher-subjects' | 'class-subjects' | 'schedules' | 'academic-events' | 'attendance' | 'materials' | 'assignments' | 'submission-review' | 'academic-years' | 'semesters' | 'users' | 'extracurriculars' | 'proposals' | 'facilities' | 'announcements'
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);

  function handleSelectAssignmentForReview(assignment) {
    setSelectedAssignmentForReview(assignment);
    setActiveTab("submission-review");
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Layout containing Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto pt-20 lg:pt-24 min-h-[calc(100vh-6rem)]">
        {/* Role-based Sidebar Navigation */}
        <div className="hidden lg:block">
          <Sidebar role="Admin" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {/* Banner Header (Executive Gradient Card) */}
          <div className="mb-8 space-y-6">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#071329] via-[#0f172a] to-[#2c1ee8] p-6 sm:p-8 lg:p-10 text-white shadow-xl shadow-slate-900/10 border border-white/10">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-blue-200 text-xs font-black tracking-wide border border-white/20">
                    <ShieldAlert className="w-4 h-4 text-amber-300" />
                    <span>PANEL KONTROL KESISWAAN & SUPER ADMIN</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    Panel Control Center
                  </h1>

                  <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                    Pusat kendali utama sistem Student Center SMKN 2 Surakarta. Kelola data akademik, akun pengguna, verifikasi proposal, inventaris fasilitas, dan publikasi mading digital.
                  </p>
                </div>

                {/* Quick Session Info Pill */}
                <div className="bg-white/10 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/20 space-y-1.5 shrink-0 min-w-[200px]">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>Otoritas Sesi</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 text-xs font-black border border-emerald-400/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Super Admin System</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Tab Select Dropdown (For Responsive Design) */}
            <div className="lg:hidden">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Navigasi Panel</label>
              <select
                suppressHydrationWarning={true}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 text-xs font-bold text-gray-800 outline-none focus:border-[#2c1ee8] shadow-xs"
              >
                <option value="overview">Dashboard Overview</option>
                <option value="students">Master Siswa</option>
                <option value="teachers">Master Guru</option>
                <option value="departments">Master Jurusan</option>
                <option value="classes">Master Kelas</option>
                <option value="subjects">Master Mapel</option>
                <option value="teacher-subjects">Penugasan Guru</option>
                <option value="class-subjects">Mapel Kelas</option>
                <option value="schedules">Jadwal Pelajaran</option>
                <option value="academic-events">Kalender Akademik</option>
                <option value="attendance">Absensi Pelajaran</option>
                <option value="materials">Materi Pelajaran</option>
                <option value="assignments">Tugas & Submisi</option>
                <option value="grade-categories">Kategori Penilaian</option>
                <option value="grade-scales">Skala & Predikat Nilai</option>
                <option value="academic-years">Tahun Akademik</option>
                <option value="semesters">Master Semester</option>
                <option value="users">Kelola User</option>
                <option value="extracurriculars">Kelola Ekstrakurikuler</option>
                <option value="proposals">Kelola Proposal</option>
                <option value="facilities">Kelola Booking</option>
                <option value="announcements">Kelola Mading</option>
                <option value="password-reset">Reset Password</option>
              </select>
            </div>
          </div>

          {/* Dynamic Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <AdminStatCards />

              {/* Quick Actions Bar */}
              <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Aksi Cepat Admin (Quick Actions)</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#2c1ee8] text-xs font-extrabold flex items-center gap-2 border border-blue-100 transition cursor-pointer"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>+ Tambah Siswa</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("teachers")}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center gap-2 border border-emerald-100 transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>+ Tambah Guru</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("schedules")}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center gap-2 border border-indigo-100 transition cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>+ Buat Jadwal</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("departments")}
                    className="px-4 py-2.5 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-extrabold flex items-center gap-2 border border-violet-100 transition cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>+ Tambah Jurusan</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("classes")}
                    className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-extrabold flex items-center gap-2 border border-amber-100 transition cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>+ Tambah Kelas</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-4 py-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-extrabold flex items-center gap-2 border border-cyan-100 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Proposal Quick Section */}
                <div className="lg:col-span-7">
                  <AdminProposalTab />
                </div>

                {/* Facility Quick Section */}
                <div className="lg:col-span-5">
                  <AdminFacilityTab />
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
          {activeTab === "grade-categories" && <AdminGradeCategoryTab />}
          {activeTab === "grade-scales" && <AdminGradeScaleTab />}
          {activeTab === "academic-years" && <AdminAcademicYearsTab />}
          {activeTab === "semesters" && <AdminSemestersTab />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "extracurriculars" && <AdminExtracurricularsTab />}
          {activeTab === "proposals" && <AdminProposalTab />}
          {activeTab === "facilities" && <AdminFacilityTab />}
          {activeTab === "announcements" && <AdminAnnouncementsTab />}
          {activeTab === "password-reset" && <PasswordResetAdminTab />}
        </main>
      </div>

      <Footer />
    </div>
  );
}
