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
import { ShieldAlert, Settings, Plus, Upload, GraduationCap, BookOpen, Briefcase, Layers, Calendar, Sparkles } from "lucide-react";

export default function AdminPanelPage() {
  return (
    <AuthGuard allowedRoles={[USER_ROLES.ADMIN]}>
      <AdminPanelContent />
    </AuthGuard>
  );
}

function AdminPanelContent() {
  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);

  function handleSelectAssignmentForReview(assignment) {
    setSelectedAssignmentForReview(assignment);
    setActiveTab("submission-review");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Layout containing Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-[1400px] mx-auto pt-20 lg:pt-24 min-h-[calc(100vh-6rem)] gap-6 px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Role-based Sidebar Navigation */}
        <div className="hidden lg:block">
          <Sidebar role="Admin" activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content Area */}
        <main className="flex-1 py-8 overflow-y-auto space-y-6 min-w-0">
          {/* Glassmorphic Header Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-[24px] border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-extrabold text-[#2C1EE8] uppercase tracking-widest mb-1.5 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  <Sparkles className="w-3 h-3 text-[#2C1EE8]" />
                  PANEL KONTROL KESISWAAN SMKN 2 SURAKARTA
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Panel Control Center
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#2C1EE8] to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-blue-900/15 backdrop-blur-md">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-200" />
                  <span>Admin System</span>
                </span>
              </div>
            </div>

            {/* Mobile Tab Select Dropdown (For Responsive Mobile Access) */}
            <div className="lg:hidden mt-4">
              <select
                suppressHydrationWarning={true}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-extrabold text-slate-800 outline-none focus:border-[#2c1ee8] focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
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
            <div className="space-y-6">
              <AdminStatCards />

              {/* Quick Actions Bar */}
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-[24px] border border-slate-200/80 shadow-xs space-y-3">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aksi Cepat Admin</h2>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200/90 shadow-2xs transition-all duration-200 cursor-pointer group"
                  >
                    <GraduationCap className="w-4 h-4 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Siswa</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("teachers")}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200/90 shadow-2xs transition-all duration-200 cursor-pointer group"
                  >
                    <BookOpen className="w-4 h-4 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Guru</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("schedules")}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200/90 shadow-2xs transition-all duration-200 cursor-pointer group"
                  >
                    <Calendar className="w-4 h-4 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Buat Jadwal</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("departments")}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200/90 shadow-2xs transition-all duration-200 cursor-pointer group"
                  >
                    <Briefcase className="w-4 h-4 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Jurusan</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("classes")}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200/90 shadow-2xs transition-all duration-200 cursor-pointer group"
                  >
                    <Layers className="w-4 h-4 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Tambah Kelas</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#2C1EE8] hover:text-white text-slate-700 text-xs font-extrabold flex items-center gap-2 border border-slate-200/90 shadow-2xs transition-all duration-200 cursor-pointer group"
                  >
                    <Upload className="w-4 h-4 text-[#2C1EE8] group-hover:text-white transition-colors" />
                    <span>Import CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Proposal Quick Section */}
                <div className="lg:col-span-7">
                  <AdminProposalTab isQuickView={true} onViewAll={() => setActiveTab("proposals")} />
                </div>

                {/* Facility Quick Section */}
                <div className="lg:col-span-5">
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
