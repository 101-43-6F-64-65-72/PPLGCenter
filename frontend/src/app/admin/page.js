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
          {/* Top Clean Header */}
          <div className="mb-6 border-b border-slate-200 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  PANEL KONTROL KESISWAAN SMKN 2 SURAKARTA
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Panel Control Center
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Super Admin System</span>
                </span>
              </div>
            </div>

            {/* Mobile Tab Select Dropdown (For Responsive Design) */}
            <div className="lg:hidden mt-4">
              <select
                suppressHydrationWarning={true}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-xs font-bold text-slate-800 outline-none focus:border-[#2c1ee8]"
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
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2.5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi Cepat Admin</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Tambah Siswa</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("teachers")}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Tambah Guru</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("schedules")}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Buat Jadwal</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("departments")}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Tambah Jurusan</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("classes")}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>+ Tambah Kelas</span>
                  </button>

                  <button
                    suppressHydrationWarning={true}
                    onClick={() => setActiveTab("students")}
                    className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
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
